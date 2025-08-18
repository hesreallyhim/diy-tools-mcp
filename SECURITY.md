# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :x:                |
| 1.0.x   | :x:                |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### DO NOT

- Do not open a public GitHub issue
- Do not discuss the vulnerability publicly

### DO

1. Email security details to: security@example.com
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- Initial response: Within 48 hours
- Status update: Within 5 business days
- Fix timeline: Depends on severity
  - Critical: 1-7 days
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next release

## Security Considerations

### Function Execution

DIY Tools MCP executes user-provided code. Security measures include:

- Path traversal protection
- Symbolic link detection
- System directory restrictions
- File size limits (10MB)
- Dangerous pattern detection
- Timeout enforcement (max 5 minutes)

### Best Practices

1. **Run in isolated environment**: Use containers or VMs for production
2. **Limit permissions**: Run with minimal necessary privileges
3. **Monitor usage**: Track function execution and resource usage
4. **Regular updates**: Keep dependencies updated
5. **Input validation**: Always validate function parameters

## Security Features

- ✅ Input sanitization
- ✅ Path validation
- ✅ Code pattern scanning
- ✅ Resource limits
- ⚠️  No sandboxing (planned)
- ⚠️  No rate limiting (planned)

## Disclosure Policy

After fixing a vulnerability:
1. Security advisory published
2. CVE requested if applicable
3. Users notified via GitHub
4. Fix released in patch version

## Contact

Security Team: security@example.com
PGP Key: [Optional PGP key]