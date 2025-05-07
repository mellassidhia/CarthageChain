import { useState, useEffect } from 'react';
import BlockchainService, { CandidateStatusEnum } from '../../services/BlockchainService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './ApprovedCandidates.css';

const ApprovedCandidates = () => {
  const [approvedCandidates, setApprovedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApprovedCandidates = async () => {
      try {
        setLoading(true);
        await BlockchainService.initialize();
        
        // Get only approved candidate addresses directly from the contract
        const approvedAddresses = await BlockchainService.getCandidatesByStatus(CandidateStatusEnum.Approved);
        
        // Fetch details for each approved candidate
        const candidateDetailsPromises = approvedAddresses.map(async (address) => {
          try {
            const details = await BlockchainService.getCandidateDetails(address);
            return {
              address,
              name: details.fullName,
              party: details.politicalParty,
              position: details.occupation,
              bio: details.previousExperience,
              campaignPromises: details.keyProposals,
              contact: details.email,
              profileImageUrl: details.profileImageUrl
            };
          } catch (error) {
            console.error(`Error fetching details for candidate ${address}:`, error);
            // Return null for candidates with errors, we'll filter them out later
            return null;
          }
        });
        
        // Wait for all promises to resolve and filter out failed ones
        const approvedCandidatesDetails = (await Promise.all(candidateDetailsPromises))
          .filter(candidate => candidate !== null);
          
        setApprovedCandidates(approvedCandidatesDetails);
      } catch (err) {
        console.error('Error fetching approved candidates:', err);
        setError('Failed to load approved candidates. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedCandidates();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading approved candidates..." />;
  }

  if (error) {
    return <div className="candidates-error">{error}</div>;
  }

  return (
    <div className="candidates-container">
      <h1>Approved Candidates</h1>
      
      {approvedCandidates.length === 0 ? (
        <p className="no-candidates">No approved candidates found.</p>
      ) : (
        <div className="candidates-grid">
          {approvedCandidates.map((candidate, index) => (
            <div key={index} className="candidate-card">
              <div className="candidate-img-container">
                {candidate.profileImageUrl && (
                  <img src={candidate.profileImageUrl} alt={`${candidate.name} profile`} className="candidate-img" />
                )}
              </div>
              <div className="candidate-header">
                <h2>{candidate.name}</h2>
                <span className="status-badge approved">Approved</span>
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

export default ApprovedCandidates;