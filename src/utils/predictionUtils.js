// src/utils/predictionUtils.js
import { getAllPosts, getPostReplies } from './blockchain';

/**
 * Fetches all posts and replies from the blockchain
 * @param {Object} provider - Ethers.js provider
 * @returns {Promise<Array>} - Combined array of posts and replies
 */
export const fetchAllForumContent = async (provider) => {
  try {
    // Get all posts
    const posts = await getAllPosts(provider);
    
    // Get all replies for each post
    const postsWithReplies = await Promise.all(
      posts.map(async (post) => {
        const replies = await getPostReplies(provider, post.id);
        return {
          ...post,
          replies: replies
        };
      })
    );
    
    // Create a flat array of all content (posts and replies)
    const allContent = [];
    
    // Add posts
    postsWithReplies.forEach(post => {
      if (!post.deleted) {
        allContent.push({
          id: post.id,
          content: post.content,
          author: post.author,
          timestamp: post.timestamp,
          isReply: false,
          deleted: post.deleted
        });
      }
      
      // Add replies
      post.replies.forEach(reply => {
        if (!reply.deleted) {
          allContent.push({
            id: reply.id,
            postId: reply.postId,
            content: reply.content,
            author: reply.author,
            timestamp: reply.timestamp,
            isReply: true,
            deleted: reply.deleted
          });
        }
      });
    });
    
    return allContent;
  } catch (error) {
    console.error('Error fetching forum content:', error);
    throw error;
  }
};

/**
 * Filter content based on keywords related to elections
 * This helps improve prediction accuracy by only analyzing relevant content
 * @param {Array} content - Array of posts and replies
 * @returns {Array} - Filtered array with only election-related content
 */
export const filterElectionContent = (content) => {
  // Keywords related to elections
  const electionKeywords = [
    'election', 'vote', 'ballot', 'candidate', 'campaign',
    'democrat', 'republican', 'trump', 'biden', 'harris',
    'president', 'policy', 'debate', 'political', 'politics',
    'govern', 'america', 'usa', 'united states'
  ];
  
  // Create regex pattern for case-insensitive matching
  const keywordPattern = new RegExp(electionKeywords.join('|'), 'i');
  
  // Filter content that contains election-related keywords
  return content.filter(item => 
    item.content && keywordPattern.test(item.content)
  );
};