import { useState } from 'react';
import { createReply } from '../../utils/blockchain';
import './ReplyForm.css'; 

function ReplyForm({ postId, wallet, onReplyCreated }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('Please enter some content');
      return;
    }
    
    if (!wallet) {
      alert('Please connect your wallet first');
      return;
    }
    
    try {
      setLoading(true);
      await createReply(wallet.signer, postId, content);
      setContent('');
      
      if (onReplyCreated) {
        onReplyCreated();
      }
    } catch (error) {
      console.error('Error creating reply:', error);
      alert('Failed to create reply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reply-form">
      <h3>Leave a Reply</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Write your reply..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading || !wallet}
          rows={3}
          className="reply-textarea"
        />
        <button 
          type="submit" 
          disabled={loading || !wallet}
          className={`reply-button ${loading ? 'loading' : ''}`}
        >
          {loading ? 'Posting...' : 'Reply'}
        </button>
      </form>
      {!wallet && (
        <p className="connect-notice">Connect your wallet to reply</p>
      )}
    </div>
  );
}

export default ReplyForm;