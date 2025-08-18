/**
 * Type Validation and Schema Checking Functions
 * Provides runtime type validation and data schema validation
 */

interface ValidationResult {
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    data?: any;
}

interface SchemaField {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'email' | 'url' | 'uuid';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
    items?: SchemaField;
    properties?: Record<string, SchemaField>;
}

interface Schema {
    [key: string]: SchemaField;
}

function main(operation: string, data: any, schema?: any): any {
    try {
        switch (operation) {
            case 'validate':
                return validateData(data, schema);
            
            case 'sanitize':
                return sanitizeData(data, schema);
            
            case 'coerce':
                return coerceTypes(data, schema);
            
            case 'check_email':
                return validateEmail(data);
            
            case 'check_url':
                return validateUrl(data);
            
            case 'check_uuid':
                return validateUuid(data);
            
            case 'check_json':
                return validateJson(data);
            
            case 'check_credit_card':
                return validateCreditCard(data);
            
            case 'check_phone':
                return validatePhoneNumber(data);
            
            case 'check_postal_code':
                return validatePostalCode(data);
            
            case 'deep_equal':
                return deepEqual(data, schema);
            
            case 'generate_schema':
                return generateSchema(data);
            
            case 'validate_schema':
                return validateAgainstSchema(data, schema);
            
            default:
                return {
                    error: `Unknown operation: ${operation}`,
                    available: [
                        'validate', 'sanitize', 'coerce', 'check_email', 'check_url',
                        'check_uuid', 'check_json', 'check_credit_card', 'check_phone',
                        'check_postal_code', 'deep_equal', 'generate_schema', 'validate_schema'
                    ]
                };
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            operation
        };
    }
}

function validateData(data: any, rules?: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!rules) {
        // Basic type validation
        return {
            valid: true,
            data: {
                type: typeof data,
                isArray: Array.isArray(data),
                isNull: data === null,
                isUndefined: data === undefined,
                value: data
            }
        };
    }
    
    // Validate against rules
    for (const [field, rule] of Object.entries(rules as Record<string, any>)) {
        const value = data[field];
        
        if (rule.required && (value === undefined || value === null)) {
            errors.push(`Field '${field}' is required`);
            continue;
        }
        
        if (value === undefined || value === null) {
            continue;
        }
        
        // Type validation
        if (rule.type) {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (actualType !== rule.type) {
                errors.push(`Field '${field}' should be of type ${rule.type}, got ${actualType}`);
            }
        }
        
        // String validations
        if (typeof value === 'string') {
            if (rule.minLength && value.length < rule.minLength) {
                errors.push(`Field '${field}' should have at least ${rule.minLength} characters`);
            }
            if (rule.maxLength && value.length > rule.maxLength) {
                errors.push(`Field '${field}' should have at most ${rule.maxLength} characters`);
            }
            if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
                errors.push(`Field '${field}' does not match pattern ${rule.pattern}`);
            }
        }
        
        // Number validations
        if (typeof value === 'number') {
            if (rule.min !== undefined && value < rule.min) {
                errors.push(`Field '${field}' should be at least ${rule.min}`);
            }
            if (rule.max !== undefined && value > rule.max) {
                errors.push(`Field '${field}' should be at most ${rule.max}`);
            }
        }
        
        // Enum validation
        if (rule.enum && !rule.enum.includes(value)) {
            errors.push(`Field '${field}' should be one of: ${rule.enum.join(', ')}`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        data
    };
}

function sanitizeData(data: any, rules?: any): any {
    if (!rules) {
        // Basic sanitization
        if (typeof data === 'string') {
            return {
                original: data,
                sanitized: data.trim(),
                changes: {
                    trimmed: data !== data.trim(),
                    length_before: data.length,
                    length_after: data.trim().length
                }
            };
        }
        return { original: data, sanitized: data, changes: {} };
    }
    
    const sanitized: any = {};
    const changes: any = {};
    
    for (const [field, rule] of Object.entries(rules as Record<string, any>)) {
        const value = data[field];
        
        if (value === undefined || value === null) {
            if (rule.default !== undefined) {
                sanitized[field] = rule.default;
                changes[field] = { added_default: true };
            }
            continue;
        }
        
        let sanitizedValue = value;
        const fieldChanges: any = {};
        
        if (typeof value === 'string') {
            // Trim whitespace
            if (rule.trim !== false) {
                sanitizedValue = sanitizedValue.trim();
                if (sanitizedValue !== value) {
                    fieldChanges.trimmed = true;
                }
            }
            
            // Convert case
            if (rule.toLowerCase) {
                sanitizedValue = sanitizedValue.toLowerCase();
                fieldChanges.lowercased = true;
            } else if (rule.toUpperCase) {
                sanitizedValue = sanitizedValue.toUpperCase();
                fieldChanges.uppercased = true;
            }
            
            // Remove special characters
            if (rule.alphanumeric) {
                sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9]/g, '');
                fieldChanges.special_chars_removed = true;
            }
            
            // Escape HTML
            if (rule.escapeHtml) {
                sanitizedValue = sanitizedValue
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                fieldChanges.html_escaped = true;
            }
        }
        
        sanitized[field] = sanitizedValue;
        if (Object.keys(fieldChanges).length > 0) {
            changes[field] = fieldChanges;
        }
    }
    
    return {
        original: data,
        sanitized,
        changes,
        fields_changed: Object.keys(changes).length
    };
}

