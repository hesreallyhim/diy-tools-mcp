#!/usr/bin/env ruby

# Text Analysis Functions
# Provides comprehensive text analysis and processing capabilities

require 'json'
require 'digest'

def main(operation, text, options = {})
  begin
    case operation
    when 'analyze'
      analyze_text(text, options)
    when 'sentiment'
      analyze_sentiment(text)
    when 'readability'
      calculate_readability(text)
    when 'extract_entities'
      extract_entities(text)
    when 'summarize'
      summarize_text(text, options)
    when 'keywords'
      extract_keywords(text, options)
    when 'language_detect'
      detect_language(text)
    when 'text_similarity'
      calculate_similarity(text, options[:compare_with] || '')
    when 'word_cloud'
      generate_word_cloud_data(text, options)
    when 'ngrams'
      extract_ngrams(text, options)
    when 'text_stats'
      calculate_text_statistics(text)
    when 'clean'
      clean_text(text, options)
    else
      {
        error: "Unknown operation: #{operation}",
        available: %w[
          analyze sentiment readability extract_entities summarize
          keywords language_detect text_similarity word_cloud
          ngrams text_stats clean
        ]
      }
    end
  rescue => e
    { error: e.message, operation: operation }
  end
end

def analyze_text(text, options = {})
  words = text.split(/\s+/)
  sentences = text.split(/[.!?]+/).select { |s| !s.strip.empty? }
  paragraphs = text.split(/\n\n+/).select { |p| !p.strip.empty? }
  
  # Character frequency
  char_freq = text.downcase.chars.each_with_object(Hash.new(0)) do |char, hash|
    hash[char] += 1 if char =~ /[a-z]/
  end
  
  # Word frequency
  word_freq = words.map(&:downcase).each_with_object(Hash.new(0)) do |word, hash|
    cleaned = word.gsub(/[^a-z]/, '')
    hash[cleaned] += 1 unless cleaned.empty?
  end
  
  # Most common words
  top_words = word_freq.sort_by { |_, count| -count }.first(10).to_h
  
  {
    success: true,
    statistics: {
      character_count: text.length,
      character_count_no_spaces: text.gsub(/\s/, '').length,
      word_count: words.length,
      unique_words: word_freq.keys.length,
      sentence_count: sentences.length,
      paragraph_count: paragraphs.length,
      average_word_length: words.map(&:length).sum.to_f / words.length,
      average_sentence_length: sentences.map { |s| s.split(/\s+/).length }.sum.to_f / sentences.length
    },
    top_words: top_words,
    character_distribution: char_freq.sort.to_h,
    lexical_diversity: word_freq.keys.length.to_f / words.length
  }
end

def analyze_sentiment(text)
  # Simple sentiment analysis based on word matching
  positive_words = %w[
    good great excellent amazing wonderful fantastic beautiful
    happy joy love like best awesome brilliant perfect nice
    positive success win victory achieve accomplish benefit
  ]
  
  negative_words = %w[
    bad terrible awful horrible disgusting hate dislike worst
    negative fail failure lose loss problem issue wrong error
    sad unhappy depressed angry mad upset disappointed
  ]
  
  words = text.downcase.split(/\s+/)
  positive_count = words.count { |w| positive_words.include?(w.gsub(/[^a-z]/, '')) }
  negative_count = words.count { |w| negative_words.include?(w.gsub(/[^a-z]/, '')) }
  
  total_sentiment_words = positive_count + negative_count
  
  if total_sentiment_words == 0
    sentiment = 'neutral'
    score = 0.0
  else
    score = (positive_count - negative_count).to_f / total_sentiment_words
    sentiment = if score > 0.2
                  'positive'
                elsif score < -0.2
                  'negative'
                else
                  'neutral'
                end
  end
  
  {
    sentiment: sentiment,
    score: score,
    positive_words: positive_count,
    negative_words: negative_count,
    confidence: total_sentiment_words > 0 ? 
      (total_sentiment_words.to_f / words.length * 100).round(2) : 0,
    analysis: {
      text_length: text.length,
      words_analyzed: words.length,
      sentiment_words_found: total_sentiment_words
    }
  }
end

