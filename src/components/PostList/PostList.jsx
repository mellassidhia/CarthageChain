import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllPosts, deletePost, isContractOwner } from '../../utils/blockchain';
import { ethers } from 'ethers'; // Make sure ethers is imported
import './PostList.css';

function PostList({ wallet, refreshTrigger }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Initialize ethers provider and signer when wallet is connected
  useEffect(() => {
    const initializeEthers = async () => {
      if (window.ethereum && wallet?.address) {
        try {
          // Create provider from the browser's ethereum object
          const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(ethProvider);
          
          // Get the signer
          const ethSigner = ethProvider.getSigner();
          setSigner(ethSigner);
        } catch (error) {
          console.error('Error initializing ethers:', error);
          setError('Failed to connect to blockchain. Please check your wallet connection.');
        }
      } else {
        setProvider(null);
        setSigner(null);
      }
    };

    initializeEthers();
  }, [wallet]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!provider) {
          setPosts([]);
          return;
        }
        
        // Use the provider directly rather than wallet.provider
        const fetchedPosts = await getAllPosts(provider);
        setPosts(fetchedPosts);
        
        // Check if current user is the contract owner (if signer is available)
        if (signer) {
          const ownerCheck = await isContractOwner(signer);
          setIsOwner(ownerCheck);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError('Failed to load posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [provider, signer, refreshTrigger]);

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    try {
      if (!signer) {
        throw new Error("Signer not available");
      }
      
      setLoading(true);
      await deletePost(signer, postId);
      
      // Remove the deleted post from the list
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-posts">Loading posts...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!wallet) {
    return <div className="connect-notice">Connect your wallet to view posts</div>;
  }

  if (posts.length === 0) {
    return <div className="no-posts">No posts yet. Be the first to post!</div>;
  }

  return (
    <div className="post-list">
      <h2>Recent Posts</h2>
      {posts.map(post => (
        <div key={post.id} className="post-card">
          <div className="post-header">
            <span className="post-author">
              {post.author.substring(0, 6)}...{post.author.substring(post.author.length - 4)}
            </span>
            <span className="post-timestamp">{post.timestamp}</span>
          </div>
          <div className="post-content">{post.content}</div>
          <div className="post-footer">
            <Link to={`/post/${post.id}`} className="view-btn">
              View Replies ({post.replyIds.length})
            </Link>
            {isOwner && (
              <button 
                className="delete-btn" 
                onClick={() => handleDeletePost(post.id)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PostList;