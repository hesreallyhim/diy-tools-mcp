/**
 * JSON Transformer
 * Transform JSON data structures with various operations
 */

function main({ data, transformation }) {
    /**
     * Transform JSON data based on specified transformation
     * @param {string} data - JSON string to transform
     * @param {string} transformation - Type of transformation to apply
     * @returns {object} Transformed data with metadata
     */
    try {
        const parsed = JSON.parse(data);
        
        switch (transformation) {
            case 'keys_to_camelCase':
                return {
                    success: true,
                    transformation: transformation,
                    result: transformKeysToCamelCase(parsed)
                };
                
            case 'keys_to_snake_case':
                return {
                    success: true,
                    transformation: transformation,
                    result: transformKeysToSnakeCase(parsed)
                };
                
            case 'remove_nulls':
                return {
                    success: true,
                    transformation: transformation,
                    result: removeNullValues(parsed)
                };
                
            case 'flatten':
                return {
                    success: true,
                    transformation: transformation,
                    result: flattenObject(parsed)
                };
                
            case 'unflatten':
                return {
                    success: true,
                    transformation: transformation,
                    result: unflattenObject(parsed)
                };
                
            default:
                return {
                    success: false,
                    error: `Unknown transformation: ${transformation}`,
                    available: [
                        'keys_to_camelCase',
                        'keys_to_snake_case', 
                        'remove_nulls',
                        'flatten',
                        'unflatten'
                    ]
                };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

function transformKeysToCamelCase(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => transformKeysToCamelCase(item));
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            result[camelKey] = transformKeysToCamelCase(obj[key]);
            return result;
        }, {});
    }
    return obj;
}

function transformKeysToSnakeCase(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => transformKeysToSnakeCase(item));
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((result, key) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            result[snakeKey] = transformKeysToSnakeCase(obj[key]);
            return result;
        }, {});
    }
    return obj;
}

function removeNullValues(obj) {
    if (Array.isArray(obj)) {
        return obj
            .filter(item => item !== null && item !== undefined)
            .map(item => removeNullValues(item));
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((result, key) => {
            const value = obj[key];
            if (value !== null && value !== undefined) {
                result[key] = removeNullValues(value);
            }
            return result;
        }, {});
    }
    return obj;
}

function flattenObject(obj, prefix = '') {
    const flattened = {};
    
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                Object.assign(flattened, flattenObject(obj[key], newKey));
            } else {
                flattened[newKey] = obj[key];
            }
        }
    }
    
    return flattened;
}

function unflattenObject(obj) {
    const result = {};
    
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const keys = key.split('.');
            let current = result;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            
            current[keys[keys.length - 1]] = obj[key];
        }
    }
    
    return result;
}

module.exports = { main };