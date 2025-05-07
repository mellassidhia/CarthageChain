import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './CandidateForm.css';
import { assets } from '../../assets/assets';
import BlockchainService, { CandidateStatusEnum, VoterStatusEnum, RoleEnum } from '../../services/BlockchainService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

const CandidateForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    nationality: 'Tunisian',
    govId: '',
    address: '',
    email: '',
    phone: '',
    education: '',
    occupation: '',
    politicalParty: '',
    previousExperience: '',
    keyProposals: '',
    campaignFunding: '',
    supportSignatures: '',
    criminalRecord: false,
    financialDisclosure: false,
    termsAgreed: false
  });
  const [walletAddress, setWalletAddress] = useState('');
  const [idDocument, setIdDocument] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [supportDocument, setSupportDocument] = useState(null);
  const [financialDocument, setFinancialDocument] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [candidateStatus, setCandidateStatus] = useState(null);
  const [isVoterRegistered, setIsVoterRegistered] = useState(false);
  const [voterStatus, setVoterStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true);
      try {
        const storedAccount = localStorage.getItem('connectedAccount');
        if (!storedAccount) {
          navigate('/login', { state: { returnPath: '/candidate-form' } });
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
        
        // Check if user is a voter
        if (Number(userRole) === Number(RoleEnum.Voter)) {
          try {
            const status = await BlockchainService.getVoterStatus(storedAccount);
            setVoterStatus(status);
            setIsVoterRegistered(true);
          } catch (error) {
            if (!error.message.includes("Address is not a voter")) {
              console.error("Error fetching voter status:", error);
            }
          }
        }
        
        // Check if user already registered as candidate
        if (Number(userRole) === Number(RoleEnum.Candidate)) { // Candidate role
          try {
            // Get candidate status
            const status = await BlockchainService.getCandidateStatus(storedAccount);
            setCandidateStatus(status);
            
            // If user has a pending, approved or rejected registration, fetch details
            if (status !== undefined) {
              try {
                const candidateDetails = await BlockchainService.getCandidateDetails(storedAccount);
                
                setFormData({
                  fullName: candidateDetails.fullName,
                  dob: candidateDetails.dob,
                  nationality: candidateDetails.nationality,
                  govId: candidateDetails.govId,
                  address: candidateDetails.residentialAddress,
                  email: candidateDetails.email,
                  phone: candidateDetails.phone,
                  education: candidateDetails.education,
                  occupation: candidateDetails.occupation,
                  politicalParty: candidateDetails.politicalParty,
                  previousExperience: candidateDetails.previousExperience,
                  keyProposals: candidateDetails.keyProposals,
                  campaignFunding: candidateDetails.campaignFunding,
                  supportSignatures: candidateDetails.supportSignatures.toString(),
                  criminalRecord: true,
                  financialDisclosure: true,
                  termsAgreed: true
                });
                
              } catch (error) {
                console.error("Error fetching candidate details:", error);
              }
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
    
    if (!idDocument || !profileImage || !supportDocument || !financialDocument) {
      setSubmitStatus({
        type: 'error',
        message: 'Please upload all required documents'
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
          message: 'Administrators cannot register as candidates. This action has been logged.'
        });
        setIsSubmitting(false);
        return;
      }
      
      // Check if user is already a voter
      const storedAccount = localStorage.getItem('connectedAccount');
      if (storedAccount) {
        try {
          const userRole = await BlockchainService.getUserRole(storedAccount);
          if (Number(userRole) === Number(RoleEnum.Voter)) {
            setSubmitStatus({
              type: 'error',
              message: 'You are already registered as a voter. You cannot register as both a voter and a candidate.'
            });
            setIsSubmitting(false);
            return;
          }
        } catch (error) {
          console.error("Error checking user role:", error);
        }
      }
      
      // Register on blockchain
      await BlockchainService.registerCandidate(
        formData, 
        profileImage, 
        idDocument, 
        supportDocument, 
        financialDocument
      );
      
      setSubmitStatus({
        type: 'success',
        message: 'Presidential candidate registration submitted to blockchain successfully! Your application is under review.'
      });
      
      // Update local status to reflect the new status (Pending)
      setCandidateStatus(CandidateStatusEnum.Pending);
      
    } catch (error) {
      console.error("Registration failed:", error);
      
      // Handle specific error for admin attempting to register
      if (error.message && error.message.includes("Admin cannot register")) {
        setSubmitStatus({
          type: 'error',
          message: 'Administrators cannot register as candidates. This action has been logged.'
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: 'Registration failed: ' + (error.message || 'Unknown error occurred')
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusMessage = () => {
    // If user is already registered as a voter, show message
    if (isVoterRegistered) {
      let statusMessage = "";
      let statusClass = "";
      
      if (voterStatus === VoterStatusEnum.Approved) {
        statusMessage = "Your voter registration has been approved.";
        statusClass = "approved";
      } else if (voterStatus === VoterStatusEnum.Pending) {
        statusMessage = "Your voter registration is currently pending.";
        statusClass = "pending";
      } else if (voterStatus === VoterStatusEnum.Rejected) {
        statusMessage = "Your voter registration was rejected.";
        statusClass = "rejected";
      }
      
      return (
        <div className={`candidate-status-message ${statusClass}`}>
          <h2>Already Registered as Voter</h2>
          <p>{statusMessage} You cannot register as both a voter and a candidate in the CarthageChain system.</p>
          <div className="candidate-actions">
            <button onClick={() => navigate('/profile')} className="candidate-view-profile-button">
              View Your Profile
            </button>
          </div>
        </div>
      );
    }
    
    // Regular candidate status messages
    if (candidateStatus === CandidateStatusEnum.Approved) {
      return (
        <div className="candidate-status-message approved">
          <h2>Registration Approved</h2>
          <p>Your candidate registration has been approved. You are now officially a presidential candidate.</p>
          <button onClick={() => navigate('/profile')} className="candidate-view-profile-button">
            View Your Profile
          </button>
        </div>
      );
    } else if (candidateStatus === CandidateStatusEnum.Rejected) {
      return (
        <div className="candidate-status-message rejected">
          <h2>Registration Rejected</h2>
          <p>Your candidate registration was rejected. You can update your information and resubmit.</p>
          <p>Please review and correct any issues with your application.</p>
        </div>
      );
    } else if (candidateStatus === CandidateStatusEnum.Pending) {
      return (
        <div className="candidate-status-message pending">
          <h2>Registration Pending</h2>
          <p>Your candidate registration is currently under review. You will be notified when it's approved.</p>
          <button onClick={() => navigate('/profile')} className="candidate-view-profile-button">
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
      <div className="candidate-form-container">
        <div className="candidate-form-card">
          <div className="candidate-form-header">
            <img src={assets.logo} alt="CarthageChain Logo" className="candidate-form-logo" />
            <h1>Access Denied</h1>
          </div>
          <div className="admin-access-denied">
            <h2>Admin Cannot Register as Candidate</h2>
            <p>As an administrator, you cannot register as a candidate to maintain neutrality in the election process.</p>
            <button onClick={() => navigate('/admin')} className="admin-redirect-button">
              Go to Admin Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading candidate registration..." />;
  }

  return (
    <div className="candidate-form-container">
      <div className="candidate-form-card">
        <div className="candidate-form-header">
          <img src={assets.logo} alt="CarthageChain Logo" className="candidate-form-logo" />
          <h1>Candidate Registration</h1>
        </div>

        {renderStatusMessage()}

        {submitStatus ? (
          <div className={`candidate-submission-status ${submitStatus.type}`}>
            <p>{submitStatus.message}</p>
            {submitStatus.type === 'success' && (
              <button onClick={() => navigate('/profile')} className="candidate-return-home-button">
                View Your Profile
              </button>
            )}
            {submitStatus.type === 'error' && (
              <button onClick={() => setSubmitStatus(null)} className="candidate-try-again-button">
                Try Again
              </button>
            )}
          </div>
        ) : (
          !isVoterRegistered && (
            <>
              <div className="candidate-wallet-info">
                <p>Registering as: <span className="candidate-wallet-address">
                  {walletAddress.substring(0, 6)}...{walletAddress.slice(-4)}
                </span></p>
              </div>

              <form onSubmit={handleSubmit} className="candidate-form">
                <div className="form-section">
                  <h2>Personal Information</h2>
                  
                  <div className="candidate-form-group">
                    <label htmlFor="fullName">Full Name (as on official documents)</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="candidate-form-group">
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

                  <div className="candidate-form-group">
                    <label htmlFor="nationality">Nationality</label>
                    <input
                      type="text"
                      id="nationality"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                      required
                      readOnly
                    />
                    <small>Must be Tunisian to qualify for presidential candidacy</small>
                  </div>

                  <div className="candidate-form-group">
                    <label htmlFor="govId">National ID Number</label>
                    <input
                      type="text"
                      id="govId"
                      name="govId"
                      value={formData.govId}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="candidate-form-group">
                    <label htmlFor="address">Residential Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="candidate-form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="candidate-form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h2>Qualifications & Experience</h2>
                  
                  <div className="candidate-form-group">
                    <label htmlFor="education">Educational Background</label>
                    <textarea
                      id="education"
                      name="education"
                      value={formData.education}
                      onChange={handleChange}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="candidate-form-group">
                    <label htmlFor="occupation">Current Occupation</label>
                    <input
                      type="text"
                      id="occupation"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="candidate-form-group">
                    <label htmlFor="politicalParty">Political Party Affiliation</label>
                    <input
                      type="text"
                      id="politicalParty"
                      name="politicalParty"
                      value={formData.politicalParty}
                      onChange={handleChange}
                      placeholder="If independent, write 'Independent'"
                      required
                    />
                  </div>

                  <div className="candidate-form-group">
                    <label htmlFor="previousExperience">Previous Political Experience</label>
                    <textarea
                      id="previousExperience"
                      name="previousExperience"
                      value={formData.previousExperience}
                      onChange={handleChange}
                      rows={4}
                      required
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h2>Campaign Information</h2>
                  
                  <div className="candidate-form-group">
                    <label htmlFor="keyProposals">Key Campaign Proposals</label>
                    <textarea
                      id="keyProposals"
                      name="keyProposals"
                      value={formData.keyProposals}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Outline your key proposals and campaign promises"
                      required
                    />
                  </div>

                  <div className="candidate-form-group">
                    <label htmlFor="campaignFunding">Campaign Funding Sources</label>
                    <textarea
                      id="campaignFunding"
                      name="campaignFunding"
                      value={formData.campaignFunding}
                      onChange={handleChange}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="candidate-form-group">
                    <label htmlFor="supportSignatures">Number of Support Signatures Collected</label>
                    <input
                      type="number"
                      id="supportSignatures"
                      name="supportSignatures"
                      value={formData.supportSignatures}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                    <small>Presidential candidates require a minimum of 10,000 signatures from registered voters</small>
                  </div>
                </div>

                <div className="form-section">
                  <h2>Required Documents</h2>
                  
                  <div className="candidate-form-group">
                    <label>ID Verification</label>
                    <div className="candidate-file-upload-group">
                      <div className="candidate-upload-section">
                        <input
                          type="file"
                          id="idDocument"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setIdDocument(e.target.files[0])}
                          hidden
                        />
                        <label htmlFor="idDocument" className="candidate-upload-button">
                          <span>Upload ID Document</span>
                          <span className="candidate-upload-icon">+</span>
                        </label>
                        {idDocument && <span className="candidate-file-name">{idDocument.name}</span>}
                      </div>

                      <div className="candidate-upload-section">
                        <input
                          type="file"
                          id="profileImage"
                          accept="image/*"
                          onChange={(e) => setProfileImage(e.target.files[0])}
                          hidden
                        />
                        <label htmlFor="profileImage" className="candidate-upload-button">
                          <span>Upload Profile Image</span>
                          <span className="candidate-upload-icon">+</span>
                        </label>
                        {profileImage && <span className="candidate-file-name">{profileImage.name}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="candidate-form-group">
                    <label>Support Documentation</label>
                    <div className="candidate-file-upload-group">
                      <div className="candidate-upload-section">
                        <input
                          type="file"
                          id="supportDocument"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setSupportDocument(e.target.files[0])}
                          hidden
                        />
                        <label htmlFor="supportDocument" className="candidate-upload-button">
                          <span>Upload Supporter Signatures</span>
                          <span className="candidate-upload-icon">+</span>
                        </label>
                        {supportDocument && <span className="candidate-file-name">{supportDocument.name}</span>}
                        <small>Certified document with required signatures</small>
                      </div>

                      <div className="candidate-upload-section">
                        <input
                          type="file"
                          id="financialDocument"
                          accept=".pdf"
                          onChange={(e) => setFinancialDocument(e.target.files[0])}
                          hidden
                        />
                        <label htmlFor="financialDocument" className="candidate-upload-button">
                          <span>Upload Financial Disclosure</span>
                          <span className="candidate-upload-icon">+</span>
                        </label>
                        {financialDocument && <span className="candidate-file-name">{financialDocument.name}</span>}
                        <small>Assets and financial interests declaration</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h2>Declarations</h2>
                  
                  <div className="candidate-checkbox-group">
                    <input
                      type="checkbox"
                      id="criminalRecord"
                      name="criminalRecord"
                      checked={formData.criminalRecord}
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="criminalRecord" className="candidate-checkbox-label">
                      I declare that I have no criminal record that would disqualify me from holding public office in Tunisia
                    </label>
                  </div>

                  <div className="candidate-checkbox-group">
                    <input
                      type="checkbox"
                      id="financialDisclosure"
                      name="financialDisclosure"
                      checked={formData.financialDisclosure}
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="financialDisclosure" className="candidate-checkbox-label">
                      I confirm that the financial disclosure provided is complete and accurate
                    </label>
                  </div>

                  <div className="candidate-terms-group">
                    <input
                      type="checkbox"
                      id="terms"
                      name="termsAgreed"
                      checked={formData.termsAgreed}
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="terms" className="candidate-terms-label">
                      I agree to the <Link to="/terms-of-use">Terms of Service</Link>, <Link to="/policy">Privacy Policy</Link>, and Tunisian Electoral Regulations
                    </label>
                  </div>
                </div>

                <div className="form-notice">
                  <p>
                    By submitting this form, you agree to have your candidacy stored on the blockchain and reviewed by the CarthageChain admin.
                    Your blockchain address will be associated with this application for verification purposes.
                  </p>
                  <p>
                    Note: All candidates must meet the requirements established by Tunisian electoral law, including age requirements (minimum 35 years), 
                    citizenship requirements, and support thresholds. False declarations may result in disqualification and legal consequences.
                  </p>
                </div>

                <button 
                  type="submit" 
                  className="candidate-submit-button"
                  disabled={isSubmitting || candidateStatus === CandidateStatusEnum.Approved}
                >
                  {isSubmitting ? 'Submitting...' : candidateStatus === CandidateStatusEnum.Rejected ? 'Resubmit Registration' : 'Register as Presidential Candidate'}
                </button>
              </form>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default CandidateForm;