def calculate_readability(text)
  words = text.split(/\s+/)
  sentences = text.split(/[.!?]+/).select { |s| !s.strip.empty? }
  
  return { error: 'Text too short for analysis' } if sentences.empty? || words.empty?
  
  # Count syllables (approximation)
  total_syllables = words.sum do |word|
    count_syllables(word.downcase.gsub(/[^a-z]/, ''))
  end
  
  # Flesch Reading Ease
  avg_sentence_length = words.length.to_f / sentences.length
  avg_syllables_per_word = total_syllables.to_f / words.length
  
  flesch_score = 206.835 - 1.015 * avg_sentence_length - 84.6 * avg_syllables_per_word
  flesch_score = [[flesch_score, 0].max, 100].min
  
  # Flesch-Kincaid Grade Level
  grade_level = 0.39 * avg_sentence_length + 11.8 * avg_syllables_per_word - 15.59
  
  # Determine reading level
  reading_level = case flesch_score
                  when 90..100 then 'Very Easy (5th grade)'
                  when 80..90 then 'Easy (6th grade)'
                  when 70..80 then 'Fairly Easy (7th grade)'
                  when 60..70 then 'Standard (8th-9th grade)'
                  when 50..60 then 'Fairly Difficult (10-12th grade)'
                  when 30..50 then 'Difficult (College)'
                  when 0..30 then 'Very Difficult (College graduate)'
                  else 'Unknown'
                  end
  
  {
    flesch_reading_ease: flesch_score.round(2),
    flesch_kincaid_grade: grade_level.round(2),
    reading_level: reading_level,
    statistics: {
      sentences: sentences.length,
      words: words.length,
      syllables: total_syllables,
      average_sentence_length: avg_sentence_length.round(2),
      average_syllables_per_word: avg_syllables_per_word.round(2)
    }
  }
end

