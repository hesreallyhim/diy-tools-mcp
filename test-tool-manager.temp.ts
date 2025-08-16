// Temporary test file for testing updated Tool Manager functionality
// Context: Testing ticket 004 - Update Tool Manager for File-Based Functions
// This tests both inline and file-based function registration

import { ToolManager } from './src/tools/manager.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { FunctionSpecification } from './src/types/index.js';
import { writeFile, rm } from 'fs/promises';
import { join } from 'path';

async function testToolManager() {
  console.log('Testing Tool Manager Updates...\n');
  
  // Create a mock server
  const mockServer = {
    notification: () => {}
  } as unknown as Server;
  
  const manager = new ToolManager(mockServer);
  await manager.initialize();
  
  // Create test Python file
  const testPyFile = join(process.cwd(), 'test_calculator.py');
  await writeFile(testPyFile, `
import json
import sys

def main(x, y, operation="add"):
    if operation == "add":
        return {"result": x + y}
    elif operation == "multiply":
        return {"result": x * y}
    else:
        return {"error": "Unknown operation"}

if __name__ == "__main__":
    try:
        args = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
        result = main(**args)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
`);

  // Create test JS file
  const testJsFile = join(process.cwd(), 'test_string_utils.js');
  await writeFile(testJsFile, `
function main(args) {
  const { text, action = "uppercase" } = args;
  
  switch (action) {
    case "uppercase":
      return { result: text.toUpperCase() };
    case "lowercase":
      return { result: text.toLowerCase() };
    case "reverse":
      return { result: text.split('').reverse().join('') };
    default:
      return { error: "Unknown action" };
  }
}

module.exports = { main };
`);

  try {
    // Test 1: Try to add tool with both code and codePath (should fail)
    console.log('Test 1: Attempt to add tool with both code and codePath...');
    try {
      const invalidSpec: FunctionSpecification = {
        name: 'invalid_tool',
        description: 'This should fail',
        language: 'python',
        code: 'def main(): pass',
        codePath: testPyFile,
        parameters: { type: 'object', properties: {} }
      };
      await manager.addTool(invalidSpec);
      console.log('❌ Should have thrown error for both code and codePath');
    } catch (error: any) {
      if (error.message.includes('Cannot specify both code and codePath')) {
        console.log('✓ Correctly rejected tool with both code and codePath');
      } else {
        throw error;
      }
    }
    
    // Test 2: Try to add tool with neither code nor codePath (should fail)
    console.log('\nTest 2: Attempt to add tool with neither code nor codePath...');
    try {
      const invalidSpec: FunctionSpecification = {
        name: 'invalid_tool2',
        description: 'This should also fail',
        language: 'python',
        parameters: { type: 'object', properties: {} }
      };
      await manager.addTool(invalidSpec);
      console.log('❌ Should have thrown error for missing code/codePath');
    } catch (error: any) {
      if (error.message.includes('Must specify either code or codePath')) {
        console.log('✓ Correctly rejected tool without code or codePath');
      } else {
        throw error;
      }
    }
    
    // Test 3: Add inline Python function
    console.log('\nTest 3: Add inline Python function...');
    const inlinePython: FunctionSpecification = {
      name: 'inline_greeter',
      description: 'Greets a person',
      language: 'python',
      code: `
def main(name, greeting="Hello"):
    return {"message": f"{greeting}, {name}!"}
`,
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          greeting: { type: 'string' }
        },
        required: ['name']
      }
    };
    
    const storedInline = await manager.addTool(inlinePython);
    console.log('✓ Added inline Python function:', storedInline.name);
    
    // Test 4: Add file-based Python function
    console.log('\nTest 4: Add file-based Python function...');
    const filePython: FunctionSpecification = {
      name: 'file_calculator',
      description: 'Calculator from file',
      language: 'python',
      codePath: testPyFile,
      parameters: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          operation: { type: 'string' }
        },
        required: ['x', 'y']
      }
    };
    
    const storedFilePy = await manager.addTool(filePython);
    console.log('✓ Added file-based Python function:', storedFilePy.name);
    
    // Test 5: Add file-based JS function
    console.log('\nTest 5: Add file-based JavaScript function...');
    const fileJs: FunctionSpecification = {
      name: 'file_string_utils',
      description: 'String utilities from file',
      language: 'javascript',
      codePath: testJsFile,
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          action: { type: 'string' }
        },
        required: ['text']
      }
    };
    
    const storedFileJs = await manager.addTool(fileJs);
    console.log('✓ Added file-based JS function:', storedFileJs.name);
    
    // Test 6: Try to add file with wrong extension (should fail)
    console.log('\nTest 6: Attempt to add Python file with .js extension...');
    try {
      const wrongExt: FunctionSpecification = {
        name: 'wrong_ext',
        description: 'Wrong extension',
        language: 'python',
        codePath: testJsFile, // JS file but claiming Python
        parameters: { type: 'object', properties: {} }
      };
      await manager.addTool(wrongExt);
      console.log('❌ Should have thrown error for wrong extension');
    } catch (error: any) {
      if (error.message.includes("doesn't match language")) {
        console.log('✓ Correctly rejected file with wrong extension');
      } else {
        throw error;
      }
    }
    
    // Test 7: Try to add non-existent file (should fail)
    console.log('\nTest 7: Attempt to add non-existent file...');
    try {
      const nonExistent: FunctionSpecification = {
        name: 'non_existent',
        description: 'Non-existent file',
        language: 'python',
        codePath: './does_not_exist.py',
        parameters: { type: 'object', properties: {} }
      };
      await manager.addTool(nonExistent);
      console.log('❌ Should have thrown error for non-existent file');
    } catch (error: any) {
      if (error.message.includes('File not found')) {
        console.log('✓ Correctly rejected non-existent file');
      } else {
        throw error;
      }
    }
    
    // Test 8: Execute the tools
    console.log('\nTest 8: Execute registered tools...');
    
    const inlineResult = await manager.executeTool('inline_greeter', { name: 'World' });
    console.log('✓ Inline execution result:', inlineResult);
    
    const fileCalcResult = await manager.executeTool('file_calculator', { x: 10, y: 5, operation: 'multiply' });
    console.log('✓ File-based Python result:', fileCalcResult);
    
    const fileJsResult = await manager.executeTool('file_string_utils', { text: 'hello', action: 'uppercase' });
    console.log('✓ File-based JS result:', fileJsResult);
    
    // Test 9: List tools to verify schema
    console.log('\nTest 9: Check tool schemas...');
    const tools = manager.getTools();
    const addToolSchema = tools.find(t => t.name === 'add_tool');
    
    if (addToolSchema) {
      const schema = addToolSchema.inputSchema;
      const hasCode = 'code' in schema.properties;
      const hasCodePath = 'codePath' in schema.properties;
      const hasOneOf = 'oneOf' in schema;
      
      console.log('✓ Schema has code property:', hasCode);
      console.log('✓ Schema has codePath property:', hasCodePath);
      console.log('✓ Schema has oneOf constraint:', hasOneOf);
      
      if (hasOneOf) {
        console.log('  oneOf:', JSON.stringify(schema.oneOf));
      }
    }
    
    // Clean up
    await rm(testPyFile, { force: true });
    await rm(testJsFile, { force: true });
    await manager.removeTool('inline_greeter');
    await manager.removeTool('file_calculator');
    await manager.removeTool('file_string_utils');
    
    console.log('\n✅ All Tool Manager tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    // Clean up on error
    await rm(testPyFile, { force: true });
    await rm(testJsFile, { force: true });
  }
}

// Run the tests
testToolManager().catch(console.error);