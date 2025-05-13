// src/utils/ratingBlockchain.js
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import RatingSystemABI from '../contracts/RatingSystem.json';

// Replace with your deployed contract address
const RATING_CONTRACT_ADDRESS = '0x6958bd05aa9e77fb538a7d68495a9086a7153193';

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

export const getRatingContract = async (signer) => {
  try {
    return new ethers.Contract(RATING_CONTRACT_ADDRESS, RatingSystemABI.abi, signer);
  } catch (error) {
    console.error('Error getting contract:', error);
    throw error;
  }
};

export const createRating = async (signer, stars, comment) => {
  try {
    const contract = await getRatingContract(signer);
    const tx = await contract.createRating(stars, comment);
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error creating rating:', error);
    throw error;
  }
};

export const deleteRating = async (signer, ratingId) => {
  try {
    const contract = await getRatingContract(signer);
    const tx = await contract.deleteRating(ratingId);
    await tx.wait();
    return tx;
  } catch (error) {
    console.error('Error deleting rating:', error);
    throw error;
  }
};

export const getAllRatings = async (provider) => {
  try {
    const contract = new ethers.Contract(RATING_CONTRACT_ADDRESS, RatingSystemABI.abi, provider);
    const ratingIds = await contract.getAllRatings();
    
    const ratings = await Promise.all(
      ratingIds.map(async (id) => {
        const [ratingId, author, stars, comment, timestamp, deleted] = await contract.getRating(id);
        
        return {
          id: ratingId.toNumber(),
          author,
          stars,
          comment,
          timestamp: new Date(timestamp.toNumber() * 1000).toLocaleString(),
          deleted
        };
      })
    );
    
    return ratings.filter(rating => !rating.deleted);
  } catch (error) {
    console.error('Error getting all ratings:', error);
    throw error;
  }
};

export const getAverageRating = async (provider) => {
  try {
    const contract = new ethers.Contract(RATING_CONTRACT_ADDRESS, RatingSystemABI.abi, provider);
    const average = await contract.getAverageRating();
    return average.toNumber() / 10; // Convert back to decimal
  } catch (error) {
    console.error('Error getting average rating:', error);
    throw error;
  }
};

export const isContractOwner = async (signer) => {
  try {
    const contract = await getRatingContract(signer);
    const owner = await contract.owner();
    const address = await signer.getAddress();
    
    return owner.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error checking if contract owner:', error);
    return false;
  }
};