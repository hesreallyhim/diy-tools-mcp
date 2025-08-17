"""
Text Analyzer
Analyzes text and provides various statistics and insights
"""
import re
from collections import Counter


def main(text, analysis_type="full"):
    """
    Analyze text and return statistics.
    
    Args:
        text (str): Text to analyze
        analysis_type (str): Type of analysis - 'full', 'basic', 'readability', 'frequency'
    
    Returns:
        dict: Analysis results
    """
    if not text:
        return {"error": "No text provided"}
    
    analyses = {
        "basic": basic_analysis,
        "readability": readability_analysis,
        "frequency": frequency_analysis,
        "full": full_analysis
    }
    
    if analysis_type not in analyses:
        return {
            "error": f"Unknown analysis type: {analysis_type}",
            "available": list(analyses.keys())
        }
    
    return analyses[analysis_type](text)


def basic_analysis(text):
    """Basic text statistics"""
    words = text.split()
    sentences = re.split(r'[.!?]+', text)
    sentences = [s for s in sentences if s.strip()]
    paragraphs = text.split('\n\n')
    
    return {
        "character_count": len(text),
        "character_count_no_spaces": len(text.replace(' ', '').replace('\n', '')),
        "word_count": len(words),
        "sentence_count": len(sentences),
        "paragraph_count": len(paragraphs),
        "average_word_length": sum(len(word) for word in words) / len(words) if words else 0,
        "average_sentence_length": len(words) / len(sentences) if sentences else 0
    }


def readability_analysis(text):
    """Calculate readability scores"""
    words = text.split()
    sentences = re.split(r'[.!?]+', text)
    sentences = [s for s in sentences if s.strip()]
    
    # Count syllables (simplified)
    def count_syllables(word):
        word = word.lower()
        vowels = "aeiou"
        syllable_count = 0
        previous_was_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not previous_was_vowel:
                syllable_count += 1
            previous_was_vowel = is_vowel
        
        # Ensure at least one syllable
        return max(1, syllable_count)
    
    total_syllables = sum(count_syllables(word) for word in words)
    
    # Flesch Reading Ease
    if len(sentences) > 0 and len(words) > 0:
        avg_sentence_length = len(words) / len(sentences)
        avg_syllables_per_word = total_syllables / len(words)
        flesch_score = 206.835 - 1.015 * avg_sentence_length - 84.6 * avg_syllables_per_word
        
        # Interpret score
        if flesch_score >= 90:
            difficulty = "Very Easy"
        elif flesch_score >= 80:
            difficulty = "Easy"
        elif flesch_score >= 70:
            difficulty = "Fairly Easy"
        elif flesch_score >= 60:
            difficulty = "Standard"
        elif flesch_score >= 50:
            difficulty = "Fairly Difficult"
        elif flesch_score >= 30:
            difficulty = "Difficult"
        else:
            difficulty = "Very Difficult"
    else:
        flesch_score = 0
        difficulty = "Cannot calculate"
    
    return {
        "flesch_reading_ease": round(flesch_score, 2),
        "difficulty_level": difficulty,
        "total_syllables": total_syllables,
        "average_syllables_per_word": round(total_syllables / len(words), 2) if words else 0
    }


def frequency_analysis(text):
    """Analyze word and character frequency"""
    # Word frequency
    words = re.findall(r'\b\w+\b', text.lower())
    word_freq = Counter(words)
    
    # Character frequency (excluding spaces and newlines)
    chars = [c.lower() for c in text if c not in ' \n\t']
    char_freq = Counter(chars)
    
    # Most common n-grams
    bigrams = [f"{words[i]} {words[i+1]}" for i in range(len(words)-1)]
    bigram_freq = Counter(bigrams)
    
    return {
        "unique_words": len(word_freq),
        "top_10_words": dict(word_freq.most_common(10)),
        "top_10_characters": dict(char_freq.most_common(10)),
        "top_5_bigrams": dict(bigram_freq.most_common(5)),
        "lexical_diversity": len(word_freq) / len(words) if words else 0
    }


def full_analysis(text):
    """Complete text analysis"""
    return {
        "basic": basic_analysis(text),
        "readability": readability_analysis(text),
        "frequency": frequency_analysis(text),
        "metadata": {
            "has_numbers": bool(re.search(r'\d', text)),
            "has_urls": bool(re.search(r'https?://\S+', text)),
            "has_emails": bool(re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)),
            "language_hint": "english" if any(word in text.lower() for word in ['the', 'and', 'is', 'in', 'to']) else "unknown"
        }
    }