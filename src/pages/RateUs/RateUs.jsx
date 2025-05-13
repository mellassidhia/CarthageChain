import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { createRating, deleteRating, getAllRatings, getAverageRating, isContractOwner } from '../../utils/ratingBlockchain';
import './RateUs.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function RateUs() {
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Initialize ethers provider and signer when connected
  useEffect(() => {
    const initializeEthers = async () => {
      const storedAccount = localStorage.getItem('connectedAccount');
      
      if (window.ethereum && storedAccount) {
        try {
          const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(ethProvider);
          
          const ethSigner = ethProvider.getSigner();
          setSigner(ethSigner);
          
          setAccount(storedAccount);
        } catch (error) {
          console.error('Error initializing ethers:', error);
          setError('Failed to connect to blockchain. Please check your wallet connection.');
          toast.error('Failed to connect to blockchain. Please check your wallet connection.');
        }
      }
    };

    initializeEthers();
  }, []);

  // Fetch ratings and check owner status
  useEffect(() => {
    const fetchData = async () => {
      if (!provider) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all ratings
        const fetchedRatings = await getAllRatings(provider);
        setRatings(fetchedRatings.sort((a, b) => b.id - a.id)); // Sort by newest first
        
        // Fetch average rating
        const avg = await getAverageRating(provider);
        setAverageRating(avg);
        
        // Check if user is contract owner
        if (signer) {
          const ownerCheck = await isContractOwner(signer);
          setIsOwner(ownerCheck);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load ratings. Please try again later.');
        toast.error('Failed to load ratings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [provider, signer]);

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    
    if (!signer) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!selectedRating) {
      toast.warning('Please select a rating');
      return;
    }
    
    if (!comment.trim()) {
      toast.warning('Please enter a comment');
      return;
    }
    
    try {
      setSubmitting(true);
      await createRating(signer, selectedRating, comment);
      
      // Reset form
      setSelectedRating(0);
      setComment('');
      
      // Refresh ratings
      const fetchedRatings = await getAllRatings(provider);
      setRatings(fetchedRatings.sort((a, b) => b.id - a.id));
      
      const avg = await getAverageRating(provider);
      setAverageRating(avg);
      
      toast.success('Rating posted successfully!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRating = async (ratingId) => {
    if (!confirm('Are you sure you want to delete this rating?')) {
      return;
    }
    
    try {
      await deleteRating(signer, ratingId);
      
      // Refresh ratings
      const fetchedRatings = await getAllRatings(provider);
      setRatings(fetchedRatings.sort((a, b) => b.id - a.id));
      
      const avg = await getAverageRating(provider);
      setAverageRating(avg);
      
      toast.success('Rating deleted successfully!');
    } catch (error) {
      console.error('Error deleting rating:', error);
      toast.error('Failed to delete rating. Please try again.');
    }
  };

  // Display wallet connection message if not connected
  if (!account) {
    return (
      <div className="rateus-container">
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <h1>Rate Our Service</h1>
        
        <div className="rateus-wallet-message">
          <div className="rateus-wallet-icon">🦊</div>
          <h2>Connect Your Wallet</h2>
          <p>Please connect your wallet to view and submit ratings.</p>
          <p className="rateus-wallet-subtext">This service uses blockchain technology to ensure transparent and tamper-proof ratings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <div className="rateus-loading">Loading ratings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <div className="rateus-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="rateus-container">
      {/* Add ToastContainer to render notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <h1>Rate Our Service</h1>
      
      <div className="rateus-average-rating">
        <h2>Average Rating: {averageRating.toFixed(1)} / 5.0</h2>
        <div className="rateus-star-display">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`rateus-star ${averageRating >= star ? 'rateus-filled' : ''}`}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {account && !isOwner && (
        <div className="rateus-rating-form">
          <h2>Leave Your Rating</h2>
          <form onSubmit={handleSubmitRating}>
            <div className="rateus-star-selection">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`rateus-star ${star <= (hoverRating || selectedRating) ? 'rateus-filled' : ''}`}
                  onClick={() => setSelectedRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </span>
              ))}
            </div>
            
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your comment here..."
              required
              disabled={submitting}
              className="rateus-textarea"
            />
            
            <button type="submit" disabled={submitting || !selectedRating} className="rateus-submit-btn">
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </form>
        </div>
      )}

      {account && isOwner && (
        <div className="rateus-admin-notice">
          <h2>Admin Notice</h2>
          <p>As the administrator, you can manage ratings but cannot submit your own ratings. You can delete inappropriate or spam ratings below.</p>
        </div>
      )}

      <div className="rateus-ratings-list">
        <h2>All Ratings ({ratings.length})</h2>
        {ratings.length === 0 ? (
          <p>No ratings yet. Be the first to rate!</p>
        ) : (
          ratings.map((rating) => (
            <div key={rating.id} className="rateus-rating-card">
              <div className="rateus-rating-header">
                <div className="rateus-author">
                  {rating.author.substring(0, 6)}...{rating.author.substring(rating.author.length - 4)}
                </div>
                <div className="rateus-timestamp">{rating.timestamp}</div>
              </div>
              
              <div className="rateus-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`rateus-star ${star <= rating.stars ? 'rateus-filled' : ''}`}>
                    ★
                  </span>
                ))}
              </div>
              
              <div className="rateus-comment">{rating.comment}</div>
              
              {isOwner && (
                <button
                  className="rateus-delete-btn"
                  onClick={() => handleDeleteRating(rating.id)}
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RateUs;