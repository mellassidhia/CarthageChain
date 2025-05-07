import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { assets } from '../../assets/assets';
import BlockchainService from '../../services/BlockchainService';

const Login = () => {
  const [account, setAccount] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check for existing connection in localStorage on component mount
  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true);
      const storedAccount = localStorage.getItem('connectedAccount');
      
      if (storedAccount) {
        setAccount(storedAccount);
        
        // Check if user is admin
        try {
          await BlockchainService.initialize();
          const adminStatus = await BlockchainService.isAdmin();
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      }
      
      setIsLoading(false);
    };
    
    checkConnection();
    
    // Set up listener for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
    
    // Cleanup function to remove listener when component unmounts
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  // Function to connect with MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsConnecting(true);
        
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Get the first account
        const userAccount = accounts[0];
        setAccount(userAccount);
        
        // Check if the account is an admin
        await BlockchainService.initialize();
        const adminStatus = await BlockchainService.isAdmin();
        setIsAdmin(adminStatus);
        
        // Store in localStorage for persistence
        localStorage.setItem('connectedAccount', userAccount);
        
        setIsConnecting(false);
        
        // Refresh the page after connecting
        window.location.reload();
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
        setIsConnecting(false);
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask to continue.");
    }
  };

  // Handle account changes - completely disconnect and force reconnect
  const handleAccountsChanged = (accounts) => {
    // Always disconnect first
    localStorage.removeItem('connectedAccount');
    setAccount('');
    setIsAdmin(false);
    
    // Refresh the page to reset the state
    window.location.reload();
  };

  // Function to disconnect wallet
  const disconnectWallet = () => {
    setAccount('');
    setIsAdmin(false);
    localStorage.removeItem('connectedAccount');
    
    // Refresh the page after disconnecting
    window.location.reload();
  };

  // Function to format the address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={assets.logo} alt="CarthageChain Logo" className="login-logo" />
          <h1>CarthageChain Login</h1>
        </div>
        
        <div className="login-content">
          {!account ? (
            <>
              <p>Connect with MetaMask to continue</p>
              <button 
                className="metamask-button" 
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect with MetaMask'}
                <img src="https://raw.githubusercontent.com/MetaMask/metamask-extension/master/app/images/logo/metamask-fox.svg" 
                     alt="MetaMask" 
                     className="metamask-icon" />
              </button>
            </>
          ) : (
            <>
              <div className="connected-status">
                <div className="status-indicator"></div>
                <p>Connected with MetaMask</p>
              </div>
              
              <div className="account-info">
                <p>Wallet Address:</p>
                <div className="address-box">
                  {formatAddress(account)}
                </div>
                <p className="full-address">{account}</p>
              </div>
              
              <div className="login-actions">
                {isAdmin ? (
                  // Admin-specific actions
                  <>
                    <p className="admin-notice">You are logged in as an admin</p>
                    <button className="proceed-button admin-button" onClick={() => navigate('/admin')}>
                      Go to Admin Panel
                    </button>
                    <button className="proceed-button admin-button" onClick={() => navigate('/admin/create-election')}>
                      Go to Election Management
                    </button>
                  </>
                ) : (
                  // Regular user actions
                  <>
                    <button className="proceed-button admin-button" onClick={() => navigate('/profile')}>
                      Proceed to My Profile
                    </button>
                    <button className="proceed-button" onClick={() => navigate('/voter-form')}>
                      Proceed to Voter Registration
                    </button>
                    <button className="proceed-button" onClick={() => navigate('/candidate-form')}>
                      Proceed to Candidate Registration
                    </button>
                  </>
                )}
                
                <button className="disconnect-button" onClick={disconnectWallet}>
                  Disconnect Wallet
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;