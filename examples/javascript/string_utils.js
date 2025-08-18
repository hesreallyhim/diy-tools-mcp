/**
 * String Utility Functions
 * Provides various string manipulation and analysis operations
 */

function main(operation, input, options = {}) {
    try {
        switch (operation) {
            case 'reverse':
                return reverseString(input);
            
            case 'palindrome':
                return checkPalindrome(input);
            
            case 'word_count':
                return wordCount(input);
            
            case 'capitalize':
                return capitalizeWords(input, options);
            
            case 'extract_numbers':
                return extractNumbers(input);
            
            case 'extract_urls':
                return extractUrls(input);
            
            case 'slug':
                return createSlug(input);
            
            case 'truncate':
                return truncateString(input, options.maxLength || 50, options.suffix || '...');
            
            case 'remove_duplicates':
                return removeDuplicateWords(input);
            
            case 'encode':
                return encodeString(input, options.encoding || 'base64');
            
            case 'decode':
                return decodeString(input, options.encoding || 'base64');
            
            case 'hash':
                return hashString(input, options.algorithm || 'simple');
            
            case 'validate_email':
                return validateEmail(input);
            
            case 'extract_hashtags':
                return extractHashtags(input);
            
            case 'word_frequency':
                return wordFrequency(input);
            
            case 'levenshtein':
                return levenshteinDistance(input, options.compareWith || '');
            
            case 'camelCase':
                return toCamelCase(input);
            
            case 'snake_case':
                return toSnakeCase(input);
            
            case 'kebab-case':
                return toKebabCase(input);
            
            default:
                return {
                    error: `Unknown operation: ${operation}`,
                    available: [
                        'reverse', 'palindrome', 'word_count', 'capitalize',
                        'extract_numbers', 'extract_urls', 'slug', 'truncate',
                        'remove_duplicates', 'encode', 'decode', 'hash',
                        'validate_email', 'extract_hashtags', 'word_frequency',
                        'levenshtein', 'camelCase', 'snake_case', 'kebab-case'
                    ]
                };
        }
    } catch (error) {
        return { error: error.message, operation };
    }
}

function reverseString(str) {
    const reversed = str.split('').reverse().join('');
    return {
        original: str,
        reversed: reversed,
        length: str.length
    };
}

function checkPalindrome(str) {
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const reversed = cleaned.split('').reverse().join('');
    const isPalindrome = cleaned === reversed;
    
    return {
        original: str,
        cleaned: cleaned,
        isPalindrome: isPalindrome,
        message: isPalindrome ? 'This is a palindrome!' : 'This is not a palindrome.'
    };
}

function wordCount(str) {
    const words = str.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = str.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = str.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    return {
        words: words.length,
        characters: str.length,
        charactersNoSpaces: str.replace(/\s/g, '').length,
        sentences: sentences.length,
        paragraphs: paragraphs.length,
        averageWordLength: words.length > 0 
            ? (words.reduce((sum, word) => sum + word.length, 0) / words.length).toFixed(2)
            : 0
    };
}

function capitalizeWords(str, options) {
    let result;
    
    if (options.type === 'first') {
        // Capitalize first letter only
        result = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    } else if (options.type === 'all') {
        // Capitalize all words
        result = str.replace(/\b\w/g, l => l.toUpperCase());
    } else if (options.type === 'sentence') {
        // Capitalize first letter of each sentence
        result = str.replace(/(^\w|[.!?]\s+\w)/g, l => l.toUpperCase());
    } else {
        // Default: capitalize first letter of each word
        result = str.replace(/\b\w+/g, word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        );
    }
    
    return {
        original: str,
        capitalized: result,
        type: options.type || 'title'
    };
}

function extractNumbers(str) {
    const integers = str.match(/-?\d+/g) || [];
    const decimals = str.match(/-?\d+\.\d+/g) || [];
    const allNumbers = str.match(/-?\d+\.?\d*/g) || [];
    
    return {
        integers: integers.map(n => parseInt(n)),
        decimals: decimals.map(n => parseFloat(n)),
        allNumbers: allNumbers.map(n => parseFloat(n)),
        count: allNumbers.length,
        sum: allNumbers.reduce((sum, n) => sum + parseFloat(n), 0)
    };
}

function extractUrls(str) {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const urls = str.match(urlRegex) || [];
    
    const domains = urls.map(url => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return null;
        }
    }).filter(Boolean);
    
    return {
        urls: urls,
        domains: [...new Set(domains)],
        count: urls.length
    };
}

function createSlug(str) {
    const slug = str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    
    return {
        original: str,
        slug: slug,
        length: slug.length
    };
}

function truncateString(str, maxLength, suffix) {
    if (str.length <= maxLength) {
        return {
            original: str,
            truncated: str,
            wasTruncated: false
        };
    }
    
    const truncated = str.substring(0, maxLength - suffix.length) + suffix;
    
    return {
        original: str,
        truncated: truncated,
        wasTruncated: true,
        originalLength: str.length,
        truncatedLength: truncated.length
    };
}

