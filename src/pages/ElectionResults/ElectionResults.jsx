import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './ElectionResults.css';
import { assets } from '../../assets/assets';
import BlockchainService, { ElectionStateEnum } from '../../services/BlockchainService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

const ElectionResults = () => {
  const [election, setElection] = useState(null);
  const [pastElections, setPastElections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    const loadElectionData = async () => {
      setIsLoading(true);
      try {
        // Initialize the blockchain service
        await BlockchainService.initialize();
        
        // Always load the list of past elections
        const allPastElections = await BlockchainService.getPastElections();
        setPastElections(allPastElections);
        
        if (electionId) {
          // If there's an electionId parameter, load details for that specific election
          const details = await BlockchainService.getElectionDetails(electionId);
          
          if (details.state !== ElectionStateEnum.Ended) {
            setError('This election has not ended yet.');
          } else {
            const results = await BlockchainService.getElectionResults(electionId);
            setElection({
              id: electionId,
              ...details,
              ...results
            });
          }
        } else {
          // If no specific election is requested, just show the list
          setElection(null);
        }
      } catch (error) {
        console.error("Error loading election data:", error);
        setError('Failed to load election data.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadElectionData();
  }, [electionId, navigate]);

  // Search functionality
  useEffect(() => {
    // Filter elections based on search term
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    const filtered = pastElections.filter(election =>
      election.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      election.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setSearchResults(filtered);
    setShowSearchResults(true);
  }, [searchTerm, pastElections]);

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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectElection = (electionId) => {
    navigate(`/election-results/${electionId}`);
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculatePercentage = (voteCount, totalVotes) => {
    if (totalVotes === 0) return 0;
    return ((voteCount / totalVotes) * 100).toFixed(2);
  };

  const getTotalVotes = (candidates) => {
    if (!candidates) return 0;
    return candidates.reduce((sum, candidate) => sum + parseInt(candidate.voteCount || 0), 0);
  };

  const checkForTie = (candidates) => {
    if (!candidates || candidates.length < 2) return false;
    
    // Sort candidates by vote count (descending)
    const sorted = [...candidates].sort((a, b) => 
      parseInt(b.voteCount || 0) - parseInt(a.voteCount || 0)
    );
    
    // Check if the top two candidates have the same number of votes
    return sorted[0].voteCount === sorted[1].voteCount && parseInt(sorted[0].voteCount) > 0;
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading election data..." />;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="back-button">
          Go Back
        </button>
      </div>
    );
  }

  // If no electionId is provided, show the list of all past elections
  if (!electionId) {
    return (
      <div className="elections-list-container">
        <div className="elections-list-header">
          <img src={assets.logo} alt="CarthageChain Logo" className="results-logo" />
          <h1>All Election Results</h1>
        </div>
        
        {/* Search Bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search past elections..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          {showSearchResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((election) => {
                const totalVotes = getTotalVotes(election.candidates);
                const hasTie = checkForTie(election.candidates);
                
                return (
                  <div 
                    key={election.id} 
                    className="search-result-item"
                    onClick={() => handleSelectElection(election.id)}
                  >
                    <h4>{election.name}</h4>
                    <p>{election.description.substring(0, 50)}...</p>
                    <div className="search-result-meta">
                      <span>
                        <strong>Votes:</strong> {totalVotes}
                      </span>
                      {hasTie ? (
                        <span className="result-badge tie-badge">Tie</span>
                      ) : totalVotes === 0 ? (
                        <span className="result-badge no-votes-badge">No Votes</span>
                      ) : (
                        <span className="result-badge winner-badge">Has Winner</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {showSearchResults && searchResults.length === 0 && searchTerm !== '' && (
            <div className="search-results">
              <div className="no-results">No elections found</div>
            </div>
          )}
        </div>
        
        {pastElections.length === 0 ? (
          <div className="no-results-container">
            <h2>No Past Elections</h2>
            <p>There are no completed elections to display.</p>
            <button onClick={() => navigate('/')} className="back-button">
              Back to Home
            </button>
          </div>
        ) : (
          <div className="elections-list">
            {pastElections.map((election) => {
              const totalVotes = getTotalVotes(election.candidates);
              const hasTie = checkForTie(election.candidates);
              
              return (
                <div key={election.id} className="election-card" onClick={() => navigate(`/election-results/${election.id}`)}>
                  <div className="election-card-header">
                    <h2>{election.name}</h2>
                    <span className="election-status ended">
                      Ended
                    </span>
                  </div>
                  <div className="election-card-body">
                    <p>{election.description}</p>
                    <div className="election-card-dates">
                      <p><strong>Start:</strong> {formatDate(election.startTime)}</p>
                      <p><strong>End:</strong> {formatDate(election.endTime)}</p>
                      <p><strong>Votes:</strong> {totalVotes}</p>
                    </div>
                    {hasTie ? (
                      <div className="election-card-tie">
                        <p><strong>Result:</strong> Election resulted in a tie</p>
                      </div>
                    ) : election.winner ? (
                      <div className="election-card-winner">
                        <p><strong>Winner:</strong> {election.winner.fullName}</p>
                        <p><strong>Party:</strong> {election.winner.politicalParty}</p>
                      </div>
                    ) : (
                      <div className="election-card-no-votes">
                        <p><strong>Result:</strong> No votes were cast</p>
                      </div>
                    )}
                  </div>
                  <div className="election-card-footer">
                    <span className="view-details">View Results →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // If election wasn't found for the provided ID
  if (electionId && !election) {
    return (
      <div className="no-results-container">
        <h2>No Election Results</h2>
        <p>The requested election results could not be found.</p>
        <button onClick={() => navigate('/election-results')} className="back-button">
          Back to All Elections
        </button>
      </div>
    );
  }

  // Display specific election results
  // Sort candidates by vote count (descending)
  const sortedCandidates = [...election.candidates].sort((a, b) => 
    parseInt(b.voteCount || 0) - parseInt(a.voteCount || 0)
  );
  
  const totalVotes = getTotalVotes(election.candidates);
  const hasTie = checkForTie(sortedCandidates);
  
  // Find the winner in the sorted candidates (if exists)
  let winnerFromList = null;
  if (election.winner && election.winner.address) {
    winnerFromList = sortedCandidates.find(
      candidate => candidate.address === election.winner.address
    );
  }
  
  // If no winner from blockchain or can't find winner in list, use top candidate
  const topCandidate = sortedCandidates.length > 0 ? sortedCandidates[0] : null;
  const effectiveWinner = winnerFromList || topCandidate;

  return (
    <div className="results-container">
      <div className="results-header">
        <img src={assets.logo} alt="CarthageChain Logo" className="results-logo" />
        <h1>Election Results</h1>
        <div className="back-nav">
          <button onClick={() => navigate('/election-results')} className="back-button">
            Back to All Elections
          </button>
        </div>
      </div>
      
      {/* Search Bar (in detailed view as well) */}
      <div className="search-container detailed-view-search">
        <input
          type="text"
          placeholder="Search other past elections..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
        {showSearchResults && searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((election) => {
              const totalVotes = getTotalVotes(election.candidates);
              const hasTie = checkForTie(election.candidates);
              
              return (
                <div 
                  key={election.id} 
                  className="search-result-item"
                  onClick={() => handleSelectElection(election.id)}
                >
                  <h4>{election.name}</h4>
                  <p>{election.description.substring(0, 50)}...</p>
                  <div className="search-result-meta">
                    <span>
                      <strong>Votes:</strong> {totalVotes}
                    </span>
                    {hasTie ? (
                      <span className="result-badge tie-badge">Tie</span>
                    ) : totalVotes === 0 ? (
                      <span className="result-badge no-votes-badge">No Votes</span>
                    ) : (
                      <span className="result-badge winner-badge">Has Winner</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {showSearchResults && searchResults.length === 0 && searchTerm !== '' && (
          <div className="search-results">
            <div className="no-results">No elections found</div>
          </div>
        )}
      </div>
      
      <div className="election-info">
        <h2>{election.name}</h2>
        <p className="election-description">{election.description}</p>
        <div className="election-dates">
          <p><strong>Start:</strong> {formatDate(election.startTime)}</p>
          <p><strong>End:</strong> {formatDate(election.endTime)}</p>
          <p><strong>Total Votes Cast:</strong> {totalVotes}</p>
        </div>
      </div>
      
      <div className="results-content">
        <div className="winner-section">
          <h3>{hasTie ? "Election Resulted in a Tie" : "Winner"}</h3>
          {hasTie ? (
            <div className="tie-notification">
              <div className="tie-message">
                <h2>Tie Detected</h2>
                <p>Multiple candidates received the same number of votes ({sortedCandidates[0].voteCount}).</p>
                <p>According to electoral procedures, a runoff election may be required.</p>
              </div>
              <div className="tied-candidates">
                {sortedCandidates.filter(c => c.voteCount === sortedCandidates[0].voteCount).map((candidate, idx) => (
                  <div key={idx} className="tied-candidate">
                    {candidate.profileImageUrl && (
                      <div className="candidate-image">
                        <img src={candidate.profileImageUrl} alt={candidate.fullName} />
                      </div>
                    )}
                    <div className="candidate-info">
                      <h3>{candidate.fullName}</h3>
                      <p>{candidate.politicalParty}</p>
                      <p>{candidate.voteCount} votes ({calculatePercentage(candidate.voteCount, totalVotes)}%)</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : totalVotes === 0 ? (
            <p className="no-votes">No votes were cast in this election.</p>
          ) : effectiveWinner ? (
            <div className="winner-card">
              {effectiveWinner.profileImageUrl && (
                <div className="winner-image">
                  <img src={effectiveWinner.profileImageUrl} alt={effectiveWinner.fullName} />
                </div>
              )}
              <div className="winner-info">
                <h2>{effectiveWinner.fullName}</h2>
                <p className="winner-party">{effectiveWinner.politicalParty}</p>
                <div className="winner-votes">
                  <span className="vote-count">
                    {effectiveWinner.voteCount || 0} votes
                  </span>
                  <span className="vote-percentage">
                    ({calculatePercentage(effectiveWinner.voteCount || 0, totalVotes)}%)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="no-winner">No winner determined. The election may have resulted in a tie.</p>
          )}
        </div>
        
        <div className="candidates-results">
          <h3>All Candidates</h3>
          <div className="results-table">
            <div className="table-header">
              <div className="col-rank">Rank</div>
              <div className="col-candidate">Candidate</div>
              <div className="col-party">Party</div>
              <div className="col-votes">Votes</div>
              <div className="col-percentage">Percentage</div>
            </div>
            
            {sortedCandidates.map((candidate, index) => {
              // Determine if this candidate is tied for first
              const isTiedForFirst = hasTie && candidate.voteCount === sortedCandidates[0].voteCount;
              
              return (
                <div 
                  key={index} 
                  className={`table-row ${index === 0 && !hasTie ? 'winner' : ''} ${isTiedForFirst ? 'tied' : ''}`}
                >
                  <div className="col-rank">
                    {isTiedForFirst ? 'T-1' : index + 1}
                  </div>
                  <div className="col-candidate">
                    <div className="candidate-name-with-image">
                      {candidate.profileImageUrl && (
                        <img 
                          src={candidate.profileImageUrl} 
                          alt={candidate.fullName} 
                          className="candidate-small-image" 
                        />
                      )}
                      <span>{candidate.fullName}</span>
                    </div>
                  </div>
                  <div className="col-party">{candidate.politicalParty}</div>
                  <div className="col-votes">{candidate.voteCount || 0}</div>
                  <div className="col-percentage">
                    {calculatePercentage(candidate.voteCount || 0, totalVotes)}%
                    <div className="percentage-bar">
                      <div 
                        className="percentage-fill"
                        style={{ width: `${calculatePercentage(candidate.voteCount || 0, totalVotes)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectionResults;