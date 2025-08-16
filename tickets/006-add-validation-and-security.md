# Ticket 006: Add Validation for File Paths and Security

## Overview
Implement comprehensive validation and security measures for file-based functions to prevent security vulnerabilities.

## Requirements
1. Validate file paths to prevent directory traversal attacks
2. Implement file size limits
3. Check file permissions and ownership
4. Prevent access to sensitive system files
5. Validate file content matches declared language

## Implementation Details

### Create src/utils/security.ts

```typescript
import { resolve, relative, dirname } from 'path';
import { stat, access, constants } from 'fs/promises';
import { getLanguageExtension } from './language.js';

export class SecurityValidator {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly BLOCKED_PATHS = [
    '/etc',
    '/usr/bin',
    '/usr/sbin',
    '/bin',
    '/sbin',
    process.env.HOME + '/.ssh',
    process.env.HOME + '/.aws',
    process.env.HOME + '/.config'
  ];

  static async validateFilePath(filePath: string, language: SupportedLanguage): Promise<void> {
    const resolvedPath = resolve(filePath);
    
    // Check if file exists and is readable
    try {
      await access(resolvedPath, constants.R_OK);
    } catch {
      throw new ValidationError(`Cannot read file: ${filePath}`);
    }
    
    // Get file stats
    const stats = await stat(resolvedPath);
    
    // Check if it's actually a file
    if (!stats.isFile()) {
      throw new ValidationError(`Path is not a file: ${filePath}`);
    }
    
    // Check if it's a symbolic link
    if (stats.isSymbolicLink()) {
      throw new ValidationError(`Symbolic links are not allowed: ${filePath}`);
    }
    
    // Check file size
    if (stats.size > this.MAX_FILE_SIZE) {
      throw new ValidationError(
        `File too large: ${stats.size} bytes (max ${this.MAX_FILE_SIZE} bytes)`
      );
    }
    
    // Check against blocked paths
    for (const blockedPath of this.BLOCKED_PATHS) {
      if (resolvedPath.startsWith(blockedPath)) {
        throw new ValidationError(`Access to path is restricted: ${filePath}`);
      }
    }
    
    // Validate file extension
    const ext = extname(resolvedPath).slice(1);
    const expectedExt = getLanguageExtension(language);
    
    if (ext !== expectedExt) {
      // Allow some flexibility for common variations
      const validExtensions = this.getValidExtensions(language);
      if (!validExtensions.includes(ext)) {
        throw new ValidationError(
          `Invalid file extension .${ext} for language ${language}`
        );
      }
    }
    
    // Validate file content syntax
    await this.validateFileSyntax(resolvedPath, language);
  }

  private static getValidExtensions(language: SupportedLanguage): string[] {
    const extensionMap: Record<SupportedLanguage, string[]> = {
      'python': ['py'],
      'javascript': ['js', 'mjs'],
      'typescript': ['ts'],
      'bash': ['sh', 'bash'],
      'ruby': ['rb'],
      'node': ['js', 'mjs']
    };
    
    return extensionMap[language] || [];
  }

  private static async validateFileSyntax(filePath: string, language: SupportedLanguage): Promise<void> {
    // Read first few lines to do basic validation
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n').slice(0, 50);
    
    // Check for common malicious patterns
    const suspiciousPatterns = [
      /eval\s*\(/,           // eval() calls
      /exec\s*\(/,           // exec() calls
      /__import__/,          // Python dynamic imports
      /require\s*\([^'"]/,   // Dynamic requires in JS
      /rm\s+-rf\s+\//,       // Dangerous rm commands
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        throw new ValidationError(
          `File contains potentially dangerous code pattern: ${pattern}`
        );
      }
    }
    
    // Language-specific validation
    switch (language) {
      case 'python':
        if (!content.includes('def main')) {
          throw new ValidationError('Python file must define a main function');
        }
        break;
      case 'javascript':
      case 'node':
        if (!content.includes('function main') && !content.includes('const main') && !content.includes('async function main')) {
          throw new ValidationError('JavaScript file must define a main function');
        }
        break;
      case 'bash':
        if (!content.includes('main()') && !content.includes('function main')) {
          throw new ValidationError('Bash file must define a main function');
        }
        break;
    }
  }
}
```

### Update src/tools/validator.ts

```typescript
import { SecurityValidator } from '../utils/security.js';

export class FunctionValidator {
  async validate(spec: FunctionSpecification): Promise<void> {
    // Existing validation...
    
    // Add file-based validation
    if (spec.codePath) {
      await SecurityValidator.validateFilePath(spec.codePath, spec.language);
    }
    
    // Continue with existing validation...
  }
}
```

## Security Considerations
- Prevent directory traversal attacks
- Block access to sensitive system directories
- Limit file sizes to prevent DoS
- Check for dangerous code patterns
- Validate file ownership and permissions
- Prevent symbolic link exploitation

## Testing
- Test with valid file paths
- Test with directory traversal attempts (../, etc.)
- Test with symbolic links
- Test with large files
- Test with files in restricted directories
- Test with files containing dangerous patterns
- Test with files missing main function

## Acceptance Criteria
- [ ] File path validation implemented
- [ ] Size limits enforced
- [ ] Blocked paths checked
- [ ] Symbolic links rejected
- [ ] Dangerous patterns detected
- [ ] Main function validation works
- [ ] Clear security error messages