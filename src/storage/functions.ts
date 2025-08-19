import { readFile, writeFile, readdir, mkdir, unlink, copyFile, access } from 'fs/promises';
import { join, resolve } from 'path';
import {
  StoredFunction,
  FunctionSpecification,
  isFileBasedFunction,
  isInlineFunction,
} from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const FUNCTIONS_DIR = join(process.cwd(), 'functions');
const FUNCTION_CODE_DIR = join(process.cwd(), 'function-code');

export class FunctionStorage {
  constructor() {
    // Directories will be created on first operation
  }

  private async ensureDirectoriesExist(): Promise<void> {
    // Check and create FUNCTIONS_DIR if needed
    try {
      await access(FUNCTIONS_DIR);
    } catch {
      await mkdir(FUNCTIONS_DIR, { recursive: true });
    }

    // Check and create FUNCTION_CODE_DIR if needed
    try {
      await access(FUNCTION_CODE_DIR);
    } catch {
      await mkdir(FUNCTION_CODE_DIR, { recursive: true });
    }
  }

  private getLanguageExtension(language: string): string {
    switch (language) {
      case 'python':
        return 'py';
      case 'javascript':
      case 'node':
        return 'js';
      case 'typescript':
        return 'ts';
      case 'bash':
        return 'sh';
      case 'ruby':
        return 'rb';
      default:
        return 'txt';
    }
  }

  async save(spec: FunctionSpecification): Promise<StoredFunction> {
    await this.ensureDirectoriesExist();

    const finalSpec = { ...spec };

    // If codePath is provided, copy the file to our managed directory
    if (isFileBasedFunction(spec) && spec.codePath) {
      const sourceFile = resolve(spec.codePath);
      // Preserve the original file extension
      const ext = sourceFile.substring(sourceFile.lastIndexOf('.') + 1);
      const destFile = join(FUNCTION_CODE_DIR, `${spec.name}.${ext}`);

      // Copy the file to our managed directory
      await copyFile(sourceFile, destFile);

      // Update the spec to use relative path from project root
      finalSpec.codePath = `function-code/${spec.name}.${ext}`;
      delete finalSpec.code; // Ensure no inline code
    }

    const storedFunction: StoredFunction = {
      ...finalSpec,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const filename = `${spec.name}.json`;
    const filepath = join(FUNCTIONS_DIR, filename);

    await writeFile(filepath, JSON.stringify(storedFunction, null, 2));

    return storedFunction;
  }

  async update(name: string, spec: FunctionSpecification): Promise<StoredFunction | null> {
    const existing = await this.load(name);
    if (!existing) {
      return null;
    }

    const finalSpec = { ...spec };

    // If switching to file-based, copy the file
    if (isFileBasedFunction(spec) && spec.codePath) {
      const sourceFile = resolve(spec.codePath);
      // Preserve the original file extension
      const ext = sourceFile.substring(sourceFile.lastIndexOf('.') + 1);
      const destFile = join(FUNCTION_CODE_DIR, `${spec.name}.${ext}`);

      await copyFile(sourceFile, destFile);
      finalSpec.codePath = `function-code/${spec.name}.${ext}`;
      delete finalSpec.code;
    }

    // If switching to inline, remove the code file
    if (isInlineFunction(spec) && existing.codePath) {
      // Extract extension from existing codePath
      const ext = existing.codePath.substring(existing.codePath.lastIndexOf('.') + 1);
      const codeFile = join(FUNCTION_CODE_DIR, `${name}.${ext}`);
      try {
        await unlink(codeFile);
      } catch {
        // File might not exist, that's okay
      }
    }

    const updated: StoredFunction = {
      ...existing,
      ...finalSpec,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    const filename = `${name}.json`;
    const filepath = join(FUNCTIONS_DIR, filename);

    await writeFile(filepath, JSON.stringify(updated, null, 2));

    return updated;
  }

  async load(name: string): Promise<StoredFunction | null> {
    try {
      const filename = `${name}.json`;
      const filepath = join(FUNCTIONS_DIR, filename);

      const content = await readFile(filepath, 'utf-8');
      return JSON.parse(content) as StoredFunction;
    } catch {
      return null;
    }
  }

  async loadAll(): Promise<StoredFunction[]> {
    await this.ensureDirectoriesExist();

    try {
      const files = await readdir(FUNCTIONS_DIR);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      const functions = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const content = await readFile(join(FUNCTIONS_DIR, file), 'utf-8');
            return JSON.parse(content) as StoredFunction;
          } catch {
            console.error(`Failed to load function from ${file}`);
            return null;
          }
        })
      );

      return functions.filter((f): f is StoredFunction => f !== null);
    } catch {
      console.error('Failed to load functions');
      return [];
    }
  }

  async delete(name: string): Promise<boolean> {
    try {
      // Load the function to check if it has a code file
      const func = await this.load(name);

      // Delete the metadata file
      const filename = `${name}.json`;
      const filepath = join(FUNCTIONS_DIR, filename);
      await unlink(filepath);

      // If it's a file-based function, delete the code file too
      if (func && func.codePath) {
        // Extract extension from codePath
        const ext = func.codePath.substring(func.codePath.lastIndexOf('.') + 1);
        const codeFile = join(FUNCTION_CODE_DIR, `${name}.${ext}`);
        try {
          await unlink(codeFile);
        } catch {
          // Code file might not exist, that's okay
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  async loadFunctionCode(func: StoredFunction): Promise<string> {
    if (isInlineFunction(func) && func.code) {
      return func.code;
    }

    if (isFileBasedFunction(func) && func.codePath) {
      const fullPath = join(process.cwd(), func.codePath);
      return await readFile(fullPath, 'utf-8');
    }

    throw new Error('Function has neither code nor codePath');
  }

  async exists(name: string): Promise<boolean> {
    const filename = `${name}.json`;
    const filepath = join(FUNCTIONS_DIR, filename);
    try {
      await access(filepath);
      return true;
    } catch {
      return false;
    }
  }
}
