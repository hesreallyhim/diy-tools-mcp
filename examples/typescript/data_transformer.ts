/**
 * Data Transformation and Mapping Functions
 * Provides various data transformation, mapping, and conversion utilities
 */

type TransformOperation = 
    | 'flatten' 
    | 'unflatten' 
    | 'group_by' 
    | 'pivot' 
    | 'normalize' 
    | 'denormalize'
    | 'map' 
    | 'filter' 
    | 'reduce' 
    | 'sort'
    | 'merge' 
    | 'split' 
    | 'chunk' 
    | 'sample'
    | 'deduplicate' 
    | 'transform_keys'
    | 'transform_values'
    | 'zip'
    | 'unzip'
    | 'cross_join';

interface TransformOptions {
    key?: string;
    keys?: string[];
    value?: string;
    values?: string[];
    field?: string;
    fields?: string[];
    separator?: string;
    size?: number;
    count?: number;
    direction?: 'asc' | 'desc';
    deep?: boolean;
    unique?: boolean;
    operation?: string;
    transformer?: (value: any) => any;
    predicate?: (value: any) => boolean;
    accumulator?: any;
}

interface TransformResult {
    success: boolean;
    original?: any;
    transformed?: any;
    metadata?: {
        originalType?: string;
        transformedType?: string;
        originalCount?: number;
        transformedCount?: number;
        duration?: number;
        [key: string]: any;
    };
    error?: string;
}

function main(operation: TransformOperation, data: any, options: TransformOptions = {}): TransformResult {
    const startTime = Date.now();
    
    try {
        let result: any;
        
        switch (operation) {
            case 'flatten':
                result = flattenObject(data, options);
                break;
            
            case 'unflatten':
                result = unflattenObject(data, options);
                break;
            
            case 'group_by':
                result = groupBy(data, options);
                break;
            
            case 'pivot':
                result = pivotTable(data, options);
                break;
            
            case 'normalize':
                result = normalizeData(data, options);
                break;
            
            case 'denormalize':
                result = denormalizeData(data, options);
                break;
            
            case 'map':
                result = mapTransform(data, options);
                break;
            
            case 'filter':
                result = filterTransform(data, options);
                break;
            
            case 'reduce':
                result = reduceTransform(data, options);
                break;
            
            case 'sort':
                result = sortTransform(data, options);
                break;
            
            case 'merge':
                result = mergeData(data, options);
                break;
            
            case 'split':
                result = splitData(data, options);
                break;
            
            case 'chunk':
                result = chunkData(data, options);
                break;
            
            case 'sample':
                result = sampleData(data, options);
                break;
            
            case 'deduplicate':
                result = deduplicateData(data, options);
                break;
            
            case 'transform_keys':
                result = transformKeys(data, options);
                break;
            
            case 'transform_values':
                result = transformValues(data, options);
                break;
            
            case 'zip':
                result = zipArrays(data, options);
                break;
            
            case 'unzip':
                result = unzipArray(data, options);
                break;
            
            case 'cross_join':
                result = crossJoin(data, options);
                break;
            
            default:
                return {
                    success: false,
                    error: `Unknown operation: ${operation}`,
                    metadata: {
                        availableOperations: [
                            'flatten', 'unflatten', 'group_by', 'pivot', 'normalize',
                            'denormalize', 'map', 'filter', 'reduce', 'sort',
                            'merge', 'split', 'chunk', 'sample', 'deduplicate',
                            'transform_keys', 'transform_values', 'zip', 'unzip', 'cross_join'
                        ]
                    }
                };
        }
        
        const duration = Date.now() - startTime;
        
        return {
            success: true,
            original: data,
            transformed: result,
            metadata: {
                operation,
                duration,
                originalType: getDataType(data),
                transformedType: getDataType(result),
                originalCount: getItemCount(data),
                transformedCount: getItemCount(result)
            }
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            metadata: {
                operation,
                duration: Date.now() - startTime
            }
        };
    }
}

