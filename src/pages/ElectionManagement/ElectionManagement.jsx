import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ElectionManagement.css";
import { assets } from "../../assets/assets";
import BlockchainService, {
  CandidateStatusEnum,
  ElectionStateEnum,
} from "../../services/BlockchainService";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import DateTimePicker from "react-datetime-picker";
import "react-datetime-picker/dist/DateTimePicker.css";
import "react-calendar/dist/Calendar.css";
import "react-clock/dist/Clock.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ElectionManagement = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [approvedCandidates, setApprovedCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [allElections, setAllElections] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState(false);
  const [formError, setFormError] = useState("");

  // Form state
  const [electionName, setElectionName] = useState("");
  const [electionDescription, setElectionDescription] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  ); // Default to 1 day in the future

  const navigate = useNavigate();

  // Initialize and check admin status
  useEffect(() => {
    const checkAdminAccess = async () => {
      setIsLoading(true);
      try {
        const storedAccount = localStorage.getItem("connectedAccount");
        if (!storedAccount) {
          navigate("/login");
          return;
        }

        setWalletAddress(storedAccount);

        // Check if the current user is an admin
        const adminStatus = await BlockchainService.isAdmin();
        setIsAdmin(adminStatus);

        if (!adminStatus) {
          navigate("/");
          return;
        }

        // Load approved candidates
        await loadApprovedCandidates();

        // Load all elections
        await loadElections();
      } catch (error) {
        console.error("Error checking admin access:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  const loadApprovedCandidates = async () => {
    try {
      const approvedAddresses = await BlockchainService.getCandidatesByStatus(
        CandidateStatusEnum.Approved
      );

      const approvedPromises = approvedAddresses.map((address) =>
        BlockchainService.getCandidateDetails(address).then((details) => ({
          ...details,
          address,
        }))
      );

      const approvedDetails = await Promise.all(approvedPromises);

      setApprovedCandidates(approvedDetails);
    } catch (error) {
      console.error("Error loading approved candidates:", error);
    }
  };

  const loadElections = async () => {
    try {
      const elections = await BlockchainService.getAllElections();
      setAllElections(elections);
    } catch (error) {
      console.error("Error loading elections:", error);
    }
  };

  const toggleCandidateSelection = (candidateAddress) => {
    if (selectedCandidates.includes(candidateAddress)) {
      setSelectedCandidates(
        selectedCandidates.filter((address) => address !== candidateAddress)
      );
    } else {
      setSelectedCandidates([...selectedCandidates, candidateAddress]);
    }
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    setFormError("");

    // Validate form
    if (!electionName.trim()) {
      setFormError("Election name is required");
      return;
    }

    if (!electionDescription.trim()) {
      setFormError("Election description is required");
      return;
    }

    if (selectedCandidates.length < 2) {
      setFormError("At least two candidates must be selected");
      return;
    }

    if (startTime >= endTime) {
      setFormError("End time must be after start time");
      return;
    }

    setIsProcessing(true);

    try {
      const electionData = {
        name: electionName,
        description: electionDescription,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        candidateAddresses: selectedCandidates,
      };

      console.log("Creating election with data:", electionData);

      await BlockchainService.createElection(electionData);

      // Show success toast
      toast.success(`Election "${electionName}" created successfully!`);

      // Reset form
      setElectionName("");
      setElectionDescription("");
      setStartTime(new Date());
      setEndTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
      setSelectedCandidates([]);
      setShowCreateForm(false);

      // Reload elections
      await loadElections();
    } catch (error) {
      console.error("Error creating election:", error);
      setFormError(`Failed to create election`);
      toast.error(`Failed to create election`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartElection = async (electionId) => {
    setIsProcessing(true);
    setFormError("");

    try {
      await BlockchainService.startElection(electionId);
      await loadElections();

      // Show success toast
      const election = allElections.find((e) => e.id === electionId);
      toast.success(
        `Election "${election?.name || "Unknown"}" started successfully!`
      );
    } catch (error) {
      console.error("Error starting election:", error);
      let errorMessage = error.message || "Unknown error";

      if (errorMessage.includes("Internal JSON-RPC error")) {
        errorMessage =
          "Transaction failed. There might be an issue with the blockchain transaction.";
      }

      setFormError(`Failed to start election`);
      toast.error(`Failed to start election`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndElection = async (electionId) => {
    setIsProcessing(true);

    try {
      await BlockchainService.endElection(electionId);
      await loadElections();

      // Show success toast
      const election = allElections.find((e) => e.id === electionId);
      toast.success(
        `Election "${election?.name || "Unknown"}" ended successfully!`
      );
    } catch (error) {
      console.error("Error ending election:", error);
      setFormError(`Failed to end election`);
      toast.error(`Failed to end election`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetContract = async () => {
    setIsProcessing(true);

    try {
      await BlockchainService.resetContract();

      // Reload data
      await loadApprovedCandidates();
      await loadElections();

      // Reset UI
      setResetConfirmation(false);

      // Show success toast
      toast.success("Contract reset successfully!");
    } catch (error) {
      console.error("Error resetting contract:", error);
      setFormError(`Failed to reset contract`);
      toast.error(`Failed to reset contract`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefreshElections = async () => {
    setIsProcessing(true);

    try {
      await loadElections();
      // Add toast notification for successful refresh
      toast.info("Elections refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing elections:", error);
      setFormError(`Failed to refresh elections`);
      // Add toast notification for failed refresh
      toast.error("Failed to refresh elections");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getElectionStateText = (state) => {
    switch (state) {
      case ElectionStateEnum.NotStarted:
        return "Not Started";
      case ElectionStateEnum.Ongoing:
        return "Ongoing";
      case ElectionStateEnum.Ended:
        return "Ended";
      default:
        return "Unknown";
    }
  };

  const getStateClass = (state) => {
    switch (state) {
      case ElectionStateEnum.NotStarted:
        return "not-started";
      case ElectionStateEnum.Ongoing:
        return "ongoing";
      case ElectionStateEnum.Ended:
        return "ended";
      default:
        return "";
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading election management..." />;
  }

  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <h2>Access Denied</h2>
        <p>
          You do not have permission to access the election management panel.
        </p>
        <button onClick={() => navigate("/")} className="back-button">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="election-container">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
      />

      <div className="election-header">
        <img
          src={assets.logo}
          alt="CarthageChain Logo"
          className="election-logo"
        />
        <h1>Election Management</h1>
        <div className="admin-info">
          <p>
            Logged in as:{" "}
            <span className="admin-address">
              {walletAddress.substring(0, 6)}...{walletAddress.slice(-4)}
            </span>
          </p>
        </div>
      </div>

      <div className="election-actions">
        <button
          className="create-election-button"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Cancel" : "Create New Election"}
        </button>

        <button
          className="refresh-election-button"
          onClick={handleRefreshElections}
          disabled={isProcessing}
        >
          {isProcessing ? "Refreshing..." : "Refresh Elections"}
        </button>

        <button
          className="reset-contract-button"
          onClick={() => setResetConfirmation(true)}
        >
          Reset Contract
        </button>
      </div>

      {resetConfirmation && (
        <div className="confirmation-modal">
          <div className="confirmation-content">
            <h3>Confirm Reset</h3>
            <p>
              This will remove all approved candidates and voters from the
              system. This action cannot be undone.
            </p>
            <div className="confirmation-buttons">
              <button
                className="confirm-button"
                onClick={handleResetContract}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Confirm Reset"}
              </button>
              <button
                className="cancel-button"
                onClick={() => setResetConfirmation(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="manual-control-info">
        <p>
          Elections require manual start and end by an administrator. The dates
          are used for reference only.
        </p>
      </div>

      {showCreateForm && (
        <div className="create-election-form">
          <h2>Create New Election</h2>
          {formError && <p className="form-error">{formError}</p>}

          <form onSubmit={handleCreateElection}>
            <div className="form-group">
              <label htmlFor="electionName">Election Name</label>
              <input
                type="text"
                id="electionName"
                value={electionName}
                onChange={(e) => setElectionName(e.target.value)}
                placeholder="Enter election name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="electionDescription">Description</label>
              <textarea
                id="electionDescription"
                value={electionDescription}
                onChange={(e) => setElectionDescription(e.target.value)}
                placeholder="Enter election description"
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label>Start Time</label>
              <DateTimePicker
                onChange={setStartTime}
                value={startTime}
                minDate={new Date()}
                className="datetime-picker"
              />
            </div>

            <div className="form-group">
              <label>End Time</label>
              <DateTimePicker
                onChange={setEndTime}
                value={endTime}
                minDate={startTime}
                className="datetime-picker"
              />
            </div>

            <div className="form-group">
              <label>Select Candidates</label>
              <div className="candidates-list">
                {approvedCandidates.length === 0 ? (
                  <p className="no-candidates">
                    No approved candidates available.
                  </p>
                ) : (
                  approvedCandidates.map((candidate, index) => (
                    <div
                      key={index}
                      className={`candidate-item ${
                        selectedCandidates.includes(candidate.address)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        toggleCandidateSelection(candidate.address)
                      }
                    >
                      <div className="candidate-info">
                        <h3>{candidate.fullName}</h3>
                        <p>Party: {candidate.politicalParty}</p>
                        <p className="candidate-address">
                          {candidate.address.substring(0, 6)}...
                          {candidate.address.slice(-4)}
                        </p>
                      </div>
                      <div className="candidate-selection">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(
                            candidate.address
                          )}
                          onChange={() => {}}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="selection-info">
                Selected: {selectedCandidates.length} candidates
              </p>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-button"
                disabled={isProcessing}
              >
                {isProcessing ? "Creating..." : "Create Election"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="elections-section">
        <h2>All Elections</h2>

        {allElections.length === 0 ? (
          <p className="no-elections">No elections have been created yet.</p>
        ) : (
          <div className="elections-list">
            {allElections.map((election, index) => {
              return (
                <div
                  key={index}
                  className={`election-item state-${getStateClass(
                    election.state
                  )}`}
                >
                  <div className="election-item-header">
                    <h3>{election.name}</h3>
                    <span
                      className={`election-state state-${getStateClass(
                        election.state
                      )}`}
                    >
                      {getElectionStateText(election.state)}
                    </span>
                  </div>

                  <div className="election-details">
                    <p>{election.description}</p>
                    <p>
                      <strong>Start:</strong> {formatDate(election.startTime)}
                    </p>
                    <p>
                      <strong>End:</strong> {formatDate(election.endTime)}
                    </p>
                    <p>
                      <strong>Candidates:</strong> {election.candidates.length}
                    </p>
                  </div>

                  <div className="election-actions">
                    {election.state === ElectionStateEnum.NotStarted && (
                      <>
                        <button
                          className="start-election-button"
                          onClick={() => handleStartElection(election.id)}
                          disabled={isProcessing}
                          title="Start the election"
                        >
                          {isProcessing ? "Processing..." : "Start Election"}
                        </button>
                      </>
                    )}

                    {election.state === ElectionStateEnum.Ongoing && (
                      <button
                        className="end-election-button"
                        onClick={() => handleEndElection(election.id)}
                        disabled={isProcessing}
                        title="End the election"
                      >
                        {isProcessing ? "Processing..." : "End Election"}
                      </button>
                    )}

                    {election.state === ElectionStateEnum.Ended && (
                      <button
                        className="view-results-button"
                        onClick={() =>
                          navigate(`/election-results/${election.id}`)
                        }
                      >
                        View Results
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ElectionManagement;
