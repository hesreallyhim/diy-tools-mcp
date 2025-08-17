# Future Enhancement: Configurable Entry Points

## Overview
Allow users to specify any function name as the entry point instead of requiring `main`, making it easier to integrate existing code and share files between multiple tools.

## Motivation
- Users can reuse existing functions without renaming them
- Multiple tools can share a single file with different entry points
- More natural integration with existing libraries and code

## Design

### Phase 1: Single Configurable Entry Point
Allow specifying which function to call, with `main` as the default:

```json
{
  "name": "calculate_tax",
  "description": "Calculate tax based on income",
  "language": "python",
  "codePath": "./finance_utils.py",
  "entryPoint": "calculate_tax",  // Optional, defaults to "main"
  "parameters": {
    "type": "object",
    "properties": {
      "income": { "type": "number" },
      "rate": { "type": "number" }
    }
  }
}
```

### Phase 2: Multiple Tools from One File
Allow multiple tools to use different functions from the same file:

```python
# finance_utils.py
def calculate_tax(income, rate):
    """Calculate tax amount."""
    return income * rate

def calculate_net_income(gross, tax_rate, deductions=0):
    """Calculate net income after tax and deductions."""
    tax = calculate_tax(gross, tax_rate)
    return gross - tax - deductions

def estimate_retirement(current_age, retirement_age, monthly_savings):
    """Estimate retirement savings."""
    months = (retirement_age - current_age) * 12
    return monthly_savings * months
```

Register multiple tools:
```json
[
  {
    "name": "tax_calculator",
    "codePath": "./finance_utils.py",
    "entryPoint": "calculate_tax",
    "language": "python"
  },
  {
    "name": "net_income",
    "codePath": "./finance_utils.py", 
    "entryPoint": "calculate_net_income",
    "language": "python"
  },
  {
    "name": "retirement_planner",
    "codePath": "./finance_utils.py",
    "entryPoint": "estimate_retirement",
    "language": "python"
  }
]
```

## Implementation Changes

### Type Updates
```typescript
interface FunctionSpecification {
  // ... existing fields ...
  entryPoint?: string;  // Defaults to "main" if not specified
}
```

### Executor Updates
```typescript
// Python executor
const wrappedCode = `
import json
import sys

${code}

if __name__ == "__main__":
    try:
        args = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
        # Use specified entry point or default to main
        entry_point = "${spec.entryPoint || 'main'}"
        result = globals()[entry_point](**args)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
`;
```

### Validation Updates
```typescript
private async validateEntryPoint(
  code: string, 
  entryPoint: string, 
  language: SupportedLanguage
): Promise<void> {
  const validator = getLanguageValidator(language);
  
  // Check if the specified function exists
  const functions = validator.findFunctions(code);
  
  if (!functions.includes(entryPoint)) {
    throw new ValidationError(
      `Function '${entryPoint}' not found in file. ` +
      `Available functions: ${functions.join(', ')}`
    );
  }
  
  // Validate function signature
  const signatureValid = validator.validateFunctionSignature(
    code, 
    entryPoint
  );
  
  if (!signatureValid.valid) {
    throw new ValidationError(
      `Invalid function signature for '${entryPoint}': ${signatureValid.error}`
    );
  }
}
```

## Benefits
1. **Easier adoption** - Use existing code without modifications
2. **Code reuse** - Share utility functions between tools
3. **Better organization** - Group related functions in single files
4. **Backward compatible** - Defaults to `main` if not specified

## Migration Path
1. Existing functions with `main` continue to work
2. New `entryPoint` field is optional
3. Validation provides helpful error messages if entry point not found
4. Documentation shows both patterns

## Testing
- Test with default `main` entry point (backward compatibility)
- Test with custom entry points
- Test multiple tools using same file
- Test error cases (missing entry point, invalid signature)
- Test all supported languages

## Considerations
- File modification affects all tools using that file
- Need to track which tools depend on which files
- Cache invalidation when shared files change
- Consider adding "list dependencies" tool to show relationships