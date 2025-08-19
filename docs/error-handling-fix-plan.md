# Error Handling Fix Plan for MCP Protocol Compliance

## Problem Statement

Our current implementation is not following the MCP (Model Context Protocol) specification correctly for error handling. We're returning success responses with error messages in the body instead of throwing proper errors, which violates the protocol expectations.

## MCP Protocol Requirements

Based on the MCP TypeScript SDK documentation:

### 1. Tool Not Found Errors
- **Current behavior**: Returns `CallToolResult` with `{success: false, error: "Tool not found"}`
- **Expected behavior**: Should throw an Error
- **SDK Example**: `throw new Error("Unknown prompt");` (line 992 of SDK README)

### 2. Tool Execution Errors
- **Recoverable errors**: Return `CallToolResult` with `isError: true` flag
- **Unrecoverable errors**: Throw an Error
- **SDK Example**: SQL query errors return `{content: [...], isError: true}`

## Current Implementation Issues

### 1. `view_source` Handler (src/tools/manager.ts:349-358)
- **Issue**: Returns success response with error message when tool doesn't exist
- **Fix**: Throw an error instead

### 2. `remove_tool` Handler (src/tools/manager.ts:311-318)  
- **Issue**: Returns success response when tool doesn't exist
- **Fix**: Consider throwing error or keep idempotent behavior

### 3. `executeTool` Method (src/tools/manager.ts:119-128)
- **Issue**: Returns `{success: false, error}` when tool not found
- **Fix**: Throw an error to be caught by `handleToolCall`

### 4. Default Case (src/tools/manager.ts:407-409)
- **Status**: ✅ Already correct - throws `ExecutionError` when execution fails

## Implementation Plan

### Phase 1: Update Error Handling Logic

1. **Modify `executeTool` method**
   ```typescript
   // Instead of:
   if (!tool) {
     return { success: false, error: "Tool not found", executionTime: 0 };
   }
   
   // Change to:
   if (!tool) {
     throw new Error(`Tool "${name}" not found`);
   }
   ```

2. **Update `handleToolCall` method**
   - For `view_source`: Throw error when tool not found
   - For `remove_tool`: Evaluate idempotency vs strict error handling
   - Ensure all cases properly propagate thrown errors

3. **Add `isError` flag support**
   - Implement for recoverable execution errors
   - Maintain backward compatibility where possible

### Phase 2: Update Tests

1. **Update test expectations**
   - Change from checking `result.success === false`
   - To using `expect().rejects.toThrow()` pattern

2. **Affected test files**
   - `src/tools/__tests__/manager.test.ts`
   - `src/__tests__/integration/file-based-functions.test.ts`

### Phase 3: Validation

1. Run full test suite
2. Verify MCP protocol compliance
3. Test with MCP clients to ensure compatibility

## Benefits

1. **Protocol Compliance**: Proper adherence to MCP specification
2. **Better Error Semantics**: Clear distinction between protocol errors and execution errors
3. **Client Compatibility**: Works correctly with MCP-compliant clients
4. **Improved Debugging**: Errors propagate with proper stack traces

## Risk Assessment

- **Breaking Change**: This changes the API behavior for error cases
- **Mitigation**: Tests will be updated to match new behavior
- **Client Impact**: MCP-compliant clients will handle this better

## Timeline

1. Documentation and planning: ✅ Complete
2. Implementation: ~1 hour
3. Test updates: ~30 minutes
4. Validation: ~30 minutes

## References

- MCP TypeScript SDK: `@modelcontextprotocol/sdk`
- SDK Documentation: INTERNAL/mcp-ts-sdk-README.md
- MCP Specification: https://modelcontextprotocol.io/specification