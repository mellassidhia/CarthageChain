import { useState, useEffect } from 'react';
import BlockchainService, { CandidateStatusEnum } from '../../services/BlockchainService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './AllCandidates.css';

const AllCandidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        await BlockchainService.initialize();
        // Get all candidate addresses from the contract
        const candidateAddresses = await BlockchainService.electionContract.getAllCandidates();

        
        // Fetch details for each candidate
        const candidateDetailsPromises = candidateAddresses.map(async (address) => {
          try {
            const details = await BlockchainService.getCandidateDetails(address);
            const status = await BlockchainService.getCandidateStatus(address);
            
            return {
              address,
              name: details.fullName,
              party: details.politicalParty,
              position: details.occupation,
              bio: details.previousExperience,
              campaignPromises: details.keyProposals,
              contact: details.email,
              approved: status === CandidateStatusEnum.Approved,
              profileImageUrl: details.profileImageUrl
            };
          } catch (error) {
            console.error(`Error fetching details for candidate ${address}:`, error);
            // Return null for candidates with errors, we'll filter them out later
            return null;
          }
        });
        
        // Wait for all promises to resolve and filter out failed ones
        const allCandidatesDetails = (await Promise.all(candidateDetailsPromises))
          .filter(candidate => candidate !== null);
          
        setCandidates(allCandidatesDetails);
      } catch (err) {
        console.error('Error fetching candidates:', err);
        setError('Failed to load candidates. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading all candidates..." />;
  }

  if (error) {
    return <div className="candidates-error">{error}</div>;
  }

  return (
    <div className="candidates-container">
      <h1>All Candidates</h1>
      
      {candidates.length === 0 ? (
        <p className="no-candidates">No candidates found.</p>
      ) : (
        <div className="candidates-grid">
          {candidates.map((candidate, index) => (
            <div key={index} className="candidate-card">
              <div className="candidate-img-container">
                {candidate.profileImageUrl && (
                  <img src={candidate.profileImageUrl} alt={`${candidate.name} profile`} className="candidate-img" />
                )}
              </div>
              <div className="candidate-header">
                <h2>{candidate.name}</h2>
                <span className={`status-badge ${candidate.approved ? 'approved' : 'pending'}`}>
                  {candidate.approved ? 'Approved' : 'Pending'}
                </span>
              </div>
              <p className="candidate-party">{candidate.party}</p>
              <p className="candidate-position">{candidate.position}</p>
              <div className="candidate-info">
                <p>{candidate.bio}</p>
                <p><strong>Campaign Promises:</strong> {candidate.campaignPromises}</p>
                <p><strong>Contact:</strong> {candidate.contact}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllCandidates;