import { resolve, extname } from 'path';
import { access, constants, readFile, lstat } from 'fs/promises';
import { SupportedLanguage, RegistrationError } from '../types/index.js';

export class SecurityValidator {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly BLOCKED_PATHS = [
    '/etc',
    '/usr/bin',
    '/usr/sbin',
    '/bin',
    '/sbin',
    '/System',  // macOS system files
    '/Windows', // Windows system files
    'C:\\Windows',
    'C:\\Program Files',
  ];
  
  // Add user-specific blocked paths dynamically
  private static getBlockedPaths(): string[] {
    const paths = [...this.BLOCKED_PATHS];
    
    if (process.env.HOME) {
      paths.push(
        `${process.env.HOME}/.ssh`,
        `${process.env.HOME}/.aws`,
        `${process.env.HOME}/.config`,
        `${process.env.HOME}/.gnupg`,
        `${process.env.HOME}/.docker`
      );
    }
    
    if (process.env.USERPROFILE) {
      // Windows user paths
      paths.push(
        `${process.env.USERPROFILE}\\.ssh`,
        `${process.env.USERPROFILE}\\.aws`,
        `${process.env.USERPROFILE}\\.config`
      );
    }
    
    return paths;
  }

  static async validateFilePath(filePath: string, language: SupportedLanguage): Promise<void> {
    // Check for path traversal attempts FIRST
    if (filePath.includes('../') || filePath.includes('..\\')) {
      throw new RegistrationError(`Path traversal detected in: ${filePath}`);
    }
    
    const resolvedPath = resolve(filePath);
    
    // Check if file exists and is readable
    try {
      await access(resolvedPath, constants.R_OK);
    } catch {
      throw new RegistrationError(`Cannot read file: ${filePath}`);
    }
    
    // Get file stats using lstat to detect symbolic links
    const stats = await lstat(resolvedPath);
    
    // Check if it's a symbolic link
    if (stats.isSymbolicLink()) {
      throw new RegistrationError(`Symbolic links are not allowed: ${filePath}`);
    }
    
    // Check if it's actually a file
    if (!stats.isFile()) {
      throw new RegistrationError(`Path is not a file: ${filePath}`);
    }
    
    // Check file size
    if (stats.size > this.MAX_FILE_SIZE) {
      throw new RegistrationError(
        `File too large: ${stats.size} bytes (max ${this.MAX_FILE_SIZE} bytes)`
      );
    }
    
    // Check against blocked paths
    const blockedPaths = this.getBlockedPaths();
    for (const blockedPath of blockedPaths) {
      if (resolvedPath.startsWith(blockedPath)) {
        throw new RegistrationError(`Access to path is restricted: ${filePath}`);
      }
    }
    
    // Validate file extension
    const ext = extname(resolvedPath).slice(1).toLowerCase();
    const validExtensions = this.getValidExtensions(language);
    
    if (!validExtensions.includes(ext)) {
      throw new RegistrationError(
        `Invalid file extension .${ext} for language ${language} (expected: ${validExtensions.join(', ')})`
      );
    }
    
    // Validate file content syntax and security
    await this.validateFileContent(resolvedPath, language);
  }

  private static getValidExtensions(language: SupportedLanguage): string[] {
    const extensionMap: Record<SupportedLanguage, string[]> = {
      'python': ['py'],
      'javascript': ['js', 'mjs', 'cjs'],
      'typescript': ['ts', 'mts', 'cts'],
      'bash': ['sh', 'bash'],
      'ruby': ['rb'],
      'node': ['js', 'mjs', 'cjs']
    };
    
    return extensionMap[language] || [];
  }