def extract_entities(text)
  # Simple entity extraction
  entities = {
    emails: text.scan(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/),
    urls: text.scan(/https?:\/\/[^\s]+/),
    phone_numbers: text.scan(/\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/),
    hashtags: text.scan(/#\w+/),
    mentions: text.scan(/@\w+/),
    numbers: text.scan(/\b\d+\.?\d*\b/),
    dates: extract_dates(text),
    capitalized_words: text.scan(/\b[A-Z][a-z]+\b/).uniq
  }
  
  # Potential names (consecutive capitalized words)
  potential_names = text.scan(/(?:[A-Z][a-z]+ ){1,3}[A-Z][a-z]+/)
  
  {
    entities: entities,
    potential_names: potential_names.uniq,
    summary: {
      emails_found: entities[:emails].length,
      urls_found: entities[:urls].length,
      phone_numbers_found: entities[:phone_numbers].length,
      hashtags_found: entities[:hashtags].length,
      mentions_found: entities[:mentions].length,
      dates_found: entities[:dates].length
    }
  }
end

def summarize_text(text, options = {})
  sentences = text.split(/[.!?]+/).select { |s| !s.strip.empty? }
  target_length = options[:sentences] || 3
  
  return { error: 'Text too short to summarize' } if sentences.length <= target_length
  
  # Score sentences based on word frequency
  words = text.downcase.split(/\s+/).map { |w| w.gsub(/[^a-z]/, '') }
  word_freq = words.each_with_object(Hash.new(0)) { |word, hash| hash[word] += 1 }
  
  # Remove common words
  stop_words = %w[the a an and or but in on at to for of with as by from up about into through during]
  word_freq.reject! { |word, _| stop_words.include?(word) || word.length < 3 }
  
  # Score sentences
  sentence_scores = sentences.map do |sentence|
    sentence_words = sentence.downcase.split(/\s+/).map { |w| w.gsub(/[^a-z]/, '') }
    score = sentence_words.sum { |word| word_freq[word] || 0 }
    { sentence: sentence.strip, score: score, length: sentence_words.length }
  end
  
  # Select top sentences while maintaining order
  top_sentences = sentence_scores
    .sort_by { |s| -s[:score] }
    .first(target_length)
    .sort_by { |s| sentences.index(s[:sentence]) }
  
  {
    summary: top_sentences.map { |s| s[:sentence] }.join('. ') + '.',
    original_length: text.length,
    summary_length: top_sentences.sum { |s| s[:sentence].length },
    compression_ratio: (1 - top_sentences.sum { |s| s[:sentence].length }.to_f / text.length) * 100,
    sentences_selected: target_length,
    total_sentences: sentences.length
  }
end

def extract_keywords(text, options = {})
  count = options[:count] || 10
  min_length = options[:min_length] || 3
  
  # Extract words and calculate frequency
  words = text.downcase.split(/\s+/).map { |w| w.gsub(/[^a-z]/, '') }
  word_freq = words.each_with_object(Hash.new(0)) do |word, hash|
    hash[word] += 1 if word.length >= min_length
  end
  
  # Remove stop words
  stop_words = %w[
    the a an and or but in on at to for of with as by from up
    about into through during before after above below between
    same different under over such where when why how all would
    there this that these those then than some very just only
  ]
  word_freq.reject! { |word, _| stop_words.include?(word) }
  
  # Calculate TF-IDF-like scores (simplified)
  max_freq = word_freq.values.max.to_f
  keywords = word_freq.map do |word, freq|
    tf = freq / max_freq
    word_length_bonus = Math.log(word.length)
    score = tf * word_length_bonus
    { word: word, frequency: freq, score: score.round(3) }
  end
  
  # Sort by score and get top keywords
  top_keywords = keywords.sort_by { |k| -k[:score] }.first(count)
  
  # Extract phrases (bigrams and trigrams)
  phrases = extract_phrases(text, options)
  
  {
    keywords: top_keywords,
    phrases: phrases,
    total_unique_words: word_freq.keys.length,
    keyword_density: top_keywords.sum { |k| k[:frequency] }.to_f / words.length * 100
  }
end

def detect_language(text)
  # Simple language detection based on character patterns and common words
  languages = {
    english: {
      common_words: %w[the of and to a in is it you that],
      pattern: /^[a-z\s.,!?'-]+$/i
    },
    spanish: {
      common_words: %w[el la de que y a en es por un],
      pattern: /[áéíóúñ]/i
    },
    french: {
      common_words: %w[le de un et est la les des une dans],
      pattern: /[àâçèéêëîïôùûü]/i
    },
    german: {
      common_words: %w[der die das und ist in den im ein eine],
      pattern: /[äöüß]/i
    }
  }
  
  words = text.downcase.split(/\s+/)
  scores = {}
  
  languages.each do |lang, data|
    score = 0
    score += words.count { |w| data[:common_words].include?(w) } * 10
    score += 5 if text =~ data[:pattern]
    scores[lang] = score
  end
  
  detected = scores.max_by { |_, score| score }
  confidence = detected[1] > 0 ? [detected[1] * 5, 100].min : 0
  
  {
    language: detected[0],
    confidence: confidence,
    scores: scores,
    text_sample: text[0, 100]
  }
end

def calculate_similarity(text1, text2)
  # Jaccard similarity for words
  words1 = text1.downcase.split(/\s+/).map { |w| w.gsub(/[^a-z]/, '') }.uniq
  words2 = text2.downcase.split(/\s+/).map { |w| w.gsub(/[^a-z]/, '') }.uniq
  
  intersection = words1 & words2
  union = words1 | words2
  
  jaccard = union.empty? ? 0 : intersection.length.to_f / union.length
  
  # Character-level similarity (normalized edit distance)
  edit_distance = levenshtein_distance(text1[0, 1000], text2[0, 1000])
  max_length = [text1.length, text2.length].max
  char_similarity = 1 - (edit_distance.to_f / max_length)
  
  # Cosine similarity for word frequency
  freq1 = word_frequency_vector(text1)
  freq2 = word_frequency_vector(text2)
  cosine = cosine_similarity(freq1, freq2)
  
  {
    jaccard_similarity: (jaccard * 100).round(2),
    character_similarity: (char_similarity * 100).round(2),
    cosine_similarity: (cosine * 100).round(2),
    overall_similarity: ((jaccard + char_similarity + cosine) / 3 * 100).round(2),
    common_words: intersection.first(20),
    unique_to_first: (words1 - words2).first(10),
    unique_to_second: (words2 - words1).first(10)
  }
end

def generate_word_cloud_data(text, options = {})
  max_words = options[:max_words] || 50
  min_frequency = options[:min_frequency] || 2
  
  words = text.downcase.split(/\s+/).map { |w| w.gsub(/[^a-z]/, '') }
  word_freq = words.each_with_object(Hash.new(0)) do |word, hash|
    hash[word] += 1 if word.length > 2
  end
  
  # Remove stop words
  stop_words = %w[the of and to a in is it you that he was for on are with as his they at be this from]
  word_freq.reject! { |word, _| stop_words.include?(word) }
  
  # Filter by minimum frequency
  word_freq.select! { |_, freq| freq >= min_frequency }
  
  # Get top words and normalize sizes
  top_words = word_freq.sort_by { |_, freq| -freq }.first(max_words)
  max_freq = top_words.first[1].to_f
  
  cloud_data = top_words.map do |word, freq|
    {
      text: word,
      size: (10 + (freq / max_freq * 40)).round,
      frequency: freq,
      weight: (freq / max_freq * 100).round
    }
  end
  
  {
    word_cloud: cloud_data,
    total_words: word_freq.length,
    max_frequency: max_freq.to_i,
    categories: categorize_words(top_words.map(&:first))
  }
end

def extract_ngrams(text, options = {})
  n = options[:n] || 2
  count = options[:count] || 20
  
  words = text.downcase.split(/\s+/).map { |w| w.gsub(/[^a-z]/, '') }.reject(&:empty?)
  ngrams = []
  
  (0..words.length - n).each do |i|
    ngram = words[i, n].join(' ')
    ngrams << ngram
  end
  
  ngram_freq = ngrams.each_with_object(Hash.new(0)) { |ng, hash| hash[ng] += 1 }
  top_ngrams = ngram_freq.sort_by { |_, freq| -freq }.first(count)
  
  {
    "#{n}_grams" => top_ngrams.map { |ng, freq| { ngram: ng, frequency: freq } },
    total_ngrams: ngram_freq.length,
    most_common: top_ngrams.first,
    type: "#{n}-gram"
  }
end

def calculate_text_statistics(text)
  lines = text.split("\n")
  words = text.split(/\s+/)
  sentences = text.split(/[.!?]+/).select { |s| !s.strip.empty? }
  
  # Punctuation analysis
  punctuation = {
    periods: text.count('.'),
    commas: text.count(','),
    exclamations: text.count('!'),
    questions: text.count('?'),
    quotes: text.count('"') + text.count("'"),
    parentheses: text.count('(') + text.count(')')
  }
  
  # Case analysis
  uppercase_words = words.count { |w| w == w.upcase && w =~ /[A-Z]/ }
  capitalized_words = words.count { |w| w =~ /^[A-Z]/ }
  
  # Whitespace analysis
  spaces = text.count(' ')
  tabs = text.count("\t")
  newlines = text.count("\n")
  
  {
    structure: {
      lines: lines.length,
      non_empty_lines: lines.reject { |l| l.strip.empty? }.length,
      paragraphs: text.split(/\n\n+/).length,
      sentences: sentences.length,
      words: words.length
    },
    punctuation: punctuation,
    case_usage: {
      uppercase_words: uppercase_words,
      capitalized_words: capitalized_words,
      lowercase_ratio: (words.count { |w| w == w.downcase }.to_f / words.length * 100).round(2)
    },
    whitespace: {
      spaces: spaces,
      tabs: tabs,
      newlines: newlines,
      total_whitespace: spaces + tabs + newlines
    },
    complexity: {
      unique_characters: text.chars.uniq.length,
      vocabulary_richness: (words.map(&:downcase).uniq.length.to_f / words.length * 100).round(2),
      average_line_length: lines.map(&:length).sum.to_f / lines.length
    }
  }
end

def clean_text(text, options = {})
  cleaned = text.dup
  
  # Apply cleaning operations based on options
  cleaned = cleaned.strip if options[:trim] != false
  cleaned = cleaned.gsub(/\s+/, ' ') if options[:normalize_whitespace]
  cleaned = cleaned.gsub(/[^\w\s.,!?-]/, '') if options[:remove_special]
  cleaned = cleaned.gsub(/\d/, '') if options[:remove_numbers]
  cleaned = cleaned.gsub(/https?:\/\/[^\s]+/, '') if options[:remove_urls]
  cleaned = cleaned.gsub(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, '') if options[:remove_emails]
  cleaned = cleaned.downcase if options[:lowercase]
  cleaned = cleaned.upcase if options[:uppercase]
  
  # Remove extra punctuation
  if options[:clean_punctuation]
    cleaned = cleaned.gsub(/([.!?])\1+/, '\1')
    cleaned = cleaned.gsub(/\s+([.,!?])/, '\1')
  end
  
  # Remove stop words
  if options[:remove_stop_words]
    stop_words = %w[the of and to a in is it you that he was for on are with as his they at be this from]
    words = cleaned.split(/\s+/)
    cleaned = words.reject { |w| stop_words.include?(w.downcase) }.join(' ')
  end
  
  {
    original: text,
    cleaned: cleaned,
    operations_applied: options.keys,
    changes: {
      length_before: text.length,
      length_after: cleaned.length,
      reduction: text.length - cleaned.length,
      reduction_percentage: ((1 - cleaned.length.to_f / text.length) * 100).round(2)
    }
  }
end

# Helper functions

def count_syllables(word)
  return 1 if word.length <= 3
  
  word = word.downcase
  vowels = 'aeiouy'
  syllables = 0
  previous_was_vowel = false
  
  word.chars.each do |char|
    is_vowel = vowels.include?(char)
    syllables += 1 if is_vowel && !previous_was_vowel
    previous_was_vowel = is_vowel
  end
  
  syllables -= 1 if word.end_with?('e')
  syllables = 1 if syllables == 0
  syllables
end

def extract_dates(text)
  patterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,
    /\b\d{1,2}-\d{1,2}-\d{2,4}\b/,
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{2,4}\b/i,
    /\b\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{2,4}\b/i
  ]
  
  dates = []
  patterns.each { |pattern| dates.concat(text.scan(pattern)) }
  dates.uniq
end

def extract_phrases(text, options = {})
  words = text.downcase.split(/\s+/).map { |w| w.gsub(/[^a-z]/, '') }.reject(&:empty?)
  phrases = []
  
  # Extract bigrams
  (0..words.length - 2).each do |i|
    phrase = words[i, 2].join(' ')
    phrases << phrase if phrase.split.all? { |w| w.length > 2 }
  end
  
  # Extract trigrams
  (0..words.length - 3).each do |i|
    phrase = words[i, 3].join(' ')
    phrases << phrase if phrase.split.all? { |w| w.length > 2 }
  end
  
  phrase_freq = phrases.each_with_object(Hash.new(0)) { |p, hash| hash[p] += 1 }
  phrase_freq.select! { |_, freq| freq > 1 }
  phrase_freq.sort_by { |_, freq| -freq }.first(10).to_h
end

def levenshtein_distance(str1, str2)
  m = str1.length
  n = str2.length
  
  return n if m == 0
  return m if n == 0
  
  d = Array.new(m + 1) { Array.new(n + 1, 0) }
  
  (0..m).each { |i| d[i][0] = i }
  (0..n).each { |j| d[0][j] = j }
  
  (1..m).each do |i|
    (1..n).each do |j|
      cost = str1[i - 1] == str2[j - 1] ? 0 : 1
      d[i][j] = [
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      ].min
    end
  end
  
  d[m][n]
end

def word_frequency_vector(text)
  words = text.downcase.split(/\s+/).map { |w| w.gsub(/[^a-z]/, '') }
  words.each_with_object(Hash.new(0)) { |word, hash| hash[word] += 1 }
end

def cosine_similarity(vec1, vec2)
  common_keys = vec1.keys & vec2.keys
  return 0.0 if common_keys.empty?
  
  dot_product = common_keys.sum { |key| vec1[key] * vec2[key] }
  magnitude1 = Math.sqrt(vec1.values.sum { |v| v**2 })
  magnitude2 = Math.sqrt(vec2.values.sum { |v| v**2 })
  
  return 0.0 if magnitude1 == 0 || magnitude2 == 0
  
  dot_product / (magnitude1 * magnitude2)
end

def categorize_words(words)
  categories = {
    short: words.select { |w| w.length <= 4 },
    medium: words.select { |w| w.length.between?(5, 7) },
    long: words.select { |w| w.length >= 8 }
  }
  
  {
    short_words: categories[:short].length,
    medium_words: categories[:medium].length,
    long_words: categories[:long].length
  }
end

# Execute main function if run directly
if __FILE__ == $0
  if ARGV.length < 2
    puts JSON.pretty_generate({
      error: 'Usage: ruby text_analyzer.rb <operation> <text> [options_json]'
    })
    exit 1
  end
  
  operation = ARGV[0]
  text = ARGV[1]
  options = ARGV[2] ? JSON.parse(ARGV[2], symbolize_names: true) : {}
  
  result = main(operation, text, options)
  puts JSON.pretty_generate(result)
end