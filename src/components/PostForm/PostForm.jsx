import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { createPost } from '../../utils/blockchain';
import './PostForm.css';

function PostForm({ wallet, onPostCreated }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [signer, setSigner] = useState(null);

  // Initialize ethers signer when wallet is connected
  useEffect(() => {
    const initializeSigner = async () => {
      if (window.ethereum && wallet?.address) {
        try {
          // Create provider from window.ethereum
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          // Get the signer
          const ethSigner = provider.getSigner();
          setSigner(ethSigner);
        } catch (error) {
          console.error('Error initializing signer:', error);
          setSigner(null);
        }
      } else {
        setSigner(null);
      }
    };

    initializeSigner();
  }, [wallet]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('Please enter some content');
      return;
    }
    
    if (!wallet || !signer) {
      alert('Please connect your wallet first');
      return;
    }
    
    try {
      setLoading(true);
      await createPost(signer, content);
      setContent('');
      
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-form">
      <h2>Create a New Post</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading || !wallet}
          rows={4}
          className="post-textarea"
        />
        <button 
          type="submit" 
          disabled={loading || !wallet || !signer}
          className={`post-button ${loading ? 'loading' : ''}`}
        >
          {loading ? 'Posting...' : 'Create Post'}
        </button>
      </form>
      {!wallet && (
        <p className="connect-notice">Connect your wallet to post</p>
      )}
    </div>
  );
}

export default PostForm;