function removeDuplicateWords(str) {
    const words = str.split(/\s+/);
    const uniqueWords = [...new Set(words)];
    const result = uniqueWords.join(' ');
    
    return {
        original: str,
        result: result,
        originalWordCount: words.length,
        uniqueWordCount: uniqueWords.length,
        duplicatesRemoved: words.length - uniqueWords.length
    };
}

function encodeString(str, encoding) {
    let encoded;
    
    switch (encoding) {
        case 'base64':
            encoded = Buffer.from(str).toString('base64');
            break;
        case 'hex':
            encoded = Buffer.from(str).toString('hex');
            break;
        case 'uri':
            encoded = encodeURIComponent(str);
            break;
        case 'html':
            encoded = str.replace(/[&<>"']/g, m => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[m]);
            break;
        default:
            return { error: `Unsupported encoding: ${encoding}` };
    }
    
    return {
        original: str,
        encoded: encoded,
        encoding: encoding
    };
}

function decodeString(str, encoding) {
    let decoded;
    
    try {
        switch (encoding) {
            case 'base64':
                decoded = Buffer.from(str, 'base64').toString();
                break;
            case 'hex':
                decoded = Buffer.from(str, 'hex').toString();
                break;
            case 'uri':
                decoded = decodeURIComponent(str);
                break;
            case 'html':
                decoded = str.replace(/&([^;]+);/g, (m, e) => {
                    const entities = {
                        'amp': '&',
                        'lt': '<',
                        'gt': '>',
                        'quot': '"',
                        '#39': "'"
                    };
                    return entities[e] || m;
                });
                break;
            default:
                return { error: `Unsupported encoding: ${encoding}` };
        }
        
        return {
            original: str,
            decoded: decoded,
            encoding: encoding
        };
    } catch (error) {
        return {
            error: `Failed to decode: ${error.message}`,
            encoding: encoding
        };
    }
}

function hashString(str, algorithm) {
    let hash;
    
    switch (algorithm) {
        case 'simple':
            // Simple hash for demonstration
            hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            hash = Math.abs(hash).toString(16);
            break;
        
        case 'djb2':
            // DJB2 hash algorithm
            hash = 5381;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) + hash) + str.charCodeAt(i);
            }
            hash = Math.abs(hash).toString(16);
            break;
        
        default:
            return { error: `Unsupported algorithm: ${algorithm}` };
    }
    
    return {
        original: str,
        hash: hash,
        algorithm: algorithm,
        length: hash.length
    };
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    let details = {
        hasAtSymbol: email.includes('@'),
        hasDomain: false,
        hasLocalPart: false
    };
    
    if (details.hasAtSymbol) {
        const parts = email.split('@');
        details.hasLocalPart = parts[0] && parts[0].length > 0;
        details.hasDomain = parts[1] && parts[1].includes('.');
    }
    
    return {
        email: email,
        isValid: isValid,
        details: details
    };
}

function extractHashtags(str) {
    const hashtags = str.match(/#\w+/g) || [];
    const withoutHash = hashtags.map(tag => tag.substring(1));
    
    return {
        hashtags: hashtags,
        withoutHash: withoutHash,
        count: hashtags.length,
        unique: [...new Set(withoutHash)]
    };
}

function wordFrequency(str) {
    const words = str.toLowerCase().match(/\b\w+\b/g) || [];
    const frequency = {};
    
    for (const word of words) {
        frequency[word] = (frequency[word] || 0) + 1;
    }
    
    const sorted = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
    
    return {
        totalWords: words.length,
        uniqueWords: Object.keys(frequency).length,
        topWords: sorted.map(([word, count]) => ({ word, count })),
        frequency: frequency
    };
}

function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    
    if (m === 0) return { distance: n, similarity: 0 };
    if (n === 0) return { distance: m, similarity: 0 };
    
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,    // deletion
                    dp[i][j - 1] + 1,    // insertion
                    dp[i - 1][j - 1] + 1 // substitution
                );
            }
        }
    }
    
    const distance = dp[m][n];
    const maxLength = Math.max(m, n);
    const similarity = ((maxLength - distance) / maxLength * 100).toFixed(2);
    
    return {
        string1: str1,
        string2: str2,
        distance: distance,
        similarity: parseFloat(similarity),
        similarityPercent: `${similarity}%`
    };
}

function toCamelCase(str) {
    const result = str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
            index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, '');
    
    return {
        original: str,
        camelCase: result
    };
}

function toSnakeCase(str) {
    const result = str
        .replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('_');
    
    return {
        original: str,
        snake_case: result
    };
}

function toKebabCase(str) {
    const result = str
        .replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('-');
    
    return {
        original: str,
        'kebab-case': result
    };
}

// Export the main function
module.exports = main;