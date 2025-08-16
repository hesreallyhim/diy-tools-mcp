// Temporary test file for testing the updated storage layer functionality
// Context: Testing ticket 002 - Update Storage Layer to Handle File References
// This tests both inline and file-based function storage

import { FunctionStorage } from './src/storage/functions.js';
import { FunctionSpecification } from './src/types/index.js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

async function testStorageLayer() {
  console.log('Testing Storage Layer Updates...\n');
  
  const storage = new FunctionStorage();
  
  // Clean up any existing test data
  const testCodeFile = join(process.cwd(), 'test-function.py');
  const functionCodeDir = join(process.cwd(), 'function-code');
  
  // Create a test Python file
  await writeFile(testCodeFile, `def add_numbers(a, b):
    return a + b
`);
  
  try {
    // Test 1: Save inline function (backward compatibility)
    console.log('Test 1: Saving inline function...');
    const inlineSpec: FunctionSpecification = {
      name: 'inline_test',
      description: 'Test inline function',
      language: 'javascript',
      code: 'function test() { return "inline"; }',
      parameters: {
        type: 'object',
        properties: {}
      }
    };
    
    const inlineStored = await storage.save(inlineSpec);
    console.log('✓ Inline function saved:', inlineStored.name);
    console.log('  Has code:', !!inlineStored.code);
    console.log('  Has codePath:', !!inlineStored.codePath);
    
    // Test 2: Save file-based function
    console.log('\nTest 2: Saving file-based function...');
    const fileSpec: FunctionSpecification = {
      name: 'file_test',
      description: 'Test file-based function',
      language: 'python',
      codePath: testCodeFile,
      parameters: {
        type: 'object',
        properties: {
          a: { type: 'number' },
          b: { type: 'number' }
        },
        required: ['a', 'b']
      }
    };
    
    const fileStored = await storage.save(fileSpec);
    console.log('✓ File-based function saved:', fileStored.name);
    console.log('  Has code:', !!fileStored.code);
    console.log('  Has codePath:', fileStored.codePath);
    
    // Check if the code file was copied
    const copiedFile = join(functionCodeDir, 'file_test.py');
    console.log('  Code file exists:', existsSync(copiedFile));
    
    // Test 3: Load function code for both types
    console.log('\nTest 3: Loading function code...');
    
    const inlineCode = await storage.loadFunctionCode(inlineStored);
    console.log('✓ Inline code loaded:', inlineCode.substring(0, 30) + '...');
    
    const fileCode = await storage.loadFunctionCode(fileStored);
    console.log('✓ File-based code loaded:', fileCode.substring(0, 30) + '...');
    
    // Test 4: Update from inline to file-based
    console.log('\nTest 4: Updating inline to file-based...');
    const updateSpec: FunctionSpecification = {
      name: 'inline_test',
      description: 'Updated to file-based',
      language: 'python',
      codePath: testCodeFile,
      parameters: {
        type: 'object',
        properties: {}
      }
    };
    
    const updated = await storage.update('inline_test', updateSpec);
    if (updated) {
      console.log('✓ Function updated to file-based');
      console.log('  Has code:', !!updated.code);
      console.log('  Has codePath:', updated.codePath);
    }
    
    // Test 5: Delete file-based function
    console.log('\nTest 5: Deleting file-based function...');
    const deleted = await storage.delete('file_test');
    console.log('✓ Function deleted:', deleted);
    
    // Check if code file was also deleted
    const codeFileExists = existsSync(copiedFile);
    console.log('  Code file cleaned up:', !codeFileExists);
    
    // Clean up
    await storage.delete('inline_test');
    await rm(testCodeFile, { force: true });
    
    console.log('\n✅ All storage layer tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    // Clean up on error
    await rm(testCodeFile, { force: true });
  }
}

// Run the tests
testStorageLayer().catch(console.error);