# Configurable Entry Points Example

This example demonstrates how to use the configurable entry points feature to register multiple tools from a single code file.

## Overview

The `math_utils.py` file contains four different financial calculation functions:
- `calculate_tax` - Calculate tax and net income
- `compound_interest` - Calculate compound interest
- `loan_payment` - Calculate monthly loan payments
- `retirement_savings` - Project retirement savings

Each function can be registered as a separate tool by specifying it as the `entryPoint` in the tool specification.

## Benefits

1. **Code Reuse** - Share utility functions between multiple tools
2. **Better Organization** - Group related functions in single files
3. **Easier Integration** - Use existing code without renaming functions to `main`
4. **Maintainability** - Update shared logic in one place

## Usage

### Registering Tools

Each tool in `register_tools.json` references the same `math_utils.py` file but with different entry points:

```json
{
  "name": "tax_calculator",
  "codePath": "./examples/entry-points/math_utils.py",
  "entryPoint": "calculate_tax",
  ...
}
```

### Default Behavior

If no `entryPoint` is specified, the system defaults to looking for a function named `main`:

```json
{
  "name": "my_tool",
  "code": "def main(args): return args['value'] * 2",
  // No entryPoint specified - will use 'main'
}
```

### Calling the Tools

Once registered, each tool can be called independently:

```javascript
// Call the tax calculator
await client.callTool('tax_calculator', { 
  income: 75000, 
  tax_rate: 0.25 
});

// Call the loan calculator  
await client.callTool('loan_calculator', { 
  principal: 200000, 
  rate: 0.045, 
  months: 360 
});
```

## Supported Languages

The entry point feature works with all supported languages:
- **Python** - Function names
- **JavaScript** - Function names or module.exports properties
- **TypeScript** - Same as JavaScript after transpilation
- **Bash** - Function names
- **Ruby** - Method names

## Example Output

### Tax Calculator
Input:
```json
{ "income": 100000, "tax_rate": 0.3 }
```
Output:
```json
{ "tax_amount": 30000, "net_income": 70000 }
```

### Loan Calculator
Input:
```json
{ "principal": 300000, "rate": 0.04, "months": 360 }
```
Output:
```json
{ 
  "monthly_payment": 1432.25,
  "total_payment": 515610,
  "total_interest": 215610
}
```

## Migration from `main`

If you have existing tools that use `main` as the entry point, they will continue to work without modification. The `entryPoint` field is optional and defaults to `main` when not specified.