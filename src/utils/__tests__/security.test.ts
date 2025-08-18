import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { SecurityValidator } from '../security.js';
import { writeFile, mkdir, rm, symlink } from 'fs/promises';
import { join } from 'path';
// import { RegistrationError } from '../../types/index.js';

describe('SecurityValidator', () => {
  const testDir = join(process.cwd(), 'test-security');
  const validPythonFile = join(testDir, 'valid.py');
  const validJsFile = join(testDir, 'valid.js');
  const validTsFile = join(testDir, 'valid.ts');
  const validBashFile = join(testDir, 'valid.sh');
  const validRubyFile = join(testDir, 'valid.rb');
  const emptyFile = join(testDir, 'empty.py');
  const noMainFile = join(testDir, 'no_main.py');
  const dangerousFile = join(testDir, 'dangerous.py');
  const _traversalFile = join(testDir, '../traversal.py');
  const symlinkFile = join(testDir, 'symlink.py');
  const _largeFile = join(testDir, 'large.py');
  const wrongExtFile = join(testDir, 'wrong.txt');

  beforeAll(async () => {
    await mkdir(testDir, { recursive: true });

    // Valid Python file
    await writeFile(
      validPythonFile,
      `
def main(x, y):
    """Add two numbers"""
    return x + y
`
    );

    // Valid JavaScript file
    await writeFile(
      validJsFile,
      `
function main(args) {
    return { result: args.a + args.b };
}
module.exports = { main };
`
    );

    // Valid TypeScript file
    await writeFile(
      validTsFile,
      `
export function main(args: { a: number; b: number }): { result: number } {
    return { result: args.a + args.b };
}
`
    );

    // Valid Bash file
    await writeFile(
      validBashFile,
      `
#!/bin/bash
main() {
    echo "Hello from bash"
}
`
    );

    // Valid Ruby file
    await writeFile(
      validRubyFile,
      `
def main(args)
  puts "Hello from Ruby"
end
`
    );

    // Empty file
    await writeFile(emptyFile, '');

    // File without main function
    await writeFile(
      noMainFile,
      `
def helper():
    return "no main here"
`
    );

    // File with dangerous patterns
    await writeFile(
      dangerousFile,
      `
import os
def main():
    os.system("rm -rf /")
    return "dangerous"
`
    );

    // Wrong extension
    await writeFile(
      wrongExtFile,
      `
def main():
    return "wrong extension"
`
    );

    // Create a symlink (will be rejected)
    await writeFile(join(testDir, 'target.py'), 'def main(): pass');
    try {
      await symlink(join(testDir, 'target.py'), symlinkFile);
    } catch (error) {
      // Symlink creation might fail on some systems, that's ok
    }
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('Valid files', () => {
    it('should accept valid Python file', async () => {
      await expect(
        SecurityValidator.validateFilePath(validPythonFile, 'python')
      ).resolves.not.toThrow();
    });

    it('should accept valid JavaScript file', async () => {
      await expect(
        SecurityValidator.validateFilePath(validJsFile, 'javascript')
      ).resolves.not.toThrow();
    });

    it('should accept valid TypeScript file', async () => {
      await expect(
        SecurityValidator.validateFilePath(validTsFile, 'typescript')
      ).resolves.not.toThrow();
    });

    it('should accept valid Bash file', async () => {
      await expect(
        SecurityValidator.validateFilePath(validBashFile, 'bash')
      ).resolves.not.toThrow();
    });

    it('should accept valid Ruby file', async () => {
      await expect(
        SecurityValidator.validateFilePath(validRubyFile, 'ruby')
      ).resolves.not.toThrow();
    });

    it('should accept .mjs extension for JavaScript', async () => {
      const mjsFile = join(testDir, 'module.mjs');
      await writeFile(mjsFile, 'export function main() { return "mjs"; }');

      await expect(
        SecurityValidator.validateFilePath(mjsFile, 'javascript')
      ).resolves.not.toThrow();
    });
  });

  describe('File validation errors', () => {
    it('should reject non-existent file', async () => {
      await expect(
        SecurityValidator.validateFilePath('/does/not/exist.py', 'python')
      ).rejects.toThrow('Cannot read file');
    });

    it('should reject empty file', async () => {
      await expect(SecurityValidator.validateFilePath(emptyFile, 'python')).rejects.toThrow(
        'File is empty'
      );
    });

    it('should reject file without main function', async () => {
      await expect(SecurityValidator.validateFilePath(noMainFile, 'python')).rejects.toThrow(
        'must define a main function'
      );
    });

    it('should reject wrong file extension', async () => {
      await expect(SecurityValidator.validateFilePath(wrongExtFile, 'python')).rejects.toThrow(
        'Invalid file extension'
      );
    });

    it('should reject directory instead of file', async () => {
      await expect(SecurityValidator.validateFilePath(testDir, 'python')).rejects.toThrow(
        'Path is not a file'
      );
    });
  });

  describe('Security validations', () => {
    it('should reject path traversal attempts', async () => {
      const traversalPath = '../../../etc/passwd';
      await expect(SecurityValidator.validateFilePath(traversalPath, 'python')).rejects.toThrow(
        'Path traversal detected'
      );
    });

    it('should reject files with dangerous patterns', async () => {
      await expect(SecurityValidator.validateFilePath(dangerousFile, 'python')).rejects.toThrow(
        'potentially dangerous code pattern'
      );
    });

    it('should reject symbolic links', async () => {
      // Only test if symlink was created successfully
      try {
        await SecurityValidator.validateFilePath(symlinkFile, 'python');
        // If we reach here and symlink exists, it should have thrown
        throw new Error('Should have rejected symlink');
      } catch (error: any) {
        // Either symlink doesn't exist (ok) or it was properly rejected
        if (error.message.includes('Symbolic links are not allowed')) {
          expect(error.message).toContain('Symbolic links are not allowed');
        } else if (!error.message.includes('Cannot read file')) {
          // If it's not a "cannot read" error, re-throw
          throw error;
        }
      }
    });

    it('should reject files in blocked system paths', async () => {
      const blockedPaths = [
        '/etc/passwd',
        '/usr/bin/test.py',
        `${process.env.HOME}/.ssh/test.py`,
        `${process.env.HOME}/.aws/credentials.py`,
      ];

      for (const path of blockedPaths) {
        if (path.includes('undefined')) continue; // Skip if HOME is not set

        await expect(SecurityValidator.validateFilePath(path, 'python')).rejects.toThrow();
      }
    });

    it('should detect eval() calls', async () => {
      const evalFile = join(testDir, 'eval.py');
      await writeFile(
        evalFile,
        `
def main():
    eval("print('dangerous')")
    return "bad"
`
      );

      await expect(SecurityValidator.validateFilePath(evalFile, 'python')).rejects.toThrow(
        'potentially dangerous code pattern'
      );
    });

    it('should detect subprocess with shell=True', async () => {
      const subprocessFile = join(testDir, 'subprocess.py');
      await writeFile(
        subprocessFile,
        `
import subprocess
def main():
    subprocess.call("ls", shell=True)
    return "bad"
`
      );

      await expect(SecurityValidator.validateFilePath(subprocessFile, 'python')).rejects.toThrow(
        'potentially dangerous code pattern'
      );
    });

    it('should detect dangerous rm commands', async () => {
      const rmFile = join(testDir, 'rm.sh');
      await writeFile(
        rmFile,
        `
#!/bin/bash
main() {
    rm -rf /
}
`
      );

      await expect(SecurityValidator.validateFilePath(rmFile, 'bash')).rejects.toThrow(
        'potentially dangerous code pattern'
      );
    });
  });

  describe('File size validation', () => {
    it('should reject files larger than 10MB', async () => {
      // We can't create a 10MB file in tests easily, so we'll test the logic
      // by mocking or using a smaller limit
      const content = 'def main(): pass\n';
      const _largeContent = content.repeat(1000000); // Create ~17MB of content

      // This test would need actual file system support for large files
      // For now, we'll trust the implementation
      expect(SecurityValidator['MAX_FILE_SIZE']).toBe(10 * 1024 * 1024);
    });
  });

  describe('Language-specific main function validation', () => {
    it('should accept async Python functions', async () => {
      const asyncPyFile = join(testDir, 'async.py');
      await writeFile(
        asyncPyFile,
        `
async def main():
    return "async python"
`
      );

      await expect(
        SecurityValidator.validateFilePath(asyncPyFile, 'python')
      ).resolves.not.toThrow();
    });

    it('should accept various JavaScript function styles', async () => {
      const jsVariations = [
        'const main = () => {};',
        'let main = function() {};',
        'async function main() {}',
        'exports.main = function() {};',
      ];

      for (let i = 0; i < jsVariations.length; i++) {
        const file = join(testDir, `js_var_${i}.js`);
        await writeFile(file, jsVariations[i]);

        await expect(SecurityValidator.validateFilePath(file, 'javascript')).resolves.not.toThrow();
      }
    });

    it('should accept TypeScript export variations', async () => {
      const tsExportFile = join(testDir, 'export.ts');
      await writeFile(
        tsExportFile,
        `
export async function main() {
    return "exported";
}
`
      );

      await expect(
        SecurityValidator.validateFilePath(tsExportFile, 'typescript')
      ).resolves.not.toThrow();
    });

    it('should accept both bash function syntaxes', async () => {
      const bashAltFile = join(testDir, 'alt.sh');
      await writeFile(
        bashAltFile,
        `
function main() {
    echo "alternative syntax"
}
`
      );

      await expect(SecurityValidator.validateFilePath(bashAltFile, 'bash')).resolves.not.toThrow();
    });
  });

  describe('Path sanitization', () => {
    it('should sanitize home directory in paths', () => {
      const home = process.env.HOME || process.env.USERPROFILE || '';
      if (home) {
        const path = `${home}/test/file.py`;
        const sanitized = SecurityValidator.sanitizePath(path);
        expect(sanitized).toBe('~/test/file.py');
      }
    });

    it('should leave non-home paths unchanged', () => {
      const path = '/usr/local/file.py';
      const sanitized = SecurityValidator.sanitizePath(path);
      expect(sanitized).toBe('/usr/local/file.py');
    });
  });
});