function flattenObject(obj: any, options: TransformOptions): any {
    const separator = options.separator || '.';
    const maxDepth = options.deep === false ? 1 : Infinity;
    
    function flatten(obj: any, prefix: string = '', depth: number = 0): any {
        if (depth >= maxDepth || obj === null || typeof obj !== 'object') {
            return { [prefix]: obj };
        }
        
        if (Array.isArray(obj)) {
            const result: any = {};
            obj.forEach((item, index) => {
                const key = prefix ? `${prefix}${separator}${index}` : String(index);
                Object.assign(result, flatten(item, key, depth + 1));
            });
            return result;
        }
        
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}${separator}${key}` : key;
            
            if (value === null || typeof value !== 'object' || depth >= maxDepth - 1) {
                result[newKey] = value;
            } else {
                Object.assign(result, flatten(value, newKey, depth + 1));
            }
        }
        return result;
    }
    
    return flatten(obj);
}

function unflattenObject(obj: any, options: TransformOptions): any {
    const separator = options.separator || '.';
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
        const parts = key.split(separator);
        let current = result;
        
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            const nextPart = parts[i + 1];
            const isArrayIndex = /^\d+$/.test(nextPart);
            
            if (!(part in current)) {
                current[part] = isArrayIndex ? [] : {};
            }
            current = current[part];
        }
        
        const lastPart = parts[parts.length - 1];
        current[lastPart] = value;
    }
    
    return result;
}

function groupBy(data: any[], options: TransformOptions): any {
    if (!Array.isArray(data)) {
        throw new Error('Data must be an array for groupBy operation');
    }
    
    const key = options.key || options.field;
    if (!key) {
        throw new Error('Key or field is required for groupBy operation');
    }
    
    const groups: Record<string, any[]> = {};
    
    for (const item of data) {
        const groupKey = String(item[key] || 'undefined');
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(item);
    }
    
    return groups;
}

function pivotTable(data: any[], options: TransformOptions): any {
    if (!Array.isArray(data)) {
        throw new Error('Data must be an array for pivot operation');
    }
    
    const rowKey = options.key || 'row';
    const colKey = options.field || 'column';
    const valueKey = options.value || 'value';
    const aggregation = options.operation || 'sum';
    
    const pivot: Record<string, Record<string, any>> = {};
    const columns = new Set<string>();
    
    for (const item of data) {
        const row = String(item[rowKey]);
        const col = String(item[colKey]);
        const value = item[valueKey];
        
        columns.add(col);
        
        if (!pivot[row]) {
            pivot[row] = {};
        }
        
        if (!pivot[row][col]) {
            pivot[row][col] = [];
        }
        
        pivot[row][col].push(value);
    }
    
    // Apply aggregation
    for (const row of Object.keys(pivot)) {
        for (const col of columns) {
            const values = pivot[row][col] || [];
            
            switch (aggregation) {
                case 'sum':
                    pivot[row][col] = values.reduce((a: number, b: number) => a + b, 0);
                    break;
                case 'avg':
                    pivot[row][col] = values.length > 0 
                        ? values.reduce((a: number, b: number) => a + b, 0) / values.length 
                        : 0;
                    break;
                case 'count':
                    pivot[row][col] = values.length;
                    break;
                case 'min':
                    pivot[row][col] = values.length > 0 ? Math.min(...values) : null;
                    break;
                case 'max':
                    pivot[row][col] = values.length > 0 ? Math.max(...values) : null;
                    break;
                case 'first':
                    pivot[row][col] = values[0] || null;
                    break;
                case 'last':
                    pivot[row][col] = values[values.length - 1] || null;
                    break;
                default:
                    pivot[row][col] = values;
            }
        }
    }
    
    return {
        pivot,
        rows: Object.keys(pivot),
        columns: Array.from(columns),
        aggregation
    };
}

function normalizeData(data: any, options: TransformOptions): any {
    if (Array.isArray(data)) {
        // Normalize array of numbers
        if (data.every(item => typeof item === 'number')) {
            const min = Math.min(...data);
            const max = Math.max(...data);
            const range = max - min;
            
            return data.map(value => range === 0 ? 0 : (value - min) / range);
        }
        
        // Normalize array of objects
        if (data.length > 0 && typeof data[0] === 'object') {
            const normalized: Record<string, any[]> = {};
            const keys = Object.keys(data[0]);
            
            for (const key of keys) {
                normalized[key] = data.map(item => item[key]);
            }
            
            return normalized;
        }
    }
    
    // Normalize object with nested arrays
    if (typeof data === 'object' && !Array.isArray(data)) {
        const normalized: any[] = [];
        const keys = Object.keys(data);
        const maxLength = Math.max(...keys.map(key => 
            Array.isArray(data[key]) ? data[key].length : 1
        ));
        
        for (let i = 0; i < maxLength; i++) {
            const item: any = {};
            for (const key of keys) {
                item[key] = Array.isArray(data[key]) ? data[key][i] : data[key];
            }
            normalized.push(item);
        }
        
        return normalized;
    }
    
    return data;
}

function denormalizeData(data: any, options: TransformOptions): any {
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
        // Convert array of objects to object of arrays
        const denormalized: Record<string, any[]> = {};
        
        for (const item of data) {
            for (const [key, value] of Object.entries(item)) {
                if (!denormalized[key]) {
                    denormalized[key] = [];
                }
                denormalized[key].push(value);
            }
        }
        
        return denormalized;
    }
    
    if (typeof data === 'object' && !Array.isArray(data)) {
        // Convert object of arrays to array of objects
        const keys = Object.keys(data);
        const maxLength = Math.max(...keys.map(key => 
            Array.isArray(data[key]) ? data[key].length : 1
        ));
        
        const denormalized: any[] = [];
        
        for (let i = 0; i < maxLength; i++) {
            const item: any = {};
            for (const key of keys) {
                item[key] = Array.isArray(data[key]) ? data[key][i] : data[key];
            }
            denormalized.push(item);
        }
        
        return denormalized;
    }
    
    return data;
}

function mapTransform(data: any, options: TransformOptions): any {
    const transformer = options.transformer || ((x: any) => x);
    
    if (Array.isArray(data)) {
        return data.map(transformer);
    }
    
    if (typeof data === 'object' && data !== null) {
        const result: any = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = transformer(value);
        }
        return result;
    }
    
    return transformer(data);
}

function filterTransform(data: any, options: TransformOptions): any {
    const predicate = options.predicate || (() => true);
    
    if (Array.isArray(data)) {
        return data.filter(predicate);
    }
    
    if (typeof data === 'object' && data !== null) {
        const result: any = {};
        for (const [key, value] of Object.entries(data)) {
            if (predicate(value)) {
                result[key] = value;
            }
        }
        return result;
    }
    
    return predicate(data) ? data : undefined;
}

function reduceTransform(data: any, options: TransformOptions): any {
    if (!Array.isArray(data)) {
        throw new Error('Data must be an array for reduce operation');
    }
    
    const operation = options.operation || 'sum';
    const field = options.field;
    
    const values = field ? data.map(item => item[field]) : data;
    
    switch (operation) {
        case 'sum':
            return values.reduce((a, b) => a + b, 0);
        
        case 'product':
            return values.reduce((a, b) => a * b, 1);
        
        case 'min':
            return Math.min(...values);
        
        case 'max':
            return Math.max(...values);
        
        case 'avg':
            return values.reduce((a, b) => a + b, 0) / values.length;
        
        case 'concat':
            return values.reduce((a, b) => String(a) + String(b), '');
        
        case 'unique':
            return [...new Set(values)];
        
        case 'count':
            return values.length;
        
        default:
            return values;
    }
}

function sortTransform(data: any, options: TransformOptions): any {
    if (!Array.isArray(data)) {
        throw new Error('Data must be an array for sort operation');
    }
    
    const field = options.field;
    const direction = options.direction || 'asc';
    
    const sorted = [...data].sort((a, b) => {
        const aVal = field ? a[field] : a;
        const bVal = field ? b[field] : b;
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    return sorted;
}

function mergeData(data: any, options: TransformOptions): any {
    if (Array.isArray(data)) {
        // Merge arrays
        if (data.every(Array.isArray)) {
            return data.flat();
        }
        
        // Merge objects in array
        if (data.every(item => typeof item === 'object' && !Array.isArray(item))) {
            return Object.assign({}, ...data);
        }
    }
    
    if (typeof data === 'object' && !Array.isArray(data)) {
        // Merge with provided values
        const values = options.values || {};
        return { ...data, ...values };
    }
    
    return data;
}

function splitData(data: any, options: TransformOptions): any {
    const separator = options.separator || ',';
    const size = options.size;
    
    if (typeof data === 'string') {
        return data.split(separator);
    }
    
    if (Array.isArray(data)) {
        if (size) {
            // Split into chunks of specified size
            const chunks: any[][] = [];
            for (let i = 0; i < data.length; i += size) {
                chunks.push(data.slice(i, i + size));
            }
            return chunks;
        }
        
        // Split by predicate
        const predicate = options.predicate || (() => false);
        const result: any[][] = [[]];
        
        for (const item of data) {
            if (predicate(item) && result[result.length - 1].length > 0) {
                result.push([]);
            } else {
                result[result.length - 1].push(item);
            }
        }
        
        return result.filter(chunk => chunk.length > 0);
    }
    
    return [data];
}

function chunkData(data: any, options: TransformOptions): any[][] {
    if (!Array.isArray(data)) {
        throw new Error('Data must be an array for chunk operation');
    }
    
    const size = options.size || 10;
    const chunks: any[][] = [];
    
    for (let i = 0; i < data.length; i += size) {
        chunks.push(data.slice(i, i + size));
    }
    
    return chunks;
}

function sampleData(data: any, options: TransformOptions): any {
    if (!Array.isArray(data)) {
        throw new Error('Data must be an array for sample operation');
    }
    
    const count = options.count || 1;
    const unique = options.unique !== false;
    
    if (unique) {
        // Sample without replacement
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, data.length));
    } else {
        // Sample with replacement
        const samples: any[] = [];
        for (let i = 0; i < count; i++) {
            samples.push(data[Math.floor(Math.random() * data.length)]);
        }
        return samples;
    }
}

function deduplicateData(data: any, options: TransformOptions): any {
    if (!Array.isArray(data)) {
        return data;
    }
    
    const field = options.field;
    
    if (field) {
        // Deduplicate by field
        const seen = new Set<any>();
        return data.filter(item => {
            const value = item[field];
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    }
    
    // Deduplicate primitive values or whole objects
    if (data.every(item => typeof item !== 'object' || item === null)) {
        return [...new Set(data)];
    }
    
    // Deduplicate objects by JSON string
    const seen = new Set<string>();
    return data.filter(item => {
        const key = JSON.stringify(item);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

function transformKeys(data: any, options: TransformOptions): any {
    const operation = options.operation || 'camelCase';
    
    function transformKey(key: string): string {
        switch (operation) {
            case 'camelCase':
                return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            
            case 'snake_case':
                return key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            
            case 'kebab-case':
                return key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
            
            case 'uppercase':
                return key.toUpperCase();
            
            case 'lowercase':
                return key.toLowerCase();
            
            default:
                return key;
        }
    }
    
    if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
        const result: any = {};
        for (const [key, value] of Object.entries(data)) {
            const newKey = transformKey(key);
            result[newKey] = typeof value === 'object' && options.deep 
                ? transformKeys(value, options) 
                : value;
        }
        return result;
    }
    
    if (Array.isArray(data)) {
        return data.map(item => 
            typeof item === 'object' ? transformKeys(item, options) : item
        );
    }
    
    return data;
}

function transformValues(data: any, options: TransformOptions): any {
    const transformer = options.transformer || ((x: any) => x);
    
    if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
        const result: any = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = options.deep && typeof value === 'object'
                ? transformValues(value, options)
                : transformer(value);
        }
        return result;
    }
    
    if (Array.isArray(data)) {
        return data.map(item => 
            options.deep && typeof item === 'object'
                ? transformValues(item, options)
                : transformer(item)
        );
    }
    
    return transformer(data);
}

function zipArrays(data: any, options: TransformOptions): any {
    if (!Array.isArray(data) || !data.every(Array.isArray)) {
        throw new Error('Data must be an array of arrays for zip operation');
    }
    
    const maxLength = Math.max(...data.map(arr => arr.length));
    const result: any[][] = [];
    
    for (let i = 0; i < maxLength; i++) {
        result.push(data.map(arr => arr[i]));
    }
    
    return result;
}

function unzipArray(data: any, options: TransformOptions): any {
    if (!Array.isArray(data) || !data.every(Array.isArray)) {
        throw new Error('Data must be an array of arrays for unzip operation');
    }
    
    if (data.length === 0) return [];
    
    const width = data[0].length;
    const result: any[][] = [];
    
    for (let i = 0; i < width; i++) {
        result.push(data.map(row => row[i]));
    }
    
    return result;
}

function crossJoin(data: any, options: TransformOptions): any {
    if (!Array.isArray(data) || data.length !== 2 || !data.every(Array.isArray)) {
        throw new Error('Data must be an array of exactly 2 arrays for cross join');
    }
    
    const [arr1, arr2] = data;
    const result: any[] = [];
    
    for (const item1 of arr1) {
        for (const item2 of arr2) {
            if (typeof item1 === 'object' && typeof item2 === 'object') {
                result.push({ ...item1, ...item2 });
            } else {
                result.push([item1, item2]);
            }
        }
    }
    
    return result;
}

// Helper functions
function getDataType(data: any): string {
    if (Array.isArray(data)) return 'array';
    if (data === null) return 'null';
    return typeof data;
}

function getItemCount(data: any): number {
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'object' && data !== null) return Object.keys(data).length;
    return 1;
}

// Export the main function
export default main;