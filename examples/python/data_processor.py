"""
Data Processing Functions
Processes CSV and JSON data with various transformations
"""
import json
import csv
from io import StringIO


def main(data, format, operation="parse"):
    """
    Process data in various formats with different operations.
    
    Args:
        data (str): Raw data to process
        format (str): Data format - 'csv' or 'json'
        operation (str): Operation to perform - 'parse', 'filter', 'transform'
    
    Returns:
        dict: Processed data with metadata
    """
    try:
        if format == "csv":
            return process_csv(data, operation)
        elif format == "json":
            return process_json(data, operation)
        else:
            return {
                "success": False,
                "error": f"Unsupported format: {format}"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def process_csv(data, operation):
    """Process CSV data"""
    reader = csv.DictReader(StringIO(data))
    rows = list(reader)
    
    if operation == "parse":
        return {
            "success": True,
            "row_count": len(rows),
            "columns": reader.fieldnames,
            "data": rows[:10]  # Return first 10 rows
        }
    elif operation == "filter":
        # Example: filter rows with non-empty first column
        filtered = [row for row in rows if row.get(reader.fieldnames[0])]
        return {
            "success": True,
            "original_count": len(rows),
            "filtered_count": len(filtered),
            "data": filtered[:10]
        }
    elif operation == "transform":
        # Example: convert all values to uppercase
        transformed = [
            {k: v.upper() if isinstance(v, str) else v for k, v in row.items()}
            for row in rows
        ]
        return {
            "success": True,
            "row_count": len(transformed),
            "data": transformed[:10]
        }
    else:
        return {
            "success": False,
            "error": f"Unknown operation: {operation}"
        }


def process_json(data, operation):
    """Process JSON data"""
    parsed = json.loads(data)
    
    if operation == "parse":
        return {
            "success": True,
            "type": type(parsed).__name__,
            "size": len(parsed) if hasattr(parsed, '__len__') else 1,
            "data": parsed
        }
    elif operation == "filter":
        # Example: filter out null values from dict
        if isinstance(parsed, dict):
            filtered = {k: v for k, v in parsed.items() if v is not None}
        elif isinstance(parsed, list):
            filtered = [item for item in parsed if item is not None]
        else:
            filtered = parsed
        return {
            "success": True,
            "original_size": len(parsed) if hasattr(parsed, '__len__') else 1,
            "filtered_size": len(filtered) if hasattr(filtered, '__len__') else 1,
            "data": filtered
        }
    elif operation == "transform":
        # Example: flatten nested structure
        flattened = flatten_json(parsed)
        return {
            "success": True,
            "keys": list(flattened.keys()),
            "data": flattened
        }
    else:
        return {
            "success": False,
            "error": f"Unknown operation: {operation}"
        }


def flatten_json(obj, parent_key='', sep='.'):
    """Flatten nested JSON structure"""
    items = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(flatten_json(v, new_key, sep=sep).items())
            else:
                items.append((new_key, v))
    else:
        items.append((parent_key, obj))
    return dict(items)