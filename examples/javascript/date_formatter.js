/**
 * Date Formatting and Manipulation Functions
 * Provides various date operations and formatting utilities
 */

function main(operation, input, options = {}) {
    try {
        switch (operation) {
            case 'format':
                return formatDate(input, options.format || 'ISO');
            
            case 'parse':
                return parseDate(input, options.format);
            
            case 'add':
                return addToDate(input, options);
            
            case 'subtract':
                return subtractFromDate(input, options);
            
            case 'difference':
                return dateDifference(input, options.compareWith || new Date());
            
            case 'age':
                return calculateAge(input);
            
            case 'workdays':
                return calculateWorkdays(input, options.endDate || new Date());
            
            case 'timezone':
                return convertTimezone(input, options);
            
            case 'relative':
                return getRelativeTime(input);
            
            case 'calendar':
                return getCalendarInfo(input);
            
            case 'range':
                return generateDateRange(input, options);
            
            case 'validate':
                return validateDate(input);
            
            case 'business_hours':
                return calculateBusinessHours(input, options.endDate || new Date());
            
            case 'quarter':
                return getQuarterInfo(input);
            
            case 'week_info':
                return getWeekInfo(input);
            
            default:
                return {
                    error: `Unknown operation: ${operation}`,
                    available: [
                        'format', 'parse', 'add', 'subtract', 'difference',
                        'age', 'workdays', 'timezone', 'relative', 'calendar',
                        'range', 'validate', 'business_hours', 'quarter', 'week_info'
                    ]
                };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message,
            operation: operation
        };
    }
}

function formatDate(input, format) {
    const date = new Date(input);
    
    if (isNaN(date.getTime())) {
        return { error: 'Invalid date input' };
    }
    
    const formats = {
        'ISO': () => date.toISOString(),
        'UTC': () => date.toUTCString(),
        'local': () => date.toString(),
        'date': () => date.toDateString(),
        'time': () => date.toTimeString(),
        'short': () => date.toLocaleDateString(),
        'long': () => date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }),
        'YYYY-MM-DD': () => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        'DD/MM/YYYY': () => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${day}/${month}/${year}`;
        },
        'MM/DD/YYYY': () => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${month}/${day}/${year}`;
        },
        'timestamp': () => date.getTime(),
        'unix': () => Math.floor(date.getTime() / 1000)
    };
    
    const formatter = formats[format] || formats['ISO'];
    
    return {
        original: input,
        formatted: formatter(),
        format: format,
        timestamp: date.getTime()
    };
}

function parseDate(input, format) {
    let date;
    
    if (format === 'unix') {
        date = new Date(parseInt(input) * 1000);
    } else if (format === 'timestamp') {
        date = new Date(parseInt(input));
    } else {
        date = new Date(input);
    }
    
    if (isNaN(date.getTime())) {
        return { error: 'Could not parse date' };
    }
    
    return {
        input: input,
        parsed: {
            iso: date.toISOString(),
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            weekday: date.getDay(),
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds(),
            millisecond: date.getMilliseconds(),
            timestamp: date.getTime()
        },
        formatted: date.toString()
    };
}

function addToDate(input, options) {
    const date = new Date(input);
    
    if (isNaN(date.getTime())) {
        return { error: 'Invalid date input' };
    }
    
    const result = new Date(date);
    
    if (options.years) result.setFullYear(result.getFullYear() + options.years);
    if (options.months) result.setMonth(result.getMonth() + options.months);
    if (options.days) result.setDate(result.getDate() + options.days);
    if (options.hours) result.setHours(result.getHours() + options.hours);
    if (options.minutes) result.setMinutes(result.getMinutes() + options.minutes);
    if (options.seconds) result.setSeconds(result.getSeconds() + options.seconds);
    
    return {
        original: date.toISOString(),
        result: result.toISOString(),
        added: options,
        difference: {
            milliseconds: result - date,
            seconds: (result - date) / 1000,
            minutes: (result - date) / 60000,
            hours: (result - date) / 3600000,
            days: (result - date) / 86400000
        }
    };
}

function subtractFromDate(input, options) {
    const negatedOptions = {};
    for (const [key, value] of Object.entries(options)) {
        negatedOptions[key] = -value;
    }
    return addToDate(input, negatedOptions);
}

