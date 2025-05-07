import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OngoingElections.css';
import { assets } from '../../assets/assets';
import BlockchainService, { VoterStatusEnum, CandidateStatusEnum, RoleEnum, ElectionStateEnum } from '../../services/BlockchainService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

const OngoingElections = () => {
  const [canVote, setCanVote] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [ongoingElections, setOngoingElections] = useState([]);
  const [userVotingStatus, setUserVotingStatus] = useState({});
  const [selectedElection, setSelectedElection] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [voteMessage, setVoteMessage] = useState('');
  const [voterCheckError, setVoterCheckError] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const navigate = useNavigate();

  // Initialize blockchain service on component mount
  useEffect(() => {
    const initBlockchain = async () => {
      try {
        await BlockchainService.initialize();
      } catch (error) {
        setVoterCheckError("Failed to connect to blockchain. Please make sure your wallet is connected.");
        setIsLoading(false);
      }
    };
    
    initBlockchain();
  }, []);

  useEffect(() => {
    const checkVotingAccess = async () => {
      setIsLoading(true);
      try {
        // First ensure blockchain service is initialized
        if (!BlockchainService.initialized) {
          await BlockchainService.initialize();
        }
        
        // Check for wallet connection
        const storedAccount = localStorage.getItem('connectedAccount');
        if (!storedAccount) {
          navigate('/login');
          return;
        }
        
        setWalletAddress(storedAccount);
        
        // Get connected account from blockchain to verify connection
        const actualAccount = await BlockchainService.signer.getAddress();
        
        // Verify the stored account matches the connected blockchain account
        if (storedAccount.toLowerCase() !== actualAccount.toLowerCase()) {
          localStorage.setItem('connectedAccount', actualAccount);
          setWalletAddress(actualAccount);
        }
        
        // Get comprehensive user info including voter and candidate details
        const comprehensiveInfo = await BlockchainService.getComprehensiveUserInfo(actualAccount);
        setUserInfo(comprehensiveInfo);
        
        // Set voting ability based on comprehensive info
        setCanVote(comprehensiveInfo.canVote);
        
        // If user can vote, load ongoing elections
        if (comprehensiveInfo.canVote) {
          await loadOngoingElections(actualAccount);
        } else {
          // Set detailed error message based on user info
          if (comprehensiveInfo.isVoter && comprehensiveInfo.voterStatus === VoterStatusEnum.Pending) {
            setVoterCheckError("Your voter registration is pending approval. You cannot vote until approved.");
          } else if (comprehensiveInfo.isCandidate && comprehensiveInfo.candidateStatus === CandidateStatusEnum.Pending) {
            setVoterCheckError("Your candidate registration is pending approval. You cannot vote until approved.");
          } else if (comprehensiveInfo.isVoter && comprehensiveInfo.voterStatus === VoterStatusEnum.Rejected) {
            setVoterCheckError("Your voter registration has been rejected. You cannot vote.");
          } else if (comprehensiveInfo.isCandidate && comprehensiveInfo.candidateStatus === CandidateStatusEnum.Rejected) {
            setVoterCheckError("Your candidate registration has been rejected. You cannot vote.");
          } else {
            setVoterCheckError("You need to be either an approved voter or an approved candidate to vote in elections.");
          }
        }
      } catch (error) {
        setVoterCheckError(`Error connecting to blockchain: ${error.message}. Please check your connection and try again.`);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkVotingAccess();
  }, [navigate]);

  // Search functionality
  useEffect(() => {
    // Filter elections based on search term
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    const filtered = ongoingElections.filter(election =>
      election.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      election.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setSearchResults(filtered);
    setShowSearchResults(true);
  }, [searchTerm, ongoingElections]);

  // Handle click outside search results to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadOngoingElections = async (userAddress) => {
    try {
      const elections = await BlockchainService.getOngoingElections();
      
      if (elections && Array.isArray(elections)) {
        setOngoingElections(elections);
        
        // Check voting status for each election
        if (elections.length > 0) {
          const statusPromises = elections.map(async (election) => {
            try {
              const hasVoted = await BlockchainService.hasVotedInElection(election.id, userAddress);
              return { electionId: election.id, hasVoted };
            } catch (error) {
              return { electionId: election.id, hasVoted: false }; // Default to not voted on error
            }
          });
          
          const statuses = await Promise.all(statusPromises);
          
          // Convert to an object for easy lookup
          const statusMap = {};
          statuses.forEach(status => {
            statusMap[status.electionId] = status.hasVoted;
          });
          
          setUserVotingStatus(statusMap);
        }
      } else {
        setOngoingElections([]);
      }
    } catch (error) {
      setOngoingElections([]);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await BlockchainService.initialize();
      const account = await BlockchainService.signer.getAddress();
      setWalletAddress(account);
      
      // Get comprehensive user info
      const comprehensiveInfo = await BlockchainService.getComprehensiveUserInfo(account);
      setUserInfo(comprehensiveInfo);
      
      // Set voting ability based on comprehensive info
      setCanVote(comprehensiveInfo.canVote);
      
      // If user can vote, load ongoing elections
      if (comprehensiveInfo.canVote) {
        await loadOngoingElections(account);
      }
    } catch (error) {
      // Error handling without logging
    } finally {
      setIsLoading(false);
    }
  };

  const selectElection = (election) => {
    setSelectedElection(election);
    setSelectedCandidate(null);
    setVoteMessage('');
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const selectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleVote = async () => {
    if (!selectedElection || !selectedCandidate) {
      setVoteMessage('Please select a candidate before voting.');
      return;
    }
    
    setIsVoting(true);
    setVoteMessage('');
    
    try {
      // Find the index of the selected candidate in the election candidates array
      const candidateIndex = selectedElection.candidates.findIndex(c => c.address === selectedCandidate.address);
      
      if (candidateIndex === -1) {
        throw new Error('Selected candidate not found in election.');
      }
      
      await BlockchainService.castVote(selectedElection.id, candidateIndex);
      
      // Update user voting status
      setUserVotingStatus({
        ...userVotingStatus,
        [selectedElection.id]: true
      });
      
      setVoteMessage('Your vote has been cast successfully!');
      setSelectedCandidate(null);
      
    } catch (error) {
      if (error.code === 'ACTION_REJECTED') {
        setVoteMessage('You cancelled the voting transaction in your wallet.');
      } else if (error.message.includes("user rejected transaction")) {
        setVoteMessage('You cancelled the voting transaction in your wallet.');
      } else if (error.message.includes("already voted")) {
        setVoteMessage('You have already voted in this election.');
        // Update the voting status
        setUserVotingStatus({
          ...userVotingStatus,
          [selectedElection.id]: true
        });
      } else {
        setVoteMessage(`Error casting vote: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsVoting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // This handler has been replaced with direct navigation in the button onClick

  if (isLoading) {
    return <LoadingSpinner message="Loading ongoing elections..." />;
  }

  if (!canVote) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to vote in elections.</p>
        {voterCheckError && <p className="error-message">{voterCheckError}</p>}
        
        <div className="user-status-info">
          <h3>Your Current Status:</h3>
          <p><strong>Account:</strong> {walletAddress.substring(0, 6)}...{walletAddress.slice(-4)}</p>
          
          {userInfo && userInfo.isVoter && (
            <div className="voter-status">
              <p><strong>Voter Status:</strong> {
                userInfo.voterStatus === VoterStatusEnum.Pending ? "Pending" :
                userInfo.voterStatus === VoterStatusEnum.Approved ? "Approved" :
                userInfo.voterStatus === VoterStatusEnum.Rejected ? "Rejected" :
                `Unknown (${userInfo.voterStatus})`
              }</p>
            </div>
          )}
          
          {userInfo && userInfo.isCandidate && (
            <div className="candidate-status">
              <p><strong>Candidate Status:</strong> {
                userInfo.candidateStatus === CandidateStatusEnum.Pending ? "Pending" :
                userInfo.candidateStatus === CandidateStatusEnum.Approved ? "Approved" :
                userInfo.candidateStatus === CandidateStatusEnum.Rejected ? "Rejected" :
                `Unknown (${userInfo.candidateStatus})`
              }</p>
            </div>
          )}
          
          {(!userInfo || (!userInfo.isVoter && !userInfo.isCandidate)) && (
            <p><strong>Status:</strong> Not registered as voter or candidate</p>
          )}
        </div>
        
        <div className="action-buttons">
          <button onClick={() => navigate('/')} className="back-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ongoing-elections-container">
      <div className="elections-header">
        <img src={assets.logo} alt="CarthageChain Logo" className="elections-logo" />
        <h1>Ongoing Elections</h1>
        {/* Election Prediction Button */}
        <button
          onClick={() => navigate('/election-prediction')}
          className="election-prediction-button"
          title="View AI-powered election predictions"
        >
          <span className="prediction-icon">🔮</span>Predictions
        </button>
        <div className="voter-info">
          <p>Logged in as: <span className="voter-address">
            {walletAddress.substring(0, 6)}...{walletAddress.slice(-4)}
          </span></p>
        </div>

      </div>
      
      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search elections..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
        {showSearchResults && searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((election, index) => (
              <div 
                key={index} 
                className="search-result-item"
                onClick={() => selectElection(election)}
              >
                <h4>{election.name}</h4>
                <p>{election.description.substring(0, 50)}...</p>
                <div className="search-result-status">
                  {userVotingStatus[election.id] ? (
                    <span className="voted-badge-small">Voted</span>
                  ) : (
                    <span className="not-voted-badge-small">Not voted</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {showSearchResults && searchResults.length === 0 && searchTerm !== '' && (
          <div className="search-results">
            <div className="no-results">No elections found</div>
          </div>
        )}
      </div>
      
      {ongoingElections.length === 0 ? (
        <div className="no-elections-message">
          <h2>No Ongoing Elections</h2>
          <p>There are currently no ongoing elections. Please check back later.</p>
          <div className="action-buttons">
            <button onClick={() => navigate('/')} className="back-button">
              Back to Home
            </button>
            <button onClick={refreshData} className="refresh-ongoing-button">
              Refresh
            </button>
          </div>
        </div>
      ) : (
        <div className="elections-content">
          <div className="elections-list">
            <h2>Available Elections</h2>
            {ongoingElections.map((election, index) => (
              <div 
                key={index} 
                className={`election-card ${selectedElection && selectedElection.id === election.id ? 'selected' : ''}`}
                onClick={() => selectElection(election)}
              >
                <h3>{election.name}</h3>
                <p>{election.description}</p>
                <div className="election-meta">
                  <p><strong>Start:</strong> {formatDate(election.startTime)}</p>
                  <p><strong>End:</strong> {formatDate(election.endTime)}</p>
                  <p><strong>Candidates:</strong> {election.candidates.length}</p>
                </div>
                <div className="voting-status">
                  {userVotingStatus[election.id] ? (
                    <span className="voted-badge">You have voted</span>
                  ) : (
                    <span className="not-voted-badge">Not voted yet</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="voting-section">
            {selectedElection ? (
              <>
                <h2>Vote in: {selectedElection.name}</h2>
                
                {userVotingStatus[selectedElection.id] ? (
                  <div className="already-voted-message">
                    <p>You have already voted in this election.</p>
                    <p>Thank you for participating in the democratic process!</p>
                  </div>
                ) : (
                  <>
                    <p className="voting-instructions">Select a candidate below to cast your vote:</p>
                    
                    {voteMessage && (
                      <div className={`vote-message ${voteMessage.includes('successfully') ? 'success' : 'error'}`}>
                        {voteMessage}
                      </div>
                    )}
                    
                    <div className="candidates-grid">
                      {selectedElection.candidates.map((candidate, index) => (
                        <div 
                          key={index} 
                          className={`candidate-card ${selectedCandidate && selectedCandidate.address === candidate.address ? 'selected' : ''}`}
                          onClick={() => selectCandidate(candidate)}
                        >
                          {candidate.profileImageUrl && (
                            <div className="candidate-image">
                              <img src={candidate.profileImageUrl} alt={candidate.fullName} 
                                   onError={(e) => {
                                     e.target.onerror = null;
                                     e.target.src = assets.userIcon || assets.placeholder;
                                   }}
                              />
                            </div>
                          )}
                          
                          <div className="candidate-info">
                            <h3>{candidate.fullName}</h3>
                            <p><strong>Party:</strong> {candidate.politicalParty}</p>
                            <p><strong>Occupation:</strong> {candidate.occupation}</p>
                          </div>
                          
                          <div className="candidate-proposals">
                            <h4>Key Proposals:</h4>
                            <p>{candidate.keyProposals}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="voting-actions">
                      <button 
                        className="vote-button" 
                        disabled={!selectedCandidate || isVoting}
                        onClick={handleVote}
                      >
                        {isVoting ? 'Voting...' : 'Cast Vote'}
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="select-election-prompt">
                <h2>Select an Election</h2>
                <p>Please select an election from the list on the left to view candidates and cast your vote.</p>
                <img src={assets.electronic_vote} alt="Voting" className="vote-icon" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OngoingElections;