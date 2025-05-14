import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './VoterForm.css';
import { assets } from '../../assets/assets';
import BlockchainService, { VoterStatusEnum, CandidateStatusEnum, RoleEnum } from '../../services/BlockchainService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

const VoterForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    govId: '',
    address: '',
    email: '',
    phone: '',
    termsAgreed: false
  });
  const [walletAddress, setWalletAddress] = useState('');
  const [idDocument, setIdDocument] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [voterStatus, setVoterStatus] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isCandidateApproved, setIsCandidateApproved] = useState(false);
  const [isCandidateRegistered, setIsCandidateRegistered] = useState(false);
  const [candidateStatus, setCandidateStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true);
      try {
        const storedAccount = localStorage.getItem('connectedAccount');
        if (!storedAccount) {
          navigate('/login', { state: { returnPath: '/voter-form' } });
          return;
        }
        
        setWalletAddress(storedAccount);
        
        // Check if user is admin
        try {
          await BlockchainService.initialize();
          const adminStatus = await BlockchainService.isAdmin();
          setIsAdmin(adminStatus);
          
          // If admin, redirect to admin panel
          if (adminStatus) {
            navigate('/admin');
            return;
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
        
        // Continue with regular user logic
        // Get user role
        const userRole = await BlockchainService.getUserRole(storedAccount);
        console.log("User role:", userRole);
        setUserRole(userRole);
        
        // Check if user is a voter and get voter status
        if (Number(userRole) === Number(RoleEnum.Voter)) {
          try {
            const voterStatus = await BlockchainService.getVoterStatus(storedAccount);
            setVoterStatus(voterStatus);
            
            // If user has a pending, approved or rejected registration, fetch details
            if (voterStatus !== undefined) {
              try {
                const voterDetails = await BlockchainService.getVoterDetails(storedAccount);
                
                setFormData({
                  fullName: voterDetails.fullName,
                  dob: voterDetails.dob,
                  govId: voterDetails.govId,
                  address: voterDetails.residentialAddress,
                  email: voterDetails.email,
                  phone: voterDetails.phone,
                  termsAgreed: true
                });
                
              } catch (error) {
                console.error("Error fetching voter details:", error);
              }
            }
          } catch (error) {
            if (!error.message.includes("Address is not a voter")) {
              console.error("Error fetching voter status:", error);
            }
          }
        }
        
        // Check if user is a candidate
        if (Number(userRole) === Number(RoleEnum.Candidate)) {
          try {
            const candidateStatus = await BlockchainService.getCandidateStatus(storedAccount);
            setCandidateStatus(candidateStatus);
            setIsCandidateRegistered(true);
            
            // Check if user is an approved candidate
            if (Number(candidateStatus) === Number(CandidateStatusEnum.Approved)) {
              setIsCandidateApproved(true);
              console.log("User is an approved candidate");
            }
            
            // If user is a candidate but not a voter, try to pull their data from candidate profile
            try {
              const candidateDetails = await BlockchainService.getCandidateDetails(storedAccount);
              
              setFormData({
                fullName: candidateDetails.fullName,
                dob: candidateDetails.dob,
                govId: candidateDetails.govId,
                address: candidateDetails.residentialAddress,
                email: candidateDetails.email,
                phone: candidateDetails.phone,
                termsAgreed: false
              });
              
            } catch (error) {
              console.error("Error fetching candidate details for voter form:", error);
            }
          } catch (error) {
            if (!error.message.includes("Address is not a candidate")) {
              console.error("Error fetching candidate status:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkConnection();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!idDocument || !profileImage) {
      setSubmitStatus({
        type: 'error',
        message: 'Please upload both ID document and profile image'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Double-check admin status before submission
      const adminStatus = await BlockchainService.isAdmin();
      if (adminStatus) {
        setSubmitStatus({
          type: 'error',
          message: 'Administrators cannot register as voters. This action has been logged.'
        });
        setIsSubmitting(false);
        return;
      }
      
      // Register on blockchain
      await BlockchainService.registerVoter(formData, profileImage, idDocument);
      
      setSubmitStatus({
        type: 'success',
        message: 'Voter registration submitted to blockchain successfully! Your application is under review.'
      });
      
      // Update local status to reflect the new status (Pending)
      setVoterStatus(VoterStatusEnum.Pending);
      
    } catch (error) {
      console.error("Registration failed:", error);
      
      // Handle specific error for admin attempting to register
      if (error.message && error.message.includes("Admin cannot register")) {
        setSubmitStatus({
          type: 'error',
          message: 'Administrators cannot register as voters. This action has been logged.'
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: 'Registration failed'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusMessage = () => {
    // If user is already an approved voter
    if (voterStatus === VoterStatusEnum.Approved) {
      return (
        <div className="voter-status-message approved">
          <h2>Registration Approved</h2>
          <p>Your voter registration has been approved. You are now eligible to vote in the upcoming election.</p>
          <button onClick={() => navigate('/profile')} className="voter-view-profile-button">
            View Your Profile
          </button>
        </div>
      );
    } 
    // If user is an approved candidate (and can vote without registering as voter)
    else if (isCandidateApproved) {
      return (
        <div className="voter-status-message approved">
          <h2>Eligible to Vote</h2>
          <p>As an approved candidate, you are already eligible to vote in the upcoming election.</p>
          <div className="voter-actions">
            <button onClick={() => navigate('/profile')} className="voter-view-profile-button">
              View Your Profile
            </button>
          </div>
        </div>
      );
    }
    // If user is a registered candidate but not approved yet
    else if (isCandidateRegistered && !isCandidateApproved) {
      let statusMessage = "";
      let statusClass = "";
      
      if (candidateStatus === CandidateStatusEnum.Pending) {
        statusMessage = "Your candidate registration is currently pending.";
        statusClass = "pending";
      } else if (candidateStatus === CandidateStatusEnum.Rejected) {
        statusMessage = "Your candidate registration was rejected.";
        statusClass = "rejected";
      }
      
      return (
        <div className={`voter-status-message ${statusClass}`}>
          <h2>Already Registered as Candidate</h2>
          <p>{statusMessage} You cannot register as both a voter and a candidate in the CarthageChain system.</p>
          <div className="voter-actions">
            <button onClick={() => navigate('/profile')} className="voter-view-profile-button">
              View Your Profile
            </button>
          </div>
        </div>
      );
    }
    // If voter registration was rejected
    else if (voterStatus === VoterStatusEnum.Rejected) {
      return (
        <div className="voter-status-message rejected">
          <h2>Registration Rejected</h2>
          <p>Your voter registration was rejected. You can update your information and resubmit.</p>
          <p>Please fill out the form again with correct information.</p>
        </div>
      );
    } 
    // If voter registration is pending
    else if (voterStatus === VoterStatusEnum.Pending) {
      return (
        <div className="voter-status-message pending">
          <h2>Registration Pending</h2>
          <p>Your voter registration is currently under review. You will be notified when it's approved.</p>
          <button onClick={() => navigate('/profile')} className="voter-view-profile-button">
            View Your Profile
          </button>
        </div>
      );
    }
    
    return null;
  };

  // If the user is an admin, show access denied message and redirect
  if (isAdmin) {
    return (
      <div className="voter-form-container">
        <div className="voter-form-card">
          <div className="voter-form-header">
            <img src={assets.logo} alt="CarthageChain Logo" className="voter-form-logo" />
            <h1>Access Denied</h1>
          </div>
          <div className="admin-access-denied">
            <h2>Admin Cannot Register as Voter</h2>
            <p>As an administrator, you cannot register as a voter to maintain neutrality in the election process.</p>
            <button onClick={() => navigate('/admin')} className="admin-redirect-button">
              Go to Admin Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading voter registration..." />;
  }

  return (
    <div className="voter-form-container">
      <div className="voter-form-card">
        <div className="voter-form-header">
          <img src={assets.logo} alt="CarthageChain Logo" className="voter-form-logo" />
          <h1>Voter Registration</h1>
        </div>

        {renderStatusMessage()}

        {submitStatus ? (
          <div className={`voter-submission-status ${submitStatus.type}`}>
            <p>{submitStatus.message}</p>
            {submitStatus.type === 'success' && (
              <button onClick={() => navigate('/')} className="voter-return-home-button">
                Return to Home Page
              </button>
            )}
            {submitStatus.type === 'error' && (
              <button onClick={() => setSubmitStatus(null)} className="voter-try-again-button">
                Try Again
              </button>
            )}
          </div>
        ) : (
          !isCandidateApproved && !isCandidateRegistered && (
            <>
              <div className="voter-wallet-info">
                <p>Registering as: <span className="voter-wallet-address">
                  {walletAddress.substring(0, 6)}...{walletAddress.slice(-4)}
                </span></p>
              </div>

              <form onSubmit={handleSubmit} className="voter-form">
                <div className="voter-form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="voter-form-group">
                  <label htmlFor="dob">Date of Birth</label>
                  <input 
                    type="date" 
                    id="dob" 
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    required 
                  />
                </div>

                <div className="voter-form-group">
                  <label htmlFor="govId">Government ID</label>
                  <input
                    type="text"
                    id="govId"
                    name="govId"
                    value={formData.govId}
                    onChange={handleChange}
                    placeholder="Passport/ID number"
                    required
                  />
                </div>

                <div className="voter-form-group">
                  <label htmlFor="address">Residential Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Full address"
                    required
                  />
                </div>

                <div className="voter-form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email address"
                    required
                  />
                </div>

                <div className="voter-form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                    required
                  />
                </div>

                <div className="voter-form-group">
                  <label>ID Verification</label>
                  <div className="voter-file-upload-group">
                    <div className="voter-upload-section">
                      <input
                        type="file"
                        id="idDocument"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setIdDocument(e.target.files[0])}
                        hidden
                      />
                      <label htmlFor="idDocument" className="voter-upload-button">
                        <span>Upload ID Document</span>
                        <span className="voter-upload-icon">+</span>
                      </label>
                      {idDocument && <span className="voter-file-name">{idDocument.name}</span>}
                    </div>

                    <div className="voter-upload-section">
                      <input
                        type="file"
                        id="profileImage"
                        accept="image/*"
                        onChange={(e) => setProfileImage(e.target.files[0])}
                        hidden
                      />
                      <label htmlFor="profileImage" className="voter-upload-button">
                        <span>Upload Profile Image</span>
                        <span className="voter-upload-icon">+</span>
                      </label>
                      {profileImage && <span className="voter-file-name">{profileImage.name}</span>}
                    </div>
                  </div>
                </div>

                <div className="voter-terms-group">
                  <input
                    type="checkbox"
                    id="terms"
                    name="termsAgreed"
                    checked={formData.termsAgreed}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="terms" className="voter-terms-label">
                    I agree to the <Link to="/terms-of-use">Terms of Service</Link> and <Link to="/policy">Privacy Policy</Link>
                  </label>
                </div>

                <div className="form-notice">
                  <p>
                    By submitting this form, you agree to have your registration stored on the blockchain and reviewed by the CarthageChain admin.
                    Your blockchain address will be associated with this application.
                  </p>
                </div>

                <button 
                  type="submit" 
                  className="voter-submit-button"
                  disabled={isSubmitting || voterStatus === VoterStatusEnum.Approved}
                >
                  {isSubmitting ? 'Submitting...' : voterStatus === VoterStatusEnum.Rejected ? 'Resubmit Registration' : 'Register as Voter'}
                </button>
              </form>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default VoterForm;