function dateDifference(input, compareWith) {
    const date1 = new Date(input);
    const date2 = new Date(compareWith);
    
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
        return { error: 'Invalid date input' };
    }
    
    const diffMs = Math.abs(date2 - date1);
    const diffSeconds = diffMs / 1000;
    const diffMinutes = diffSeconds / 60;
    const diffHours = diffMinutes / 60;
    const diffDays = diffHours / 24;
    const diffWeeks = diffDays / 7;
    const diffMonths = diffDays / 30.44; // Average month length
    const diffYears = diffDays / 365.25; // Account for leap years
    
    return {
        date1: date1.toISOString(),
        date2: date2.toISOString(),
        difference: {
            milliseconds: diffMs,
            seconds: Math.floor(diffSeconds),
            minutes: Math.floor(diffMinutes),
            hours: Math.floor(diffHours),
            days: Math.floor(diffDays),
            weeks: Math.floor(diffWeeks),
            months: Math.floor(diffMonths),
            years: Math.floor(diffYears)
        },
        formatted: formatDuration(diffMs),
        isPast: date1 < date2
    };
}

function calculateAge(birthDate) {
    const birth = new Date(birthDate);
    const today = new Date();
    
    if (isNaN(birth.getTime())) {
        return { error: 'Invalid birth date' };
    }
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBirthday < today) {
        nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    }
    
    const daysUntilBirthday = Math.ceil((nextBirthday - today) / 86400000);
    
    return {
        birthDate: birth.toISOString(),
        age: age,
        ageInMonths: age * 12 + monthDiff,
        ageInDays: Math.floor((today - birth) / 86400000),
        nextBirthday: nextBirthday.toISOString(),
        daysUntilBirthday: daysUntilBirthday
    };
}

function calculateWorkdays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { error: 'Invalid date input' };
    }
    
    let count = 0;
    let totalDays = 0;
    const current = new Date(start);
    
    while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
            count++;
        }
        totalDays++;
        current.setDate(current.getDate() + 1);
    }
    
    return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        workdays: count,
        weekends: totalDays - count,
        totalDays: totalDays
    };
}

function convertTimezone(input, options) {
    const date = new Date(input);
    
    if (isNaN(date.getTime())) {
        return { error: 'Invalid date input' };
    }
    
    const targetTimezone = options.timezone || 'UTC';
    
    // Get offset for target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: targetTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const converted = {};
    
    for (const part of parts) {
        if (part.type !== 'literal') {
            converted[part.type] = part.value;
        }
    }
    
    return {
        original: date.toISOString(),
        timezone: targetTimezone,
        converted: `${converted.year}-${converted.month}-${converted.day} ${converted.hour}:${converted.minute}:${converted.second}`,
        localTime: date.toString(),
        utcTime: date.toUTCString()
    };
}

function getRelativeTime(input) {
    const date = new Date(input);
    const now = new Date();
    
    if (isNaN(date.getTime())) {
        return { error: 'Invalid date input' };
    }
    
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    let relative;
    
    if (Math.abs(diffSeconds) < 60) {
        relative = diffSeconds === 0 ? 'just now' : 
                  diffSeconds > 0 ? `${diffSeconds} seconds ago` : 
                  `in ${Math.abs(diffSeconds)} seconds`;
    } else if (Math.abs(diffMinutes) < 60) {
        relative = diffMinutes > 0 ? `${diffMinutes} minutes ago` : 
                  `in ${Math.abs(diffMinutes)} minutes`;
    } else if (Math.abs(diffHours) < 24) {
        relative = diffHours > 0 ? `${diffHours} hours ago` : 
                  `in ${Math.abs(diffHours)} hours`;
    } else if (Math.abs(diffDays) < 30) {
        relative = diffDays > 0 ? `${diffDays} days ago` : 
                  `in ${Math.abs(diffDays)} days`;
    } else {
        const diffMonths = Math.floor(diffDays / 30);
        relative = diffMonths > 0 ? `${diffMonths} months ago` : 
                  `in ${Math.abs(diffMonths)} months`;
    }
    
    return {
        date: date.toISOString(),
        relative: relative,
        isPast: diffMs > 0,
        isFuture: diffMs < 0,
        isToday: date.toDateString() === now.toDateString()
    };
}

function getCalendarInfo(input) {
    const date = new Date(input);
    
    if (isNaN(date.getTime())) {
        return { error: 'Invalid date input' };
    }
    
    const year = date.getFullYear();
    const month = date.getMonth();
    const dayOfMonth = date.getDate();
    const dayOfWeek = date.getDay();
    
    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get week number
    const firstJan = new Date(year, 0, 1);
    const weekNumber = Math.ceil((((date - firstJan) / 86400000) + firstJan.getDay() + 1) / 7);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
        date: date.toISOString(),
        year: year,
        month: {
            number: month + 1,
            name: monthNames[month],
            days: lastDay.getDate(),
            firstDay: firstDay.toISOString(),
            lastDay: lastDay.toISOString()
        },
        week: {
            number: weekNumber,
            dayOfWeek: dayOfWeek,
            dayName: dayNames[dayOfWeek],
            isWeekend: dayOfWeek === 0 || dayOfWeek === 6
        },
        day: {
            dayOfMonth: dayOfMonth,
            dayOfYear: Math.floor((date - new Date(year, 0, 0)) / 86400000),
            isLeapYear: (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
        }
    };
}