function coerceTypes(data: any, schema?: any): any {
    if (!schema) {
        return {
            error: 'Schema is required for type coercion',
            data
        };
    }
    
    const coerced: any = {};
    const changes: any = {};
    
    for (const [field, rule] of Object.entries(schema as Record<string, any>)) {
        const value = data[field];
        
        if (value === undefined || value === null) {
            coerced[field] = value;
            continue;
        }
        
        let coercedValue = value;
        const originalType = typeof value;
        
        switch (rule.type) {
            case 'string':
                coercedValue = String(value);
                break;
            
            case 'number':
                coercedValue = Number(value);
                if (isNaN(coercedValue)) {
                    coercedValue = value;
                    changes[field] = { error: 'Could not coerce to number' };
                }
                break;
            
            case 'boolean':
                if (typeof value === 'string') {
                    coercedValue = value.toLowerCase() === 'true' || value === '1';
                } else {
                    coercedValue = Boolean(value);
                }
                break;
            
            case 'date':
                coercedValue = new Date(value);
                if (isNaN(coercedValue.getTime())) {
                    coercedValue = value;
                    changes[field] = { error: 'Could not coerce to date' };
                } else {
                    coercedValue = coercedValue.toISOString();
                }
                break;
            
            case 'array':
                if (!Array.isArray(value)) {
                    coercedValue = [value];
                }
                break;
        }
        
        coerced[field] = coercedValue;
        
        if (coercedValue !== value || typeof coercedValue !== originalType) {
            changes[field] = {
                from: originalType,
                to: rule.type,
                original: value,
                coerced: coercedValue
            };
        }
    }
    
    return {
        success: true,
        original: data,
        coerced,
        changes,
        fields_coerced: Object.keys(changes).length
    };
}

function validateEmail(email: string): any {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    const parts = email.split('@');
    const localPart = parts[0] || '';
    const domain = parts[1] || '';
    
    const validations = {
        hasAtSymbol: email.includes('@'),
        hasValidFormat: isValid,
        localPartLength: localPart.length,
        domainHasDot: domain.includes('.'),
        noSpaces: !email.includes(' '),
        noSpecialStart: !/^[._-]/.test(email),
        noSpecialEnd: !/[._-]$/.test(email)
    };
    
    return {
        email,
        valid: isValid,
        validations,
        localPart,
        domain,
        suggestions: !isValid ? generateEmailSuggestions(email) : []
    };
}

function validateUrl(url: string): any {
    try {
        const urlObj = new URL(url);
        
        return {
            url,
            valid: true,
            protocol: urlObj.protocol,
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80'),
            pathname: urlObj.pathname,
            search: urlObj.search,
            hash: urlObj.hash,
            origin: urlObj.origin,
            isSecure: urlObj.protocol === 'https:'
        };
    } catch (error) {
        return {
            url,
            valid: false,
            error: 'Invalid URL format',
            suggestions: generateUrlSuggestions(url)
        };
    }
}

function validateUuid(uuid: string): any {
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const uuidGeneralRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    const isV4 = uuidV4Regex.test(uuid);
    const isValid = uuidGeneralRegex.test(uuid);
    
    return {
        uuid,
        valid: isValid,
        isVersion4: isV4,
        format: isValid ? 'Valid UUID format' : 'Invalid UUID format',
        parts: isValid ? uuid.split('-') : [],
        version: isV4 ? 4 : isValid ? 'Unknown version' : null
    };
}

function validateJson(jsonString: string): any {
    try {
        const parsed = JSON.parse(jsonString);
        
        return {
            valid: true,
            parsed,
            type: Array.isArray(parsed) ? 'array' : typeof parsed,
            size: jsonString.length,
            prettyPrinted: JSON.stringify(parsed, null, 2),
            minified: JSON.stringify(parsed),
            keys: typeof parsed === 'object' && !Array.isArray(parsed) 
                ? Object.keys(parsed) 
                : []
        };
    } catch (error: any) {
        const position = extractJsonErrorPosition(error.message);
        
        return {
            valid: false,
            error: error.message,
            position,
            suggestion: 'Check for missing quotes, commas, or brackets'
        };
    }
}

