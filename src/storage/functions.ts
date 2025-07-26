import { readFile, writeFile, readdir, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { StoredFunction, FunctionSpecification } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const FUNCTIONS_DIR = join(process.cwd(), 'functions');

export class FunctionStorage {
  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    if (!existsSync(FUNCTIONS_DIR)) {
      await mkdir(FUNCTIONS_DIR, { recursive: true });
    }
  }

  async save(spec: FunctionSpecification): Promise<StoredFunction> {
    await this.ensureDirectoryExists();
    
    const storedFunction: StoredFunction = {
      ...spec,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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

    const updated: StoredFunction = {
      ...existing,
      ...spec,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
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
    } catch (error) {
      return null;
    }
  }

  async loadAll(): Promise<StoredFunction[]> {
    await this.ensureDirectoryExists();
    
    try {
      const files = await readdir(FUNCTIONS_DIR);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      const functions = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const content = await readFile(join(FUNCTIONS_DIR, file), 'utf-8');
            return JSON.parse(content) as StoredFunction;
          } catch (error) {
            console.error(`Failed to load function from ${file}:`, error);
            return null;
          }
        })
      );
      
      return functions.filter((f): f is StoredFunction => f !== null);
    } catch (error) {
      console.error('Failed to load functions:', error);
      return [];
    }
  }

  async delete(name: string): Promise<boolean> {
    try {
      const filename = `${name}.json`;
      const filepath = join(FUNCTIONS_DIR, filename);
      
      await unlink(filepath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(name: string): Promise<boolean> {
    const filename = `${name}.json`;
    const filepath = join(FUNCTIONS_DIR, filename);
    return existsSync(filepath);
  }
}