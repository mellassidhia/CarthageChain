import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';
import { assets } from '../../assets/assets';
import BlockchainService, { VoterStatusEnum, CandidateStatusEnum } from '../../services/BlockchainService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminPanel = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('pendingCandidates');
  const [pendingCandidates, setPendingCandidates] = useState([]);
  const [approvedCandidates, setApprovedCandidates] = useState([]);
  const [rejectedCandidates, setRejectedCandidates] = useState([]);
  const [pendingVoters, setPendingVoters] = useState([]);
  const [approvedVoters, setApprovedVoters] = useState([]);
  const [rejectedVoters, setRejectedVoters] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkForNewRegistrations = async () => {
      // Check every 30 seconds for new registrations
      await loadCandidates();
      await loadVoters();
    };
    
    const intervalId = setInterval(checkForNewRegistrations, 30000);
    
    return () => clearInterval(intervalId); // Clean up on unmount
  }, []);
  
  useEffect(() => {
    const checkAdminAccess = async () => {
      setIsLoading(true);
      try {
        const storedAccount = localStorage.getItem('connectedAccount');
        if (!storedAccount) {
          navigate('/login');
          return;
        }
        
        setWalletAddress(storedAccount);
        
        // Check if the current user is an admin
        const adminStatus = await BlockchainService.isAdmin();
        setIsAdmin(adminStatus);
        
        if (adminStatus) {
          // Store this admin address to help with notifications
          const storedAdmins = localStorage.getItem('adminAddresses');
          let adminAddresses = storedAdmins ? JSON.parse(storedAdmins) : [];
          
          // Add current admin if not already in the list
          if (!adminAddresses.includes(storedAccount)) {
            adminAddresses.push(storedAccount);
            localStorage.setItem('adminAddresses', JSON.stringify(adminAddresses));
          }
        }
        
        // Load pending candidates and voters
        await loadCandidates();
        await loadVoters();
        
      } catch (error) {
        console.error("Error checking admin access:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminAccess();
  }, [navigate]);

  const loadCandidates = async () => {
    try {
      const pendingAddresses = await BlockchainService.getCandidatesByStatus(CandidateStatusEnum.Pending);
      const approvedAddresses = await BlockchainService.getCandidatesByStatus(CandidateStatusEnum.Approved);
      const rejectedAddresses = await BlockchainService.getCandidatesByStatus(CandidateStatusEnum.Rejected);
      
      const pendingPromises = pendingAddresses.map(address => 
        BlockchainService.getCandidateDetails(address).then(details => ({ ...details, address }))
      );
      
      const approvedPromises = approvedAddresses.map(address => 
        BlockchainService.getCandidateDetails(address).then(details => ({ ...details, address }))
      );
      
      const rejectedPromises = rejectedAddresses.map(address => 
        BlockchainService.getCandidateDetails(address).then(details => ({ ...details, address }))
      );
      
      const pendingDetails = await Promise.all(pendingPromises);
      const approvedDetails = await Promise.all(approvedPromises);
      const rejectedDetails = await Promise.all(rejectedPromises);
      
      setPendingCandidates(pendingDetails);
      setApprovedCandidates(approvedDetails);
      setRejectedCandidates(rejectedDetails);
      
    } catch (error) {
      console.error("Error loading candidates:", error);
    }
  };

  const loadVoters = async () => {
    try {
      const pendingAddresses = await BlockchainService.getVotersByStatus(VoterStatusEnum.Pending);
      const approvedAddresses = await BlockchainService.getVotersByStatus(VoterStatusEnum.Approved);
      const rejectedAddresses = await BlockchainService.getVotersByStatus(VoterStatusEnum.Rejected);
      
      const pendingPromises = pendingAddresses.map(address => 
        BlockchainService.getVoterDetails(address).then(details => ({ ...details, address }))
      );
      
      const approvedPromises = approvedAddresses.map(address => 
        BlockchainService.getVoterDetails(address).then(details => ({ ...details, address }))
      );
      
      const rejectedPromises = rejectedAddresses.map(address => 
        BlockchainService.getVoterDetails(address).then(details => ({ ...details, address }))
      );
      
      const pendingDetails = await Promise.all(pendingPromises);
      const approvedDetails = await Promise.all(approvedPromises);
      const rejectedDetails = await Promise.all(rejectedPromises);
      
      setPendingVoters(pendingDetails);
      setApprovedVoters(approvedDetails);
      setRejectedVoters(rejectedDetails);
      
    } catch (error) {
      console.error("Error loading voters:", error);
    }
  };

  const viewUserDetails = async (user, userType) => {
    try {
      let details;
      
      if (userType === 'candidate') {
        details = await BlockchainService.getCandidateDetails(user.address);
      } else {
        details = await BlockchainService.getVoterDetails(user.address);
      }
      
      setSelectedUser({
        ...user,
        userType
      });
      setUserDetails(details);
      
    } catch (error) {
      console.error("Error getting user details:", error);
    }
  };

  const approveUser = async () => {
    if (!selectedUser) return;
    
    setIsProcessing(true);
    try {
      if (selectedUser.userType === 'candidate') {
        await BlockchainService.updateCandidateStatus(
          selectedUser.address, 
          CandidateStatusEnum.Approved,
          "Your application has been approved."
        );
        
        // Add notification for admin
        // BlockchainService.addLocalNotification({
        //   type: 'admin',
        //   title: 'Candidate Approval',
        //   message: `You have approved candidate: ${selectedUser.fullName}`,
        //   details: `Address: ${selectedUser.address.substring(0, 6)}...${selectedUser.address.slice(-4)}`,
        //   timestamp: new Date().toISOString()
        // });
        
        // Show toast notification
        toast.success(`Candidate ${selectedUser.fullName} has been approved successfully!`);
      } else {
        await BlockchainService.updateVoterStatus(
          selectedUser.address, 
          VoterStatusEnum.Approved,
          "Your application has been approved."
        );
        
        // Add notification for admin
        // BlockchainService.addLocalNotification({
        //   type: 'admin',
        //   title: 'Voter Approval',
        //   message: `You have approved voter: ${selectedUser.fullName}`,
        //   details: `Address: ${selectedUser.address.substring(0, 6)}...${selectedUser.address.slice(-4)}`,
        //   timestamp: new Date().toISOString()
        // });
        
        // Show toast notification
        toast.success(`Voter ${selectedUser.fullName} has been approved successfully!`);
      }
      
      // Refresh data
      await loadCandidates();
      await loadVoters();
      
      // Clear selection and details
      setSelectedUser(null);
      setUserDetails(null);
      setRejectReason('');
      
    } catch (error) {
      console.error("Error approving user:", error);
      
      // Add notification for failure
      BlockchainService.addLocalNotification({
        type: 'error',
        title: 'Approval Failed',
        message: `Failed to approve ${selectedUser.userType}: ${selectedUser.fullName}`,
        details: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      
      // Show error toast notification
      toast.error(`Failed to approve ${selectedUser.userType}: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const rejectUser = async () => {
    if (!selectedUser || !rejectReason.trim()) return;
    
    setIsProcessing(true);
    try {
      if (selectedUser.userType === 'candidate') {
        await BlockchainService.updateCandidateStatus(
          selectedUser.address, 
          CandidateStatusEnum.Rejected,
          rejectReason
        );
        
        // Add notification for admin
        // BlockchainService.addLocalNotification({
        //   type: 'admin',
        //   title: 'Candidate Rejection',
        //   message: `You have rejected candidate: ${selectedUser.fullName}`,
        //   details: `Reason: ${rejectReason}`,
        //   timestamp: new Date().toISOString()
        // });
        
        // Show toast notification
        toast.info(`Candidate ${selectedUser.fullName} has been rejected.`);
      } else {
        await BlockchainService.updateVoterStatus(
          selectedUser.address, 
          VoterStatusEnum.Rejected,
          rejectReason
        );
        
        // Add notification for admin
        // BlockchainService.addLocalNotification({
        //   type: 'admin',
        //   title: 'Voter Rejection',
        //   message: `You have rejected voter: ${selectedUser.fullName}`,
        //   details: `Reason: ${rejectReason}`,
        //   timestamp: new Date().toISOString()
        // });
        
        // Show toast notification
        toast.info(`Voter ${selectedUser.fullName} has been rejected.`);
      }
      
      // Refresh data
      await loadCandidates();
      await loadVoters();
      
      // Clear selection and details
      setSelectedUser(null);
      setUserDetails(null);
      setRejectReason('');
      
    } catch (error) {
      console.error("Error rejecting user:", error);
      
      // Add notification for failure
      BlockchainService.addLocalNotification({
        type: 'error',
        title: 'Rejection Failed',
        message: `Failed to reject ${selectedUser.userType}: ${selectedUser.fullName}`,
        details: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      
      // Show error toast notification
      toast.error(`Failed to reject ${selectedUser.userType}: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderUsersList = (users, userType) => {
    if (users.length === 0) {
      return <p className="no-data-message">No {userType}s found.</p>;
    }
    
    return (
      <div className="users-list">
        {users.map((user, index) => {
          // Check if this user was previously rejected and is resubmitting
          const wasRejected = user.previouslyRejected || 
            (user.statusHistory && user.statusHistory.includes(userType === 'candidate' ? 
              CandidateStatusEnum.Rejected : VoterStatusEnum.Rejected));
          
          return (
            <div 
              key={index} 
              className={`user-item ${wasRejected ? 'resubmission' : ''}`} 
              onClick={() => viewUserDetails(user, userType)}
            >
              <div className="user-item-info">
                <h3>{user.fullName}</h3>
                <p className="user-address">{user.address.substring(0, 6)}...{user.address.slice(-4)}</p>
                {wasRejected && (
                  <span className="resubmission-badge">Resubmission</span>
                )}
              </div>
              <div className="user-item-action">
                <span className="view-details-button">View Details</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderUserDetails = () => {
    if (!selectedUser || !userDetails) return null;
    
    return (
      <div className="user-details-panel">
        <div className="user-details-header">
          <h2>{selectedUser.userType === 'candidate' ? 'Candidate' : 'Voter'} Details</h2>
          <button className="close-details-button" onClick={() => {
            setSelectedUser(null);
            setUserDetails(null);
            setRejectReason('');
          }}>×</button>
        </div>
        
        <div className="user-details-content">
          <div className="user-profile-section">
            {userDetails.profileImageUrl && (
              <img 
                src={userDetails.profileImageUrl} 
                alt="Profile" 
                className="user-profile-image"
              />
            )}
            
            <div className="user-basic-info">
              <h3>{userDetails.fullName}</h3>
              <p><strong>Wallet Address:</strong> {selectedUser.address}</p>
              <p><strong>Email:</strong> {userDetails.email}</p>
              <p><strong>Phone:</strong> {userDetails.phone}</p>
            </div>
          </div>
          
          <div className="user-personal-info">
            <h3>Personal Information</h3>
            <p><strong>Date of Birth:</strong> {userDetails.dob}</p>
            <p><strong>Government ID:</strong> {userDetails.govId}</p>
            <p><strong>Address:</strong> {userDetails.residentialAddress}</p>
            
            {selectedUser.userType === 'candidate' && (
              <>
                <p><strong>Nationality:</strong> {userDetails.nationality}</p>
                <p><strong>Party:</strong> {userDetails.politicalParty}</p>
                <p><strong>Occupation:</strong> {userDetails.occupation}</p>
              </>
            )}
          </div>
          
          {selectedUser.userType === 'candidate' && (
            <>
              <div className="candidate-education">
                <h3>Education</h3>
                <p>{userDetails.education}</p>
              </div>
              
              <div className="candidate-experience">
                <h3>Previous Experience</h3>
                <p>{userDetails.previousExperience}</p>
              </div>
              
              <div className="candidate-proposals">
                <h3>Key Proposals</h3>
                <p>{userDetails.keyProposals}</p>
              </div>
              
              <div className="candidate-funding">
                <h3>Campaign Funding</h3>
                <p>{userDetails.campaignFunding}</p>
              </div>
            </>
          )}
          
          <div className="user-documents">
            <h3>Submitted Documents</h3>
            <div className="documents-grid">
              <div className="document-item">
                <h4>ID Document</h4>
                {userDetails.idDocumentUrl && (
                  <a href={userDetails.idDocumentUrl} target="_blank" rel="noopener noreferrer" className="view-document-link">
                    View Document
                  </a>
                )}
              </div>
              
              {selectedUser.userType === 'candidate' && (
                <>
                  <div className="document-item">
                    <h4>Support Signatures</h4>
                    {userDetails.supportDocumentUrl && (
                      <a href={userDetails.supportDocumentUrl} target="_blank" rel="noopener noreferrer" className="view-document-link">
                        View Document
                      </a>
                    )}
                  </div>
                  
                  <div className="document-item">
                    <h4>Financial Disclosure</h4>
                    {userDetails.financialDocumentUrl && (
                      <a href={userDetails.financialDocumentUrl} target="_blank" rel="noopener noreferrer" className="view-document-link">
                        View Document
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="admin-action-section">
            <h3>Admin Actions</h3>
            
            {activeTab.includes('pending') && (
              <>
                <div className="rejection-reason">
                  <label htmlFor="rejectReason">Reason for Rejection (optional for approval):</label>
                  <textarea
                    id="rejectReason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why the application is being rejected..."
                    rows={4}
                  />
                </div>
                
                <div className="admin-buttons">
                  <button 
                    className="approve-button" 
                    onClick={approveUser}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Approve Application'}
                  </button>
                  
                  <button 
                    className="reject-button" 
                    onClick={rejectUser}
                    disabled={isProcessing || !rejectReason.trim()}
                  >
                    {isProcessing ? 'Processing...' : 'Reject Application'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading admin panel..." />;
  }

  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to access the admin panel.</p>
        <button onClick={() => navigate('/')} className="back-button">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="admin-container">
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
      
      <div className="admin-header">
        <img src={assets.logo} alt="CarthageChain Logo" className="admin-logo" />
        <h1>CarthageChain Admin Panel</h1>
        <div className="admin-info">
          <p>Logged in as: <span className="admin-address">
            {walletAddress.substring(0, 6)}...{walletAddress.slice(-4)}
          </span></p>
        </div>
      </div>
      
      <div className={`admin-content ${selectedUser ? 'with-details' : ''}`}>
        <div className="admin-tabs">
          <div className="tab-buttons">
            <button 
              className={`tab-button ${activeTab === 'pendingCandidates' ? 'active' : ''}`}
              onClick={() => setActiveTab('pendingCandidates')}
            >
              Pending Candidates ({pendingCandidates.length})
            </button>
            
            <button 
              className={`tab-button ${activeTab === 'approvedCandidates' ? 'active' : ''}`}
              onClick={() => setActiveTab('approvedCandidates')}
            >
              Approved Candidates ({approvedCandidates.length})
            </button>
            
            <button 
              className={`tab-button ${activeTab === 'rejectedCandidates' ? 'active' : ''}`}
              onClick={() => setActiveTab('rejectedCandidates')}
            >
              Rejected Candidates ({rejectedCandidates.length})
            </button>
            
            <button 
              className={`tab-button ${activeTab === 'pendingVoters' ? 'active' : ''}`}
              onClick={() => setActiveTab('pendingVoters')}
            >
              Pending Voters ({pendingVoters.length})
            </button>
            
            <button 
              className={`tab-button ${activeTab === 'approvedVoters' ? 'active' : ''}`}
              onClick={() => setActiveTab('approvedVoters')}
            >
              Approved Voters ({approvedVoters.length})
            </button>
            
            <button 
              className={`tab-button ${activeTab === 'rejectedVoters' ? 'active' : ''}`}
              onClick={() => setActiveTab('rejectedVoters')}
            >
              Rejected Voters ({rejectedVoters.length})
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'pendingCandidates' && renderUsersList(pendingCandidates, 'candidate')}
            {activeTab === 'approvedCandidates' && renderUsersList(approvedCandidates, 'candidate')}
            {activeTab === 'rejectedCandidates' && renderUsersList(rejectedCandidates, 'candidate')}
            {activeTab === 'pendingVoters' && renderUsersList(pendingVoters, 'voter')}
            {activeTab === 'approvedVoters' && renderUsersList(approvedVoters, 'voter')}
            {activeTab === 'rejectedVoters' && renderUsersList(rejectedVoters, 'voter')}
          </div>
        </div>
        
        {renderUserDetails()}
      </div>
    </div>
  );
};

export default AdminPanel;