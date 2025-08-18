"""
Math utilities module with multiple entry points.
This file can be used by multiple tools with different entry points.
"""

def calculate_tax(income, tax_rate):
    """Calculate tax amount based on income and rate."""
    return {
        "tax_amount": income * tax_rate,
        "net_income": income * (1 - tax_rate)
    }

def compound_interest(principal, rate, time, n=12):
    """Calculate compound interest."""
    amount = principal * (1 + rate/n) ** (n * time)
    interest = amount - principal
    return {
        "principal": principal,
        "interest": round(interest, 2),
        "total_amount": round(amount, 2)
    }

def loan_payment(principal, rate, months):
    """Calculate monthly loan payment."""
    monthly_rate = rate / 12
    if monthly_rate == 0:
        payment = principal / months
    else:
        payment = principal * (monthly_rate * (1 + monthly_rate) ** months) / ((1 + monthly_rate) ** months - 1)
    
    return {
        "monthly_payment": round(payment, 2),
        "total_payment": round(payment * months, 2),
        "total_interest": round(payment * months - principal, 2)
    }

def retirement_savings(current_age, retirement_age, monthly_contribution, annual_return=0.07):
    """Calculate retirement savings projection."""
    months = (retirement_age - current_age) * 12
    monthly_return = annual_return / 12
    
    if monthly_return == 0:
        total = monthly_contribution * months
    else:
        total = monthly_contribution * ((1 + monthly_return) ** months - 1) / monthly_return
    
    return {
        "years_to_retirement": retirement_age - current_age,
        "total_contributions": monthly_contribution * months,
        "projected_total": round(total, 2),
        "projected_growth": round(total - (monthly_contribution * months), 2)
    }