function validateCreditCard(cardNumber: string): any {
    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    
    // Check if only digits
    if (!/^\d+$/.test(cleaned)) {
        return {
            valid: false,
            error: 'Card number should contain only digits',
            cardNumber
        };
    }
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i]);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    const isValid = sum % 10 === 0;
    
    // Detect card type
    let cardType = 'Unknown';
    if (/^4/.test(cleaned)) cardType = 'Visa';
    else if (/^5[1-5]/.test(cleaned)) cardType = 'MasterCard';
    else if (/^3[47]/.test(cleaned)) cardType = 'American Express';
    else if (/^6(?:011|5)/.test(cleaned)) cardType = 'Discover';
    
    return {
        cardNumber,
        cleaned,
        valid: isValid,
        cardType,
        length: cleaned.length,
        luhnValid: isValid
    };
}

function validatePhoneNumber(phone: string): any {
    const cleaned = phone.replace(/\D/g, '');
    
    // Common patterns
    const patterns = {
        us: /^1?(\d{3})(\d{3})(\d{4})$/,
        international: /^(\d{1,3})(\d{1,4})(\d{1,4})(\d{1,9})$/
    };
    
    let formatted = phone;
    let country = 'Unknown';
    let valid = false;
    
    if (patterns.us.test(cleaned)) {
        const matches = cleaned.match(patterns.us);
        if (matches) {
            formatted = `(${matches[1]}) ${matches[2]}-${matches[3]}`;
            country = 'US';
            valid = true;
        }
    } else if (cleaned.length >= 10 && cleaned.length <= 15) {
        valid = true;
        country = 'International';
    }
    
    return {
        phone,
        cleaned,
        valid,
        formatted,
        country,
        length: cleaned.length,
        hasCountryCode: cleaned.length > 10
    };
}

function validatePostalCode(code: string): any {
    const patterns: Record<string, RegExp> = {
        US: /^\d{5}(-\d{4})?$/,
        Canada: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
        UK: /^[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}$/i,
        Germany: /^\d{5}$/,
        France: /^\d{5}$/,
        Japan: /^\d{3}-?\d{4}$/,
        Australia: /^\d{4}$/
    };
    
    let country = 'Unknown';
    let valid = false;
    
    for (const [countryName, pattern] of Object.entries(patterns)) {
        if (pattern.test(code)) {
            country = countryName;
            valid = true;
            break;
        }
    }
    
    return {
        code,
        valid,
        country,
        format: country !== 'Unknown' ? `Valid ${country} postal code` : 'Unknown format'
    };
}

function deepEqual(obj1: any, obj2: any): any {
    const differences: string[] = [];
    
    function compareObjects(a: any, b: any, path: string = ''): boolean {
        if (a === b) return true;
        
        if (typeof a !== typeof b) {
            differences.push(`Type mismatch at ${path || 'root'}: ${typeof a} vs ${typeof b}`);
            return false;
        }
        
        if (a === null || b === null) {
            differences.push(`Null value at ${path || 'root'}`);
            return false;
        }
        
        if (typeof a !== 'object') {
            differences.push(`Value mismatch at ${path || 'root'}: ${a} vs ${b}`);
            return false;
        }
        
        if (Array.isArray(a) !== Array.isArray(b)) {
            differences.push(`Array/Object mismatch at ${path || 'root'}`);
            return false;
        }
        
        const keys1 = Object.keys(a);
        const keys2 = Object.keys(b);
        
        if (keys1.length !== keys2.length) {
            differences.push(`Key count mismatch at ${path || 'root'}: ${keys1.length} vs ${keys2.length}`);
        }
        
        for (const key of [...new Set([...keys1, ...keys2])]) {
            const newPath = path ? `${path}.${key}` : key;
            
            if (!(key in a)) {
                differences.push(`Missing key in first object: ${newPath}`);
            } else if (!(key in b)) {
                differences.push(`Missing key in second object: ${newPath}`);
            } else {
                compareObjects(a[key], b[key], newPath);
            }
        }
        
        return differences.length === 0;
    }
    
    const isEqual = compareObjects(obj1, obj2);
    
    return {
        equal: isEqual,
        differences: differences.length > 0 ? differences : undefined,
        differenceCount: differences.length,
        object1: obj1,
        object2: obj2
    };
}

