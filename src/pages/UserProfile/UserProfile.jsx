import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';
import { assets } from '../../assets/assets';
import BlockchainService, { VoterStatusEnum, CandidateStatusEnum, RoleEnum } from '../../services/BlockchainService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

const UserProfile = () => {
  const [userInfo, setUserInfo] = useState({
    role: null
  });
  const [voterData, setVoterData] = useState(null);
  const [candidateData, setCandidateData] = useState(null);
  const [voterStatus, setVoterStatus] = useState(null);
  const [candidateStatus, setCandidateStatus] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('voter'); // Default tab
  const [voterStatusMessage, setVoterStatusMessage] = useState(''); // Added for admin notices
  const [candidateStatusMessage, setCandidateStatusMessage] = useState(''); // Added for admin notices
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserProfile = async () => {
      setIsLoading(true);
      try {
        const storedAccount = localStorage.getItem('connectedAccount');
        if (!storedAccount) {
          navigate('/login', { state: { returnPath: '/profile' } });
          return;
        }
        
        setWalletAddress(storedAccount);
        
        // First, check if the user is the admin/contract owner
        const isAdminCheck = await BlockchainService.isAdmin();
        
        // If admin, set role directly
        if (isAdminCheck) {
          setUserInfo({ role: RoleEnum.Admin });
          setActiveTab('admin');
        } else {
          // Otherwise proceed with regular role check
          const userRole = await BlockchainService.getUserRole(storedAccount);
          setUserInfo({ role: userRole });
          
          // Load both voter and candidate data if available
          try {
            if (userRole === RoleEnum.Voter || userRole === RoleEnum.Candidate) {
              const status = await BlockchainService.getVoterStatus(storedAccount);
              setVoterStatus(status);
              
              const voterDetails = await BlockchainService.getVoterDetails(storedAccount);
              setVoterData(voterDetails);
              
              // Get voter status message if it exists
              if (status === VoterStatusEnum.Rejected) {
                const message = await BlockchainService.getVoterStatusMessage(storedAccount);
                setVoterStatusMessage(message);
              }
            }
          } catch (error) {
            if (!error.message.includes("Address is not a voter") && 
                !error.message.includes("Voter does not exist")) {
              console.error("Error loading voter details:", error);
            }
          }
          
          try {
            if (userRole === RoleEnum.Candidate) {
              const status = await BlockchainService.getCandidateStatus(storedAccount);
              setCandidateStatus(status);
              
              const candidateDetails = await BlockchainService.getCandidateDetails(storedAccount);
              setCandidateData(candidateDetails);
              
              // Get candidate status message if it exists
              if (status === CandidateStatusEnum.Rejected) {
                const message = await BlockchainService.getCandidateStatusMessage(storedAccount);
                setCandidateStatusMessage(message);
              }
            }
          } catch (error) {
            if (!error.message.includes("Address is not a candidate") && 
                !error.message.includes("Candidate does not exist")) {
              console.error("Error loading candidate details:", error);
            }
          }
  
          // Set appropriate default active tab
          if (userRole === RoleEnum.Candidate) {
            setActiveTab('candidate');
          } else if (userRole === RoleEnum.Voter) {
            setActiveTab('voter');
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserProfile();
  }, [navigate]);
  
  const getVoterStatusLabel = (status) => {
    switch (status) {
      case VoterStatusEnum.Pending:
        return { text: 'Pending Review', className: 'status-pending' };
      case VoterStatusEnum.Approved:
        return { text: 'Approved', className: 'status-approved' };
      case VoterStatusEnum.Rejected:
        return { text: 'Rejected', className: 'status-rejected' };
      default:
        return { text: 'Unknown', className: 'status-unknown' };
    }
  };

  const getCandidateStatusLabel = (status) => {
    switch (status) {
      case CandidateStatusEnum.Pending:
        return { text: 'Pending Review', className: 'status-pending' };
      case CandidateStatusEnum.Approved:
        return { text: 'Approved', className: 'status-approved' };
      case CandidateStatusEnum.Rejected:
        return { text: 'Rejected', className: 'status-rejected' };
      default:
        return { text: 'Unknown', className: 'status-unknown' };
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case RoleEnum.Voter:
        return 'Registered Voter';
      case RoleEnum.Candidate:
        return 'Presidential Candidate';
      case RoleEnum.Admin:
        return 'System Administrator';
      default:
        return 'No Role Assigned';
    }
  };

  const handleUpdateRegistration = (registrationType) => {
    if (registrationType === 'voter') {
      navigate('/voter-form');
    } else if (registrationType === 'candidate') {
      navigate('/candidate-form');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  // Determine what registrations the user has
  const hasVoterRegistration = voterData !== null;
  const hasCandidateRegistration = candidateData !== null;
  const isAdmin = userInfo.role === RoleEnum.Admin;
  const hasNoRole = userInfo.role !== RoleEnum.Voter && userInfo.role !== RoleEnum.Candidate && userInfo.role !== RoleEnum.Admin;
  
  // Get status for each registration type
  const voterStatusInfo = hasVoterRegistration ? getVoterStatusLabel(voterStatus) : null;
  const candidateStatusInfo = hasCandidateRegistration ? getCandidateStatusLabel(candidateStatus) : null;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="logo-container">
          <img src={assets.logo} alt="CarthageChain Logo " className="logo-image" />
        </div>
        <h1 className="brand-name">Your CarthageChain Profile</h1>
      </div>
      
      <div className="profile-card glass-card">
        <div className="profile-status-section">
          <div className="wallet-info">
            <h3>Blockchain Address</h3>
            <div className="wallet-address-display" onClick={() => navigator.clipboard.writeText(walletAddress)}>
              {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              <span className="copy-tooltip">Click to copy</span>
            </div>
          </div>
          
          {/* Combined role status */}
          <div className="profile-role">
            <h3>Registered As</h3>
            <div className="role-badges">
              {hasVoterRegistration && (
                <div className="role-badge">
                  <span>Voter</span>
                  {voterStatusInfo && (
                    <div className={`status-badge ${voterStatusInfo.className}`}>
                      {voterStatusInfo.text}
                    </div>
                  )}
                </div>
              )}
              {hasCandidateRegistration && (
                <div className="role-badge">
                  <span>Candidate</span>
                  {candidateStatusInfo && (
                    <div className={`status-badge ${candidateStatusInfo.className}`}>
                      {candidateStatusInfo.text}
                    </div>
                  )}
                </div>
              )}
              {isAdmin && (
                <div className="role-badge">
                  <span>Admin</span>
                  <div className="status-badge status-approved">
                    Active
                  </div>
                </div>
              )}
              {hasNoRole && (
                <div className="role-badge">
                  <span>No Role</span>
                  <div className="status-badge status-unknown">
                    Not Registered
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Admin message */}
        {isAdmin && (
          <div className="status-message approved-message">
            <div className="status-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <polyline points="17 11 19 13 23 9"></polyline>
              </svg>
            </div>
            <div className="status-content">
              <h3>Welcome, System Administrator</h3>
              <p>You have full access to the CarthageChain platform. You can review and manage voter and candidate registrations through the admin panel.</p>
              <div className='admin-buttons'>
              <button onClick={() => navigate('/admin')} className="update-button">
                Go to Admin Dashboard
              </button>
              <button onClick={() => navigate('/admin/create-election')} className="update-button">
                Go to Election Management
              </button>
              </div> 
            </div>
          </div>
        )}
        
        {/* No role message */}
        {hasNoRole && (
          <div className="status-message pending-message">
            <div className="status-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div className="status-content">
              <h3>You're not registered yet</h3>
              <p>To participate in the CarthageChain platform, please register as a voter or candidate.</p>
              <div className="registration-buttons">
                <button onClick={() => navigate('/voter-form')} className="register-button">
                  Register as Voter
                </button>
                <button onClick={() => navigate('/candidate-form')} className="register-button">
                  Register as Candidate
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Registration tabs - only show if user has multiple registrations */}
        {hasVoterRegistration && hasCandidateRegistration && (
          <div className="profile-tabs">
            <button 
              className={`tab-button ${activeTab === 'voter' ? 'active' : ''}`}
              onClick={() => setActiveTab('voter')}
            >
              Voter Registration
            </button>
            <button 
              className={`tab-button ${activeTab === 'candidate' ? 'active' : ''}`}
              onClick={() => setActiveTab('candidate')}
            >
              Candidate Registration
            </button>
          </div>
        )}
        
        {/* Voter registration details */}
        {hasVoterRegistration && (activeTab === 'voter' || !hasCandidateRegistration) && (
          <div className="registration-details voter-details">
            <h2 className="section-title">Voter Registration</h2>
            
            <div className="profile-info-section">
              <div className="profile-image-container">
                {voterData.profileImageUrl ? (
                  <img 
                    src={voterData.profileImageUrl} 
                    alt="Voter Profile" 
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-image-placeholder">
                    {voterData.fullName ? voterData.fullName.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
              </div>
              
              <div className="profile-details">
                <h2 className="profile-name">{voterData.fullName}</h2>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Date of Birth</span>
                    <span className="detail-value">{voterData.dob}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Government ID</span>
                    <span className="detail-value">{voterData.govId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Address</span>
                    <span className="detail-value">{voterData.residentialAddress}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{voterData.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{voterData.phone}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="document-section">
              <h3 className="section-subtitle">Uploaded Documents</h3>
              <div className="document-grid">
                <div className="document-item">
                  <div className="document-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <h4>ID Document</h4>
                  {voterData.idDocumentUrl ? (
                    <a href={voterData.idDocumentUrl} target="_blank" rel="noopener noreferrer" className="document-link">
                      View Document
                    </a>
                  ) : (
                    <p className="no-document">No document available</p>
                  )}
                </div>
              </div>
            </div>
            
            {voterStatus === VoterStatusEnum.Rejected && (
              <div className="status-message rejected-message">
                <div className="status-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                </div>
                <div className="status-content">
                  <h3>Your voter registration was rejected</h3>
                  {voterStatusMessage && (
                    <div className="profile-admin-notice">
                      <h4>Admin Notice:</h4>
                      <p>{voterStatusMessage}</p>
                    </div>
                  )}
                  <p>You can update your information and submit again.</p>
                  <button onClick={() => handleUpdateRegistration('voter')} className="update-button">
                    Update Voter Registration
                  </button>
                </div>
              </div>
            )}
            
            {voterStatus === VoterStatusEnum.Pending && (
              <div className="status-message pending-message">
                <div className="status-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div className="status-content">
                  <h3>Your voter registration is under review</h3>
                  <p>We'll notify you once the admin has reviewed your application.</p>
                </div>
              </div>
            )}
            
            {voterStatus === VoterStatusEnum.Approved && (
              <div className="status-message approved-message">
                <div className="status-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div className="status-content">
                  <h3>Your voter registration is approved</h3>
                  <p>Congratulations! You are now officially registered as a voter in the CarthageChain system.</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Candidate registration details */}
        {hasCandidateRegistration && (activeTab === 'candidate' || !hasVoterRegistration) && (
          <div className="registration-details candidate-details">
            <h2 className="section-title">Candidate Registration</h2>
            
            <div className="profile-info-section">
              <div className="profile-image-container">
                {candidateData.profileImageUrl ? (
                  <img 
                    src={candidateData.profileImageUrl} 
                    alt="Candidate Profile" 
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-image-placeholder">
                    {candidateData.fullName ? candidateData.fullName.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
              </div>
              
              <div className="profile-details">
                <h2 className="profile-name">{candidateData.fullName}</h2>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Date of Birth</span>
                    <span className="detail-value">{candidateData.dob}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Government ID</span>
                    <span className="detail-value">{candidateData.govId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Address</span>
                    <span className="detail-value">{candidateData.residentialAddress}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{candidateData.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{candidateData.phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Nationality</span>
                    <span className="detail-value">{candidateData.nationality}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Political Party</span>
                    <span className="detail-value">{candidateData.politicalParty}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Occupation</span>
                    <span className="detail-value">{candidateData.occupation}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="additional-info-section">
              <div className="info-column">
                <div className="info-card">
                  <h3 className="info-title">Education</h3>
                  <p className="info-content">{candidateData.education}</p>
                </div>
                
                <div className="info-card">
                  <h3 className="info-title">Previous Experience</h3>
                  <p className="info-content">{candidateData.previousExperience}</p>
                </div>
              </div>
              
              <div className="info-column">
                <div className="info-card">
                  <h3 className="info-title">Key Proposals</h3>
                  <p className="info-content">{candidateData.keyProposals}</p>
                </div>
                
                <div className="info-card">
                  <h3 className="info-title">Campaign Funding</h3>
                  <p className="info-content">{candidateData.campaignFunding}</p>
                </div>
              </div>
            </div>
            
            <div className="document-section">
              <h3 className="section-subtitle">Uploaded Documents</h3>
              <div className="document-grid">
                <div className="document-item">
                  <div className="document-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <h4>ID Document</h4>
                  {candidateData.idDocumentUrl ? (
                    <a href={candidateData.idDocumentUrl} target="_blank" rel="noopener noreferrer" className="document-link">
                      View Document
                    </a>
                  ) : (
                    <p className="no-document">No document available</p>
                  )}
                </div>
                
                <div className="document-item">
                  <div className="document-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                      <path d="M9 14l2 2 4-4"></path>
                    </svg>
                  </div>
                  <h4>Support Signatures</h4>
                  {candidateData.supportDocumentUrl ? (
                    <a href={candidateData.supportDocumentUrl} target="_blank" rel="noopener noreferrer" className="document-link">
                      View Document
                    </a>
                  ) : (
                    <p className="no-document">No document available</p>
                  )}
                </div>
                
                <div className="document-item">
                  <div className="document-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                  </div>
                  <h4>Financial Disclosure</h4>
                  {candidateData.financialDocumentUrl ? (
                    <a href={candidateData.financialDocumentUrl} target="_blank" rel="noopener noreferrer" className="document-link">
                      View Document
                    </a>
                  ) : (
                    <p className="no-document">No document available</p>
                  )}
                </div>
              </div>
            </div>
            
            {candidateStatus === CandidateStatusEnum.Rejected && (
              <div className="status-message rejected-message">
                <div className="status-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                </div>
                <div className="status-content">
                  <h3>Your candidate registration was rejected</h3>
                  {candidateStatusMessage && (
                    <div className="profile-admin-notice">
                      <h4>Admin Notice:</h4>
                      <p>{candidateStatusMessage}</p>
                    </div>
                  )}
                  <p>You can update your information and submit again.</p>
                  <button onClick={() => handleUpdateRegistration('candidate')} className="update-button">
                    Update Candidate Registration
                  </button>
                </div>
              </div>
            )}
            
            {candidateStatus === CandidateStatusEnum.Pending && (
              <div className="status-message pending-message">
                <div className="status-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div className="status-content">
                  <h3>Your candidate registration is under review</h3>
                  <p>We'll notify you once the admin has reviewed your application.</p>
                </div>
              </div>
            )}
            
            {candidateStatus === CandidateStatusEnum.Approved && (
              <div className="status-message approved-message">
                <div className="status-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  </div>
                <div className="status-content">
                  <h3>Your candidate registration is approved</h3>
                  <p>Congratulations! You are now officially registered as a candidate in the CarthageChain system.</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="profile-actions">
          <button onClick={() => navigate('/')} className="home-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Back to Home
          </button>
          
          {/* Only show update buttons for rejected registrations */}
          {voterData && voterStatus === VoterStatusEnum.Rejected && activeTab === 'voter' && (
            <button onClick={() => handleUpdateRegistration('voter')} className="update-button">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Update Voter Registration
            </button>
          )}
          
          {candidateData && candidateStatus === CandidateStatusEnum.Rejected && activeTab === 'candidate' && (
            <button onClick={() => handleUpdateRegistration('candidate')} className="update-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Update Candidate Registration
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;