  private static async validateFileContent(filePath: string, language: SupportedLanguage): Promise<void> {
    // Read file content
    const content = await readFile(filePath, 'utf-8');
    
    // Check for empty files
    if (!content.trim()) {
      throw new RegistrationError('File is empty');
    }
    
    // Check for common malicious patterns
    const suspiciousPatterns: Array<{ pattern: RegExp; description: string }> = [
      { pattern: /eval\s*\([^)]*\)/, description: 'eval() calls' },
      { pattern: /exec\s*\([^)]*\)/, description: 'exec() calls' },
      { pattern: /__import__/, description: 'Python dynamic imports' },
      { pattern: /require\s*\([^'"][^)]*\)/, description: 'Dynamic requires in JS' },
      { pattern: /rm\s+-rf\s+\//, description: 'Dangerous rm commands' },
      { pattern: /chmod\s+777/, description: 'Overly permissive chmod' },
      { pattern: /curl\s+.*\|\s*sh/, description: 'Curl piped to shell' },
      { pattern: /wget\s+.*\|\s*sh/, description: 'Wget piped to shell' },
      { pattern: /os\.system/, description: 'Python os.system calls' },
      { pattern: /subprocess\.call.*shell\s*=\s*True/, description: 'Python subprocess with shell=True' },
      { pattern: /child_process\.exec[^S]/, description: 'Node.js exec without Sync' },
    ];
    
    for (const { pattern, description } of suspiciousPatterns) {
      if (pattern.test(content)) {
        throw new RegistrationError(
          `File contains potentially dangerous code pattern (${description})`
        );
      }
    }
    
    // Language-specific validation
    this.validateMainFunction(content, language);
  }
  
  private static validateMainFunction(content: string, language: SupportedLanguage): void {
    let hasMainFunction = false;
    
    switch (language) {
      case 'python':
        // Check for def main with various formatting
        hasMainFunction = /def\s+main\s*\(/.test(content) || 
                         /async\s+def\s+main\s*\(/.test(content);
        if (!hasMainFunction) {
          throw new RegistrationError('Python file must define a main function');
        }
        break;
        
      case 'javascript':
      case 'node':
        // Check for various JavaScript function definitions
        hasMainFunction = /function\s+main\s*\(/.test(content) ||
                         /const\s+main\s*=/.test(content) ||
                         /let\s+main\s*=/.test(content) ||
                         /var\s+main\s*=/.test(content) ||
                         /async\s+function\s+main/.test(content) ||
                         /exports\.main\s*=/.test(content) ||
                         /module\.exports\.main\s*=/.test(content);
        if (!hasMainFunction) {
          throw new RegistrationError('JavaScript file must define a main function');
        }
        break;
        
      case 'typescript':
        // TypeScript can have type annotations
        hasMainFunction = /function\s+main\s*\(/.test(content) ||
                         /const\s+main\s*[:=]/.test(content) ||
                         /let\s+main\s*[:=]/.test(content) ||
                         /async\s+function\s+main/.test(content) ||
                         /export\s+function\s+main/.test(content) ||
                         /export\s+const\s+main/.test(content) ||
                         /export\s+async\s+function\s+main/.test(content);
        if (!hasMainFunction) {
          throw new RegistrationError('TypeScript file must define a main function');
        }
        break;
        
      case 'bash':
        // Check for bash function definitions
        hasMainFunction = /main\s*\(\s*\)\s*{/.test(content) ||
                         /function\s+main\s*\(/.test(content) ||
                         /function\s+main\s*{/.test(content);
        if (!hasMainFunction) {
          throw new RegistrationError('Bash file must define a main function');
        }
        break;
        
      case 'ruby':
        // Check for Ruby method definitions
        hasMainFunction = /def\s+main/.test(content);
        if (!hasMainFunction) {
          throw new RegistrationError('Ruby file must define a main method');
        }
        break;
        
      default:
        throw new RegistrationError(`Unsupported language: ${language}`);
    }
  }
  
  // Additional method to sanitize file paths for display
  static sanitizePath(filePath: string): string {
    // Remove sensitive information from paths for error messages
    const home = process.env.HOME || process.env.USERPROFILE || '';
    if (home && filePath.startsWith(home)) {
      return filePath.replace(home, '~');
    }
    return filePath;
  }
}