function generateSchema(data: any): any {
    function inferType(value: any): SchemaField {
        if (value === null || value === undefined) {
            return { type: 'string', required: false };
        }
        
        if (Array.isArray(value)) {
            return {
                type: 'array',
                items: value.length > 0 ? inferType(value[0]) : { type: 'string' }
            };
        }
        
        if (typeof value === 'object') {
            const properties: Record<string, SchemaField> = {};
            for (const [key, val] of Object.entries(value)) {
                properties[key] = inferType(val);
            }
            return { type: 'object', properties };
        }
        
        if (typeof value === 'string') {
            // Check for special string types
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return { type: 'email' as any };
            }
            if (/^https?:\/\//.test(value)) {
                return { type: 'url' as any };
            }
            if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
                return { type: 'date' as any };
            }
            return { type: 'string' };
        }
        
        if (typeof value === 'number') {
            return { type: 'number' };
        }
        
        if (typeof value === 'boolean') {
            return { type: 'boolean' };
        }
        
        return { type: 'string' };
    }
    
    const schema = inferType(data);
    
    return {
        data,
        schema,
        schemaJson: JSON.stringify(schema, null, 2),
        dataType: Array.isArray(data) ? 'array' : typeof data
    };
}

function validateAgainstSchema(data: any, schema: Schema): ValidationResult {
    const errors: string[] = [];
    
    function validateField(value: any, field: SchemaField, path: string): void {
        // Check required
        if (field.required && (value === undefined || value === null)) {
            errors.push(`${path} is required`);
            return;
        }
        
        if (value === undefined || value === null) {
            return;
        }
        
        // Type checking
        switch (field.type) {
            case 'string':
                if (typeof value !== 'string') {
                    errors.push(`${path} should be a string`);
                }
                break;
            
            case 'number':
                if (typeof value !== 'number') {
                    errors.push(`${path} should be a number`);
                } else {
                    if (field.min !== undefined && value < field.min) {
                        errors.push(`${path} should be >= ${field.min}`);
                    }
                    if (field.max !== undefined && value > field.max) {
                        errors.push(`${path} should be <= ${field.max}`);
                    }
                }
                break;
            
            case 'boolean':
                if (typeof value !== 'boolean') {
                    errors.push(`${path} should be a boolean`);
                }
                break;
            
            case 'array':
                if (!Array.isArray(value)) {
                    errors.push(`${path} should be an array`);
                } else if (field.items) {
                    value.forEach((item, index) => {
                        validateField(item, field.items!, `${path}[${index}]`);
                    });
                }
                break;
            
            case 'object':
                if (typeof value !== 'object' || Array.isArray(value)) {
                    errors.push(`${path} should be an object`);
                } else if (field.properties) {
                    for (const [key, subField] of Object.entries(field.properties)) {
                        validateField(value[key], subField, `${path}.${key}`);
                    }
                }
                break;
            
            case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    errors.push(`${path} should be a valid email`);
                }
                break;
            
            case 'url':
                try {
                    new URL(value);
                } catch {
                    errors.push(`${path} should be a valid URL`);
                }
                break;
            
            case 'uuid':
                if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
                    errors.push(`${path} should be a valid UUID`);
                }
                break;
        }
        
        // Additional validations
        if (field.pattern && typeof value === 'string') {
            if (!new RegExp(field.pattern).test(value)) {
                errors.push(`${path} does not match pattern ${field.pattern}`);
            }
        }
        
        if (field.enum && !field.enum.includes(value)) {
            errors.push(`${path} should be one of: ${field.enum.join(', ')}`);
        }
    }
    
    // Validate root
    if (schema.type) {
        validateField(data, schema as any, 'root');
    } else {
        // Schema with properties at root level
        for (const [key, field] of Object.entries(schema)) {
            validateField(data[key], field, key);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        data
    };
}

// Helper functions
function generateEmailSuggestions(email: string): string[] {
    const suggestions: string[] = [];
    
    if (!email.includes('@')) {
        suggestions.push('Add @ symbol');
    }
    if (!email.includes('.')) {
        suggestions.push('Add domain extension (e.g., .com)');
    }
    if (email.startsWith('@')) {
        suggestions.push('Add local part before @');
    }
    if (email.endsWith('@')) {
        suggestions.push('Add domain after @');
    }
    
    return suggestions;
}

function generateUrlSuggestions(url: string): string[] {
    const suggestions: string[] = [];
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        suggestions.push('Add protocol (http:// or https://)');
    }
    if (!url.includes('.')) {
        suggestions.push('Add domain extension');
    }
    
    return suggestions;
}

function extractJsonErrorPosition(errorMessage: string): number | null {
    const match = errorMessage.match(/position (\d+)/);
    return match ? parseInt(match[1]) : null;
}

// Export the main function
export default main;