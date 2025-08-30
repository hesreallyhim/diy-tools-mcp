import { readFile, readdir } from 'fs/promises';
import { join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Map file extensions to MIME types
const MIME_TYPES: Record<string, string> = {
  '.py': 'text/x-python',
  '.js': 'text/javascript',
  '.sh': 'text/x-shellscript',
  '.rb': 'text/x-ruby',
};

export interface ExampleResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export class ExampleResourceManager {
  private resourcesPath: string;
  private resources: Map<string, ExampleResource> = new Map();

  constructor() {
    // Resources are copied to dist/resources/examples during build
    this.resourcesPath = join(__dirname, 'examples');
  }

  async initialize(): Promise<void> {
    try {
      await this.scanExamples();
      logger.info(`Initialized ${this.resources.size} example resources`);
    } catch (error) {
      logger.error('Failed to initialize example resources', { error });
      // Not fatal - server can run without example resources
    }
  }

  private async scanExamples(): Promise<void> {
    const languages = ['python', 'javascript', 'bash', 'ruby', 'entry-points'];

    for (const lang of languages) {
      const langPath = join(this.resourcesPath, lang);

      try {
        const files = await readdir(langPath);

        for (const file of files) {
          const ext = extname(file);
          if (MIME_TYPES[ext]) {
            const uri = `example://${lang}/${file}`;
            const resource: ExampleResource = {
              uri,
              name: basename(file, ext),
              description: `Example ${lang} function: ${basename(file, ext)}`,
              mimeType: MIME_TYPES[ext],
            };

            this.resources.set(uri, resource);
          }
        }
      } catch {
        // Directory might not exist
        logger.debug(`No examples found for ${lang}`);
      }
    }
  }

  listResources(): ExampleResource[] {
    return Array.from(this.resources.values());
  }

  async readResource(
    uri: string
  ): Promise<{ uri: string; mimeType?: string; text: string } | null> {
    const resource = this.resources.get(uri);
    if (!resource) {
      return null;
    }

    try {
      // Convert URI to file path
      // example://python/simple_math.py -> examples/python/simple_math.py
      const parts = uri.replace('example://', '').split('/');
      const filePath = join(this.resourcesPath, ...parts);

      const content = await readFile(filePath, 'utf-8');

      return {
        uri: resource.uri,
        mimeType: resource.mimeType,
        text: content,
      };
    } catch (error) {
      logger.error(`Failed to read resource ${uri}`, { error });
      return null;
    }
  }
}
