# Ticket 001: Extend Type System to Support File-Based Functions

## Overview
Extend the TypeScript type definitions to support both inline code and file-based function definitions.

## Requirements
1. Modify `FunctionSpecification` interface to support both `code` (inline) and `codePath` (file reference)
2. Ensure backward compatibility with existing inline functions
3. Add validation rules to ensure exactly one of `code` or `codePath` is provided

## Implementation Details

### Update src/types/index.ts
```typescript
export interface FunctionSpecification {
  name: string;
  description: string;
  language: SupportedLanguage;
  code?: string;              // Now optional - for inline code
  codePath?: string;          // New field - path to code file
  parameters: JSONSchema7;
  returns?: string;
  dependencies?: string[];
  timeout?: number;
}

// Add a type guard
export function isFileBasedFunction(spec: FunctionSpecification): boolean {
  return !!spec.codePath && !spec.code;
}

export function isInlineFunction(spec: FunctionSpecification): boolean {
  return !!spec.code && !spec.codePath;
}
```

### Validation Rules
- Exactly one of `code` or `codePath` must be provided
- If `codePath` is provided, validate it's a valid file path
- File extension should match the specified language

## Testing
- Test type guards work correctly
- Test validation of mutual exclusivity
- Test backward compatibility with existing functions

## Acceptance Criteria
- [ ] Type definitions updated
- [ ] Type guards implemented and tested
- [ ] Existing functions continue to work
- [ ] New file-based function type can be created