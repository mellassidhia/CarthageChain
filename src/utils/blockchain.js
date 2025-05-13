// src/utils/blockchain.js
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import DecentralizedForumABI from '../contracts/DecentralizedForum.json';

// Replace with deployed contract address every time you deploy  the contract
const CONTRACT_ADDRESS = '0x300ee20ed2a0c0933a94852ff578d8a28c5a6e87'; 

export const connectWallet = async () => {
  try {
    const provider = await detectEthereumProvider();
    
    if (!provider) {
      throw new Error('Please install MetaMask!');
    }
    
    await provider.request({ method: 'eth_requestAccounts' });
    
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const signer = ethersProvider.getSigner();
    const address = await signer.getAddress();
    
    return { 
      provider: ethersProvider, 
      signer, 
      address 
    };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

export const getContract = async (signer) => {
  try {
    return new ethers.Contract(CONTRACT_ADDRESS, DecentralizedForumABI.abi, signer);
  } catch (error) {
    console.error('Error getting contract:', error);
    throw error;
  }
};

export const createPost = async (signer, content) => {
  try {
    const contract = await getContract(signer);
    const tx = await contract.createPost(content);
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const createReply = async (signer, postId, content) => {
  try {
    const contract = await getContract(signer);
    const tx = await contract.createReply(postId, content);
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error creating reply:', error);
    throw error;
  }
};

export const deletePost = async (signer, postId) => {
  try {
    const contract = await getContract(signer);
    const tx = await contract.deletePost(postId);
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

export const deleteReply = async (signer, replyId) => {
  try {
    const contract = await getContract(signer);
    const tx = await contract.deleteReply(replyId);
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error deleting reply:', error);
    throw error;
  }
};

export const getAllPosts = async (provider) => {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, DecentralizedForumABI.abi, provider);
    const postIds = await contract.getAllPosts();
    
    const posts = await Promise.all(
      postIds.map(async (id) => {
        const [postId, author, content, timestamp, deleted, replyIds] = await contract.getPost(id);
        
        return {
          id: postId.toNumber(),
          author,
          content,
          timestamp: new Date(timestamp.toNumber() * 1000).toLocaleString(),
          deleted,
          replyIds: replyIds.map(id => id.toNumber())
        };
      })
    );
    
    return posts.filter(post => !post.deleted);
  } catch (error) {
    console.error('Error getting all posts:', error);
    throw error;
  }
};

export const getPostReplies = async (provider, postId) => {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, DecentralizedForumABI.abi, provider);
    const replyIds = await contract.getPostReplies(postId);
    
    const replies = await Promise.all(
      replyIds.map(async (id) => {
        const [replyId, postId, author, content, timestamp, deleted] = await contract.getReply(id);
        
        return {
          id: replyId.toNumber(),
          postId: postId.toNumber(),
          author,
          content,
          timestamp: new Date(timestamp.toNumber() * 1000).toLocaleString(),
          deleted
        };
      })
    );
    
    return replies.filter(reply => !reply.deleted);
  } catch (error) {
    console.error('Error getting post replies:', error);
    throw error;
  }
};

export const isContractOwner = async (signer) => {
  try {
    const contract = await getContract(signer);
    const owner = await contract.owner();
    const address = await signer.getAddress();
    
    return owner.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error checking if contract owner:', error);
    return false;
  }
};