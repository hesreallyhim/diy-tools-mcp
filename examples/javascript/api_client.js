/**
 * API Client Functions
 * Simulates API interactions with mock data and response formatting
 */

function main(action, endpoint, options = {}) {
    try {
        switch (action) {
            case 'get':
                return handleGet(endpoint, options);
            
            case 'post':
                return handlePost(endpoint, options);
            
            case 'put':
                return handlePut(endpoint, options);
            
            case 'delete':
                return handleDelete(endpoint, options);
            
            case 'paginate':
                return handlePagination(endpoint, options);
            
            case 'search':
                return handleSearch(endpoint, options);
            
            case 'filter':
                return handleFilter(endpoint, options);
            
            case 'aggregate':
                return handleAggregate(endpoint, options);
            
            case 'batch':
                return handleBatch(endpoint, options);
            
            case 'mock':
                return generateMockData(endpoint, options);
            
            default:
                return {
                    error: `Unknown action: ${action}`,
                    available: [
                        'get', 'post', 'put', 'delete', 'paginate',
                        'search', 'filter', 'aggregate', 'batch', 'mock'
                    ]
                };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

function handleGet(endpoint, options) {
    const mockData = getMockDataForEndpoint(endpoint);
    
    if (options.id) {
        const item = mockData.find(item => item.id === options.id);
        return {
            success: true,
            method: 'GET',
            endpoint: `${endpoint}/${options.id}`,
            data: item || null,
            status: item ? 200 : 404,
            timestamp: new Date().toISOString()
        };
    }
    
    return {
        success: true,
        method: 'GET',
        endpoint: endpoint,
        data: mockData,
        count: mockData.length,
        status: 200,
        timestamp: new Date().toISOString()
    };
}

function handlePost(endpoint, options) {
    const newItem = options.data || {};
    newItem.id = generateId();
    newItem.createdAt = new Date().toISOString();
    
    return {
        success: true,
        method: 'POST',
        endpoint: endpoint,
        data: newItem,
        message: 'Resource created successfully',
        status: 201,
        timestamp: new Date().toISOString()
    };
}

function handlePut(endpoint, options) {
    if (!options.id) {
        return {
            success: false,
            error: 'ID is required for PUT request',
            status: 400
        };
    }
    
    const updatedItem = {
        ...options.data,
        id: options.id,
        updatedAt: new Date().toISOString()
    };
    
    return {
        success: true,
        method: 'PUT',
        endpoint: `${endpoint}/${options.id}`,
        data: updatedItem,
        message: 'Resource updated successfully',
        status: 200,
        timestamp: new Date().toISOString()
    };
}

function handleDelete(endpoint, options) {
    if (!options.id) {
        return {
            success: false,
            error: 'ID is required for DELETE request',
            status: 400
        };
    }
    
    return {
        success: true,
        method: 'DELETE',
        endpoint: `${endpoint}/${options.id}`,
        message: 'Resource deleted successfully',
        status: 204,
        timestamp: new Date().toISOString()
    };
}

function handlePagination(endpoint, options) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const mockData = getMockDataForEndpoint(endpoint);
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = mockData.slice(startIndex, endIndex);
    
    const totalPages = Math.ceil(mockData.length / limit);
    
    return {
        success: true,
        endpoint: endpoint,
        data: paginatedData,
        pagination: {
            page: page,
            limit: limit,
            total: mockData.length,
            totalPages: totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        },
        links: {
            first: `${endpoint}?page=1&limit=${limit}`,
            last: `${endpoint}?page=${totalPages}&limit=${limit}`,
            next: page < totalPages ? `${endpoint}?page=${page + 1}&limit=${limit}` : null,
            prev: page > 1 ? `${endpoint}?page=${page - 1}&limit=${limit}` : null
        },
        timestamp: new Date().toISOString()
    };
}

function handleSearch(endpoint, options) {
    const query = (options.query || '').toLowerCase();
    const mockData = getMockDataForEndpoint(endpoint);
    
    if (!query) {
        return {
            success: false,
            error: 'Search query is required',
            status: 400
        };
    }
    
    const results = mockData.filter(item => {
        return Object.values(item).some(value => 
            String(value).toLowerCase().includes(query)
        );
    });
    
    return {
        success: true,
        endpoint: endpoint,
        query: query,
        results: results,
        count: results.length,
        totalSearched: mockData.length,
        timestamp: new Date().toISOString()
    };
}

function handleFilter(endpoint, options) {
    const filters = options.filters || {};
    const mockData = getMockDataForEndpoint(endpoint);
    
    let filtered = mockData;
    
    for (const [key, value] of Object.entries(filters)) {
        filtered = filtered.filter(item => {
            if (Array.isArray(value)) {
                return value.includes(item[key]);
            }
            if (typeof value === 'object' && value !== null) {
                if (value.min !== undefined && value.max !== undefined) {
                    return item[key] >= value.min && item[key] <= value.max;
                }
            }
            return item[key] === value;
        });
    }
    
    return {
        success: true,
        endpoint: endpoint,
        filters: filters,
        data: filtered,
        count: filtered.length,
        totalBeforeFilter: mockData.length,
        timestamp: new Date().toISOString()
    };
}

function handleAggregate(endpoint, options) {
    const groupBy = options.groupBy || 'status';
    const operation = options.operation || 'count';
    const mockData = getMockDataForEndpoint(endpoint);
    
    const groups = {};
    
    for (const item of mockData) {
        const key = item[groupBy] || 'undefined';
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
    }
    
    const aggregated = {};
    
    for (const [key, items] of Object.entries(groups)) {
        switch (operation) {
            case 'count':
                aggregated[key] = items.length;
                break;
            case 'sum':
                aggregated[key] = items.reduce((sum, item) => 
                    sum + (item[options.field || 'value'] || 0), 0
                );
                break;
            case 'avg':
                const sum = items.reduce((sum, item) => 
                    sum + (item[options.field || 'value'] || 0), 0
                );
                aggregated[key] = items.length > 0 ? sum / items.length : 0;
                break;
            case 'min':
                aggregated[key] = Math.min(...items.map(item => 
                    item[options.field || 'value'] || 0
                ));
                break;
            case 'max':
                aggregated[key] = Math.max(...items.map(item => 
                    item[options.field || 'value'] || 0
                ));
                break;
            default:
                aggregated[key] = items.length;
        }
    }
    
    return {
        success: true,
        endpoint: endpoint,
        aggregation: {
            groupBy: groupBy,
            operation: operation,
            field: options.field
        },
        data: aggregated,
        groups: Object.keys(groups).length,
        totalItems: mockData.length,
        timestamp: new Date().toISOString()
    };
}

function handleBatch(endpoint, options) {
    const operations = options.operations || [];
    const results = [];
    
    for (const op of operations) {
        let result;
        switch (op.method) {
            case 'GET':
                result = handleGet(endpoint, op);
                break;
            case 'POST':
                result = handlePost(endpoint, op);
                break;
            case 'PUT':
                result = handlePut(endpoint, op);
                break;
            case 'DELETE':
                result = handleDelete(endpoint, op);
                break;
            default:
                result = { error: `Unknown method: ${op.method}` };
        }
        
        results.push({
            operation: op,
            result: result
        });
    }
    
    return {
        success: true,
        endpoint: endpoint,
        batch: {
            total: operations.length,
            successful: results.filter(r => r.result.success).length,
            failed: results.filter(r => !r.result.success).length
        },
        results: results,
        timestamp: new Date().toISOString()
    };
}

function generateMockData(endpoint, options) {
    const count = options.count || 5;
    const schema = options.schema || getDefaultSchema(endpoint);
    const data = [];
    
    for (let i = 0; i < count; i++) {
        const item = {};
        
        for (const [field, config] of Object.entries(schema)) {
            item[field] = generateFieldValue(field, config, i);
        }
        
        data.push(item);
    }
    
    return {
        success: true,
        endpoint: endpoint,
        generated: count,
        schema: schema,
        data: data,
        timestamp: new Date().toISOString()
    };
}

function getMockDataForEndpoint(endpoint) {
    const baseData = {
        users: [
            { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', value: 100 },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active', value: 150 },
            { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'inactive', value: 75 },
            { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'active', value: 200 },
            { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', status: 'pending', value: 50 }
        ],
        products: [
            { id: 1, name: 'Widget A', price: 29.99, category: 'electronics', stock: 100 },
            { id: 2, name: 'Gadget B', price: 49.99, category: 'electronics', stock: 50 },
            { id: 3, name: 'Tool C', price: 19.99, category: 'tools', stock: 200 },
            { id: 4, name: 'Device D', price: 99.99, category: 'electronics', stock: 25 },
            { id: 5, name: 'Item E', price: 9.99, category: 'accessories', stock: 500 }
        ],
        orders: [
            { id: 1, userId: 1, total: 79.98, status: 'completed', date: '2024-01-15' },
            { id: 2, userId: 2, total: 49.99, status: 'pending', date: '2024-01-16' },
            { id: 3, userId: 1, total: 129.97, status: 'completed', date: '2024-01-17' },
            { id: 4, userId: 3, total: 19.99, status: 'cancelled', date: '2024-01-18' },
            { id: 5, userId: 4, total: 199.95, status: 'processing', date: '2024-01-19' }
        ]
    };
    
    // Return data based on endpoint or generate generic data
    const endpointName = endpoint.split('/').pop();
    return baseData[endpointName] || generateGenericMockData();
}

function generateGenericMockData() {
    const data = [];
    for (let i = 1; i <= 10; i++) {
        data.push({
            id: i,
            title: `Item ${i}`,
            description: `Description for item ${i}`,
            value: Math.floor(Math.random() * 1000),
            status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)],
            createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString()
        });
    }
    return data;
}

function getDefaultSchema(endpoint) {
    const schemas = {
        users: {
            id: { type: 'id' },
            name: { type: 'name' },
            email: { type: 'email' },
            status: { type: 'enum', values: ['active', 'inactive', 'pending'] },
            createdAt: { type: 'date' }
        },
        products: {
            id: { type: 'id' },
            name: { type: 'product' },
            price: { type: 'price' },
            category: { type: 'enum', values: ['electronics', 'clothing', 'food', 'tools'] },
            stock: { type: 'number', min: 0, max: 1000 }
        },
        default: {
            id: { type: 'id' },
            title: { type: 'string' },
            value: { type: 'number' },
            status: { type: 'enum', values: ['active', 'inactive'] },
            createdAt: { type: 'date' }
        }
    };
    
    const endpointName = endpoint.split('/').pop();
    return schemas[endpointName] || schemas.default;
}

function generateFieldValue(field, config, index) {
    switch (config.type) {
        case 'id':
            return index + 1;
        case 'name':
            const names = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'David', 'Eve', 'Frank'];
            const surnames = ['Smith', 'Johnson', 'Brown', 'Wilson', 'Davis', 'Miller', 'Taylor'];
            return `${names[index % names.length]} ${surnames[index % surnames.length]}`;
        case 'email':
            return `user${index + 1}@example.com`;
        case 'product':
            const products = ['Widget', 'Gadget', 'Tool', 'Device', 'Item', 'Product'];
            return `${products[index % products.length]} ${String.fromCharCode(65 + index)}`;
        case 'price':
            return parseFloat((Math.random() * 100 + 10).toFixed(2));
        case 'number':
            const min = config.min || 0;
            const max = config.max || 100;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        case 'enum':
            return config.values[Math.floor(Math.random() * config.values.length)];
        case 'date':
            return new Date(Date.now() - Math.random() * 10000000000).toISOString();
        case 'string':
        default:
            return `${field}_${index + 1}`;
    }
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Export the main function
module.exports = main;