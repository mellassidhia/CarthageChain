from flask import Flask, request, jsonify
import pickle
import pandas as pd
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from textblob import TextBlob
from flask_cors import CORS
from collections import Counter

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Download necessary NLTK resources
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')

# Load the sentiment analyzer from your notebook
try:
    with open('sentiment_analyzer.pkl', 'rb') as f:
        sentiment_analyzer = pickle.load(f)

    # Extract the functions
    clean = sentiment_analyzer['clean']
    getpolarity = sentiment_analyzer['getpolarity']
    getAnalysis = sentiment_analyzer['getAnalysis']
    
    print("Successfully loaded sentiment analyzer from pickle file")
    
except Exception as e:
    print(f"Error loading sentiment analyzer: {e}")
    print("Using built-in functions instead")
    
    # Define the functions directly from your notebook
    def clean(text): 
        # Remove URLs 
        text = re.sub(r'https?://\S+|www\.\S+', '', str(text)) 
        # Convert text to lowercase 
        text = text.lower() 
        # Replace anything other than alphabets a-z with a space 
        text = re.sub('[^a-z]', ' ', text) 
        # Split the text into single words 
        text = text.split() 
        # Initialize WordNetLemmatizer 
        lm = WordNetLemmatizer() 
        # Lemmatize words and remove stopwords 
        text = [lm.lemmatize(word) for word in text if word not in set(
            stopwords.words('english'))] 
        # Join the words back into a sentence 
        text = ' '.join(word for word in text) 
        return text

    def getpolarity(text): 
        return TextBlob(text).sentiment.polarity 

    def getAnalysis(score): 
        if score < 0: 
            return 'negative'
        elif score == 0: 
            return 'neutral'
        else: 
            return 'positive'

# Find candidate names in the text
def extract_candidates(posts):
    # Extract all text content
    all_text = ' '.join([post.get('content', '') for post in posts])
    
    # Look for capitalized words that might be names
    name_patterns = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b', all_text)
    
    # Common words to exclude
    common_words = ['the', 'and', 'this', 'that', 'vote', 'election', 'president', 
                   'political', 'america', 'candidate', 'campaign']
    
    # Filter and count names
    name_counts = Counter()
    for name in name_patterns:
        if name.lower() not in common_words and len(name) > 3:
            name_counts[name] += 1
    
    # Get the top 2 most mentioned names
    top_candidates = name_counts.most_common(2)
    
    if len(top_candidates) >= 2:
        return [name for name, count in top_candidates]
    elif len(top_candidates) == 1:
        return [top_candidates[0][0], "Other Candidates"]
    else:
        # Default names if none found
        return ["Candidate A", "Candidate B"]

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    if not data or 'posts' not in data:
        return jsonify({"error": "No posts data provided"}), 400
    
    posts = data['posts']
    if not posts:
        return jsonify({"error": "Empty posts list"}), 400
    
    # Get candidates either from request or extract from posts
    if 'candidates' in data and data['candidates'] and all(data['candidates']):
        candidates = data['candidates']
    else:
        candidates = extract_candidates(posts)
    
    # Extract text from posts
    texts = [post.get('content', '') for post in posts if not post.get('deleted', False)]
    
    # Process texts with sentiment analyzer
    results = []
    
    # Track mentions of candidates
    candidate_mentions = {candidate: 0 for candidate in candidates}
    
    # Calculate sentiment for each post
    for text in texts:
        # Check for candidate mentions
        text_lower = text.lower()
        for candidate in candidates:
            if candidate.lower() in text_lower:
                candidate_mentions[candidate] += 1
            
        cleaned_text = clean(text)
        polarity = getpolarity(cleaned_text)
        sentiment = getAnalysis(polarity)
        
        results.append({
            'text': text,
            'polarity': polarity,
            'sentiment': sentiment
        })
    
    # Count sentiments
    sentiment_counts = {
        'positive': sum(1 for r in results if r['sentiment'] == 'positive'),
        'neutral': sum(1 for r in results if r['sentiment'] == 'neutral'),
        'negative': sum(1 for r in results if r['sentiment'] == 'negative')
    }
    
    total_posts = len(results)
    
    # Calculate percentages
    sentiment_percentages = {
        'positive': (sentiment_counts['positive'] / total_posts) * 100 if total_posts > 0 else 0,
        'neutral': (sentiment_counts['neutral'] / total_posts) * 100 if total_posts > 0 else 0,
        'negative': (sentiment_counts['negative'] / total_posts) * 100 if total_posts > 0 else 0
    }
    
    # Calculate sentiment scores for each candidate
    candidate_sentiments = {}
    
    for candidate in candidates:
        # Find posts mentioning this candidate
        candidate_posts = [
            result for idx, result in enumerate(results) 
            if candidate.lower() in texts[idx].lower()
        ]
        
        if candidate_posts:
            # Calculate sentiment percentages for this candidate
            pos_count = sum(1 for p in candidate_posts if p['sentiment'] == 'positive')
            neg_count = sum(1 for p in candidate_posts if p['sentiment'] == 'negative')
            neu_count = sum(1 for p in candidate_posts if p['sentiment'] == 'neutral')
            total = len(candidate_posts)
            
            candidate_sentiments[candidate] = {
                'positive': (pos_count / total) * 100 if total > 0 else 0,
                'negative': (neg_count / total) * 100 if total > 0 else 0,
                'neutral': (neu_count / total) * 100 if total > 0 else 0,
                'total_mentions': total
            }
        else:
            candidate_sentiments[candidate] = {
                'positive': 0,
                'negative': 0,
                'neutral': 0,
                'total_mentions': 0
            }
    
    # Determine winner based on sentiment
    winner = None
    confidence = 0.5  # Default confidence
    
    # If candidate sentiment data is available
    if candidate_sentiments:
        scores = {}
        for candidate, sentiment in candidate_sentiments.items():
            if sentiment['total_mentions'] > 0:
                scores[candidate] = sentiment['positive'] - sentiment['negative']
            else:
                scores[candidate] = 0
        
        # Check if we have any valid scores
        if any(scores.values()):
            # Candidate with highest score wins
            winner = max(scores.items(), key=lambda x: x[1])[0]
            
            # Calculate confidence based on score difference
            if len(scores) >= 2:
                sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
                score_diff = abs(sorted_scores[0][1] - sorted_scores[1][1])
                confidence = min(0.5 + (score_diff / 100), 0.95)  # Range: 0.5-0.95
        else:
            # If no scores, use the first candidate
            winner = candidates[0]
    else:
        # Default to first candidate
        winner = candidates[0]
    
    return jsonify({
        'sentiment_counts': sentiment_counts,
        'sentiment_percentages': sentiment_percentages,
        'candidates': candidates,
        'candidate_mentions': candidate_mentions,
        'candidate_sentiments': candidate_sentiments,
        'prediction': {
            'winner': winner,
            'confidence': confidence,
            'explanation': "Based on sentiment analysis of forum posts. Higher positive sentiment and lower negative sentiment correlates with election victory."
        },
        'total_posts_analyzed': total_posts
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)