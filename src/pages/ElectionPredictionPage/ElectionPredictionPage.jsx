import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { getAllPosts, getPostReplies } from '../../utils/blockchain';
import ElectionPrediction from '../../components/ElectionPrediction/ElectionPrediction';
import './ElectionPredictionPage.css';

const ElectionPredictionPage = () => {
  const [posts, setPosts] = useState([]);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Check if user is logged in
  useEffect(() => {
    const account = localStorage.getItem('connectedAccount');
    if (!account) {
      setError("Please login to access this feature");
    } else {
      loadPostsAndReplies();
    }
  }, []);

  // Redirect to login page
  const redirectToLogin = () => {
    navigate('/login');
  };

  // Load posts and their replies from blockchain
  const loadPostsAndReplies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if ethereum is available
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }
      
      // Create provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Get posts
      const fetchedPosts = await getAllPosts(provider);
      setPosts(fetchedPosts);
      
      // Get replies for each post
      let allReplies = [];
      for (const post of fetchedPosts) {
        const postReplies = await getPostReplies(provider, post.id);
        allReplies = [...allReplies, ...postReplies];
      }
      
      setReplies(allReplies);
      
    } catch (err) {
      console.error('Error loading posts and replies:', err);
      setError("Failed to load data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is logged in
  const isLoggedIn = localStorage.getItem('connectedAccount') !== null;

  // Combine posts and replies for the prediction component
  const allContent = [...posts, ...replies.map(reply => ({
    ...reply,
    isReply: true,
    parentPost: posts.find(post => post.id === reply.postId)
  }))];

  return (
    <div className="election-prediction-page">
      <h1 className="page-title">Election Prediction</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {!isLoggedIn ? (
        <div className="login-required">
          <p className="login-message">Please login to access election predictions</p>
        </div>
      ) : (
        <div className="content-container">
          <div className="actions">
            <button
              onClick={loadPostsAndReplies}
              disabled={loading}
              className="refresh-button"
            >
              {loading ? 'Loading...' : 'Refresh Content'}
            </button>
            
            <div className="content-section">
              <div className="stats-summary">
                <p className="content-count">Found {posts.length} posts and {replies.length} replies</p>
              </div>
              
              <div className="posts-container">
                {posts.length > 0 ? (
                  posts.map((post, index) => {
                    // Find replies for this post
                    const postReplies = replies.filter(reply => reply.postId === post.id);
                    
                    return (
                      <div key={`post-${post.id}`} className="post-item">
                        <div className="post-header">
                          <span className="post-author">{post.author}</span>
                          <span className="post-time">{post.timestamp}</span>
                        </div>
                        <p className="post-content">{post.content}</p>
                        
                        {/* Show replies if any */}
                        {postReplies.length > 0 && (
                          <div className="replies-container">
                            <h4 className="replies-heading">Replies ({postReplies.length})</h4>
                            {postReplies.map((reply, replyIndex) => (
                              <div key={`reply-${reply.id}`} className="reply-item">
                                <div className="reply-header">
                                  <span className="reply-author">{reply.author}</span>
                                  <span className="reply-time">{reply.timestamp}</span>
                                </div>
                                <p className="reply-content">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="no-content">No posts found</p>
                )}
              </div>
            </div>
          </div>
          
          {allContent.length > 0 ? (
            <ElectionPrediction posts={allContent} />
          ) : (
            <div className="loading-message">
              {loading ? 'Loading content...' : 'No content available for analysis'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ElectionPredictionPage;