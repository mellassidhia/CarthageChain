import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { getContract, getPostReplies, deleteReply, isContractOwner } from '../../utils/blockchain';
import ReplyForm from '../../components/ReplyForm/ReplyForm';
import './PostDetail.css';

function PostDetail({ wallet, isOwner: propIsOwner }) {
  const { id: postIdParam } = useParams();
  const postId = parseInt(postIdParam);

  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isOwner, setIsOwner] = useState(propIsOwner);
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
    const fetchPostData = async () => {
      if (!provider) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get contract to fetch post data using provider instead of wallet.provider
        const contract = await getContract(provider);
        const [id, author, content, timestamp, deleted, replyIds] = await contract.getPost(postId);

        if (deleted) {
          setError('This post has been deleted');
          return;
        }

        setPost({
          id: id.toNumber(),
          author,
          content,
          timestamp: new Date(timestamp.toNumber() * 1000).toLocaleString(),
          deleted,
          replyIds: replyIds.map(id => id.toNumber()),
        });

        // Fetch all replies for this post
        const fetchedReplies = await getPostReplies(provider, postId);
        setReplies(fetchedReplies);

        // Check if current user is the contract owner
        if (!propIsOwner && signer) {
          const ownerCheck = await isContractOwner(signer);
          setIsOwner(ownerCheck);
        }
      } catch (error) {
        console.error('Error fetching post details:', error);
        setError('Failed to load post details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [provider, signer, postId, refreshTrigger, propIsOwner]);

  const handleReplyCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteReply = async (replyId) => {
    if (!confirm('Are you sure you want to delete this reply?')) {
      return;
    }

    if (!signer) {
      alert('Wallet connection required to delete replies');
      return;
    }

    try {
      await deleteReply(signer, replyId);

      // Update replies list
      setReplies(replies.filter(reply => reply.id !== replyId));
    } catch (error) {
      console.error('Error deleting reply:', error);
      alert('Failed to delete reply. Please try again.');
    }
  };

  if (!wallet) {
    return <div className="connect-notice">Connect your wallet to view this post</div>;
  }

  if (loading) {
    return <div className="loading-post">Loading post details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="post-detail">
      <Link to="/forum" className="back-btn">← Back to all posts</Link>

      {post && (
        <div className="post-container">
          <div className="post-header">
            <h2>Post #{post.id}</h2>
            <div className="post-meta">
              <span className="post-author">
                By: {post.author.substring(0, 6)}...{post.author.substring(post.author.length - 4)}
              </span>
              <span className="post-timestamp">{post.timestamp}</span>
            </div>
          </div>

          <div className="post-content">{post.content}</div>

          <div className="replies-section">
            <h3>Replies ({replies.length})</h3>

            {replies.length > 0 ? (
              <div className="replies-list">
                {replies.map(reply => (
                  <div key={reply.id} className="reply-card">
                    <div className="reply-header">
                      <span className="reply-author">
                        {reply.author.substring(0, 6)}...{reply.author.substring(reply.author.length - 4)}
                      </span>
                      <span className="reply-timestamp">{reply.timestamp}</span>
                    </div>
                    <div className="reply-content">{reply.content}</div>
                    {isOwner && (
                      <button
                        className="delete-reply-btn"
                        onClick={() => handleDeleteReply(reply.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-replies">No replies yet. Be the first to reply!</div>
            )}

            <ReplyForm
              postId={postId}
              wallet={{ provider, signer, address: wallet.address }}
              onReplyCreated={handleReplyCreated}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PostDetail;