function generateDateRange(startDate, options) {
    const start = new Date(startDate);
    const end = new Date(options.endDate || new Date());
    const step = options.step || 'day';
    const stepCount = options.stepCount || 1;
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { error: 'Invalid date input' };
    }
    
    const dates = [];
    const current = new Date(start);
    
    while (current <= end) {
        dates.push(current.toISOString());
        
        switch (step) {
            case 'hour':
                current.setHours(current.getHours() + stepCount);
                break;
            case 'day':
                current.setDate(current.getDate() + stepCount);
                break;
            case 'week':
                current.setDate(current.getDate() + (7 * stepCount));
                break;
            case 'month':
                current.setMonth(current.getMonth() + stepCount);
                break;
            case 'year':
                current.setFullYear(current.getFullYear() + stepCount);
                break;
            default:
                current.setDate(current.getDate() + stepCount);
        }
    }
    
    return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        step: step,
        stepCount: stepCount,
        dates: dates,
        count: dates.length
    };
}

function validateDate(input) {
    const date = new Date(input);
    const isValid = !isNaN(date.getTime());
    
    const validations = {
        isValid: isValid,
        isWeekend: false,
        isWeekday: false,
        isFuture: false,
        isPast: false,
        isToday: false,
        isThisMonth: false,
        isThisYear: false
    };
    
    if (isValid) {
        const now = new Date();
        const dayOfWeek = date.getDay();
        
        validations.isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        validations.isWeekday = !validations.isWeekend;
        validations.isFuture = date > now;
        validations.isPast = date < now;
        validations.isToday = date.toDateString() === now.toDateString();
        validations.isThisMonth = date.getMonth() === now.getMonth() && 
                                 date.getFullYear() === now.getFullYear();
        validations.isThisYear = date.getFullYear() === now.getFullYear();
    }
    
    return {
        input: input,
        ...validations,
        parsed: isValid ? date.toISOString() : null
    };
}

function calculateBusinessHours(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { error: 'Invalid date input' };
    }
    
    let totalHours = 0;
    const current = new Date(start);
    
    while (current < end) {
        const dayOfWeek = current.getDay();
        
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
            const dayStart = new Date(current);
            dayStart.setHours(9, 0, 0, 0); // 9 AM
            
            const dayEnd = new Date(current);
            dayEnd.setHours(17, 0, 0, 0); // 5 PM
            
            const effectiveStart = current > dayStart ? current : dayStart;
            const effectiveEnd = end < dayEnd ? end : dayEnd;
            
            if (effectiveEnd > effectiveStart) {
                totalHours += (effectiveEnd - effectiveStart) / 3600000;
            }
        }
        
        current.setDate(current.getDate() + 1);
        current.setHours(0, 0, 0, 0);
    }
    
    return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        businessHours: Math.round(totalHours * 100) / 100,
        businessDays: Math.floor(totalHours / 8),
        totalHours: Math.round((end - start) / 3600000 * 100) / 100
    };
}

function getQuarterInfo(input) {
    const date = new Date(input);
    
    if (isNaN(date.getTime())) {
        return { error: 'Invalid date input' };
    }
    
    const month = date.getMonth();
    const year = date.getFullYear();
    const quarter = Math.floor(month / 3) + 1;
    
    const quarterStart = new Date(year, (quarter - 1) * 3, 1);
    const quarterEnd = new Date(year, quarter * 3, 0);
    
    return {
        date: date.toISOString(),
        quarter: quarter,
        year: year,
        quarterName: `Q${quarter} ${year}`,
        quarterStart: quarterStart.toISOString(),
        quarterEnd: quarterEnd.toISOString(),
        daysInQuarter: Math.floor((quarterEnd - quarterStart) / 86400000) + 1,
        dayOfQuarter: Math.floor((date - quarterStart) / 86400000) + 1
    };
}

function getWeekInfo(input) {
    const date = new Date(input);
    
    if (isNaN(date.getTime())) {
        return { error: 'Invalid date input' };
    }
    
    const dayOfWeek = date.getDay();
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // ISO week number calculation
    const tempDate = new Date(date);
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    const weekNumber = 1 + Math.round(((tempDate - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    
    return {
        date: date.toISOString(),
        weekNumber: weekNumber,
        isoWeek: weekNumber,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        dayOfWeek: dayOfWeek,
        daysInWeek: 7,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
    };
}

function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days} day${days !== 1 ? 's' : ''}, ${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}, ${seconds % 60} second${seconds % 60 !== 1 ? 's' : ''}`;
    } else {
        return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
}

// Export the main function
module.exports = main;