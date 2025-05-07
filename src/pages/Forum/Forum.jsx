// src/pages/Home.jsx
import { useState } from 'react';
import PostForm from '../../components/PostForm/PostForm';
import PostList from '../../components/PostList/PostList';
import './Forum.css';
function Forum({ wallet }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePostCreated = () => {
    // Increment the refresh trigger to cause PostList to refetch
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="home-page">
      <PostForm wallet={wallet} onPostCreated={handlePostCreated} />
      <PostList wallet={wallet} refreshTrigger={refreshTrigger} />
    </div>
  );
}

export default Forum;