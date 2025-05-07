import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ElectionPrediction.css';

// You might need to replace this with your actual API endpoint
const API_ENDPOINT = 'http://localhost:5000/api/predict';

const ElectionPrediction = ({ posts }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [candidates, setCandidates] = useState(['', '']);
  const [showCustomCandidates, setShowCustomCandidates] = useState(false);

  // Run prediction with posts and replies
  const runPrediction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Format posts for API
      const postsForAnalysis = posts.map(post => ({
        id: post.id,
        author: post.author,
        content: post.content,
        timestamp: post.timestamp,
        deleted: post.deleted,
        isReply: post.isReply || false
      }));
      
      // Send request to the prediction API
      const response = await axios.post(API_ENDPOINT, {
        posts: postsForAnalysis,
        candidates: showCustomCandidates ? candidates : null
      });
      
      // Update state with the results
      setPrediction(response.data);
      
      // If we didn't use custom candidates, use the ones detected by the API
      if (!showCustomCandidates && response.data.candidates) {
        setCandidates(response.data.candidates);
      }
      
    } catch (err) {
      console.error('Error running prediction:', err);
      setError(`Failed to run prediction: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle custom candidates input
  const toggleCustomCandidates = () => {
    setShowCustomCandidates(!showCustomCandidates);
  };

  // Handle candidate name changes
  const handleCandidateChange = (index, value) => {
    const newCandidates = [...candidates];
    newCandidates[index] = value;
    setCandidates(newCandidates);
  };

  return (
    <div className="election-prediction">
      <h2 className="prediction-title">Election Sentiment Analysis</h2>
      
      <div className="prediction-controls">
        <div className="candidates-selection">
          <div className="candidates-toggle">
            <label>
              <input 
                type="checkbox" 
                checked={showCustomCandidates} 
                onChange={toggleCustomCandidates} 
              />
              Specify candidate names
            </label>
          </div>
          
          {showCustomCandidates && (
            <div className="candidates-inputs">
              <div className="candidate-input">
                <label>Candidate 1:</label>
                <input 
                  type="text" 
                  value={candidates[0]} 
                  onChange={(e) => handleCandidateChange(0, e.target.value)} 
                  placeholder="Enter candidate name"
                />
              </div>
              <div className="candidate-input">
                <label>Candidate 2:</label>
                <input 
                  type="text" 
                  value={candidates[1]} 
                  onChange={(e) => handleCandidateChange(1, e.target.value)}
                  placeholder="Enter candidate name" 
                />
              </div>
            </div>
          )}
        </div>
        
        <button 
          className="analyze-button"
          onClick={runPrediction}
          disabled={loading || (showCustomCandidates && (!candidates[0] || !candidates[1]))}
        >
          {loading ? 'Analyzing...' : 'Analyze Content'}
        </button>
      </div>
      
      {error && <div className="prediction-error">{error}</div>}
      
      {prediction && (
        <div className="prediction-results">
          <h3>Analysis Results</h3>
          
          <div className="analysis-info">
            <p className="info-item">
              <strong>Content Analyzed:</strong> {prediction.total_posts_analyzed} 
              <span className="info-detail">(posts and replies)</span>
            </p>
            <p className="info-item">
              <strong>Overall Sentiment:</strong> 
              <span className={`sentiment-value ${getHighestSentiment(prediction.sentiment_percentages)}`}>
                {formatPercentage(prediction.sentiment_percentages.positive)}% Positive, 
                {formatPercentage(prediction.sentiment_percentages.neutral)}% Neutral, 
                {formatPercentage(prediction.sentiment_percentages.negative)}% Negative
              </span>
            </p>
          </div>
          
          <div className="candidate-results">
            <h4>Candidate Analysis</h4>
            
            {prediction.candidates.map((candidate, index) => {
              const sentiments = prediction.candidate_sentiments[candidate];
              const mentions = prediction.candidate_mentions[candidate];
              const isWinner = prediction.prediction.winner === candidate;
              
              return (
                <div 
                  key={index} 
                  className={`candidate-card ${isWinner ? 'winner' : ''}`}
                >
                  <div className="candidate-header">
                    <h5 className="candidate-name">{candidate}</h5>
                    {isWinner && (
                      <div className="predicted-winner">
                        Predicted Winner 
                        <span className="confidence">
                          ({Math.round(prediction.prediction.confidence * 100)}% confidence)
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="candidate-stats">
                    <p className="mentions">
                      <strong>Mentions:</strong> {mentions}
                    </p>
                    
                    {sentiments && sentiments.total_mentions > 0 ? (
                      <div className="sentiment-bars">
                        <div className="sentiment-bar">
                          <span className="label">Positive</span>
                          <div className="bar-container">
                            <div 
                              className="bar positive" 
                              style={{ width: `${sentiments.positive}%` }}
                            ></div>
                            <span className="value">{formatPercentage(sentiments.positive)}%</span>
                          </div>
                        </div>
                        
                        <div className="sentiment-bar">
                          <span className="label">Neutral</span>
                          <div className="bar-container">
                            <div 
                              className="bar neutral" 
                              style={{ width: `${sentiments.neutral}%` }}
                            ></div>
                            <span className="value">{formatPercentage(sentiments.neutral)}%</span>
                          </div>
                        </div>
                        
                        <div className="sentiment-bar">
                          <span className="label">Negative</span>
                          <div className="bar-container">
                            <div 
                              className="bar negative" 
                              style={{ width: `${sentiments.negative}%` }}
                            ></div>
                            <span className="value">{formatPercentage(sentiments.negative)}%</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="no-data">No sentiment data available</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="prediction-explanation">
            <h4>About this Prediction</h4>
            <p>{prediction.prediction.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const formatPercentage = (value) => {
  return Math.round(value * 10) / 10;
};

const getHighestSentiment = (sentiments) => {
  const highest = Object.entries(sentiments).reduce((max, [key, value]) => {
    return value > max.value ? { key, value } : max;
  }, { key: '', value: -1 });
  
  return highest.key;
};

export default ElectionPrediction;