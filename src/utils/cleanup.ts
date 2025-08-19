import { rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Clean up temporary files created during execution
 */
export async function cleanupTempFiles(): Promise<void> {
  const tempDir = tmpdir();

  // Clean up temp files with our UUID pattern
  // Only clean files that match our specific pattern to avoid removing other temp files
  try {
    const { readdir } = await import('fs/promises');
    const files = await readdir(tempDir);

    // Match files that look like our UUID-based temp files
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(py|js|ts|sh|rb)$/;

    const cleanupPromises = files
      .filter((file) => uuidPattern.test(file))
      .map((file) =>
        rm(join(tempDir, file), { force: true }).catch(() => {
          // Ignore individual file cleanup errors
        })
      );

    await Promise.all(cleanupPromises);
  } catch {
    // If we can't read the temp directory, that's okay
    // This is best-effort cleanup
  }
}
