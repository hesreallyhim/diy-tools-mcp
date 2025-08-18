"""
Simple Math Functions
Provides basic and advanced mathematical operations
"""
import math
from typing import Union, List


def main(operation: str, a: Union[float, List[float]], b: Union[float, None] = None) -> dict:
    """
    Perform various mathematical operations.
    
    Args:
        operation (str): The mathematical operation to perform
        a (Union[float, List[float]]): First operand or list of numbers
        b (Union[float, None]): Second operand (optional for some operations)
    
    Returns:
        dict: Result of the mathematical operation
    """
    try:
        if operation == "add":
            if b is None:
                return {"error": "Addition requires two operands"}
            return {"result": a + b, "operation": f"{a} + {b}"}
        
        elif operation == "subtract":
            if b is None:
                return {"error": "Subtraction requires two operands"}
            return {"result": a - b, "operation": f"{a} - {b}"}
        
        elif operation == "multiply":
            if b is None:
                return {"error": "Multiplication requires two operands"}
            return {"result": a * b, "operation": f"{a} × {b}"}
        
        elif operation == "divide":
            if b is None:
                return {"error": "Division requires two operands"}
            if b == 0:
                return {"error": "Division by zero is undefined"}
            return {"result": a / b, "operation": f"{a} ÷ {b}"}
        
        elif operation == "power":
            if b is None:
                return {"error": "Power operation requires two operands"}
            return {"result": a ** b, "operation": f"{a}^{b}"}
        
        elif operation == "sqrt":
            if a < 0:
                return {"error": "Cannot calculate square root of negative number"}
            return {"result": math.sqrt(a), "operation": f"√{a}"}
        
        elif operation == "factorial":
            if not isinstance(a, int) or a < 0:
                return {"error": "Factorial requires a non-negative integer"}
            return {"result": math.factorial(int(a)), "operation": f"{int(a)}!"}
        
        elif operation == "gcd":
            if b is None:
                return {"error": "GCD requires two operands"}
            return {"result": math.gcd(int(a), int(b)), "operation": f"gcd({int(a)}, {int(b)})"}
        
        elif operation == "lcm":
            if b is None:
                return {"error": "LCM requires two operands"}
            gcd_val = math.gcd(int(a), int(b))
            lcm_val = abs(int(a) * int(b)) // gcd_val if gcd_val != 0 else 0
            return {"result": lcm_val, "operation": f"lcm({int(a)}, {int(b)})"}
        
        elif operation == "mean":
            if not isinstance(a, list):
                return {"error": "Mean requires a list of numbers"}
            if not a:
                return {"error": "Cannot calculate mean of empty list"}
            mean_val = sum(a) / len(a)
            return {"result": mean_val, "count": len(a), "sum": sum(a)}
        
        elif operation == "median":
            if not isinstance(a, list):
                return {"error": "Median requires a list of numbers"}
            if not a:
                return {"error": "Cannot calculate median of empty list"}
            sorted_list = sorted(a)
            n = len(sorted_list)
            if n % 2 == 0:
                median_val = (sorted_list[n//2 - 1] + sorted_list[n//2]) / 2
            else:
                median_val = sorted_list[n//2]
            return {"result": median_val, "count": n, "sorted": sorted_list}
        
        elif operation == "mode":
            if not isinstance(a, list):
                return {"error": "Mode requires a list of numbers"}
            if not a:
                return {"error": "Cannot calculate mode of empty list"}
            frequency = {}
            for num in a:
                frequency[num] = frequency.get(num, 0) + 1
            max_freq = max(frequency.values())
            modes = [num for num, freq in frequency.items() if freq == max_freq]
            return {"result": modes[0] if len(modes) == 1 else modes, "frequency": frequency}
        
        elif operation == "variance":
            if not isinstance(a, list):
                return {"error": "Variance requires a list of numbers"}
            if len(a) < 2:
                return {"error": "Variance requires at least 2 numbers"}
            mean_val = sum(a) / len(a)
            variance = sum((x - mean_val) ** 2 for x in a) / (len(a) - 1)
            return {"result": variance, "mean": mean_val, "count": len(a)}
        
        elif operation == "stddev":
            if not isinstance(a, list):
                return {"error": "Standard deviation requires a list of numbers"}
            if len(a) < 2:
                return {"error": "Standard deviation requires at least 2 numbers"}
            mean_val = sum(a) / len(a)
            variance = sum((x - mean_val) ** 2 for x in a) / (len(a) - 1)
            stddev = math.sqrt(variance)
            return {"result": stddev, "variance": variance, "mean": mean_val}
        
        elif operation == "prime_check":
            n = int(a)
            if n < 2:
                return {"result": False, "number": n, "reason": "Less than 2"}
            for i in range(2, int(math.sqrt(n)) + 1):
                if n % i == 0:
                    return {"result": False, "number": n, "factor": i}
            return {"result": True, "number": n}
        
        elif operation == "fibonacci":
            n = int(a)
            if n < 0:
                return {"error": "Fibonacci requires a non-negative integer"}
            if n == 0:
                return {"result": [], "count": 0}
            elif n == 1:
                return {"result": [0], "count": 1}
            fib = [0, 1]
            for i in range(2, n):
                fib.append(fib[-1] + fib[-2])
            return {"result": fib, "count": n, "last": fib[-1]}
        
        else:
            return {
                "error": f"Unknown operation: {operation}",
                "available": [
                    "add", "subtract", "multiply", "divide", "power", "sqrt",
                    "factorial", "gcd", "lcm", "mean", "median", "mode",
                    "variance", "stddev", "prime_check", "fibonacci"
                ]
            }
    
    except Exception as e:
        return {"error": str(e), "operation": operation}