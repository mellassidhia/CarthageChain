// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICarthageChainElection {
    enum VoterStatus { Pending, Approved, Rejected }
    enum CandidateStatus { Pending, Approved, Rejected }
    enum Role { None, Voter, Candidate }
    
    function getUserRole(address _userAddress) external view returns (Role);
    function getVoterStatus(address _userAddress) external view returns (VoterStatus);
    function getCandidateStatus(address _userAddress) external view returns (CandidateStatus);
    function isAdmin(address _address) external view returns (bool);
    function getCandidateBasicDetails(address _candidateAddress) external view returns (
        string memory fullName,
        string memory dob,
        string memory nationality,
        string memory govId,
        string memory residentialAddress,
        string memory email,
        string memory phone,
        CandidateStatus status
    );
}

contract CarthageChainVoting {
    enum ElectionState { NotStarted, Ongoing, Ended }
    
    struct Election {
        string name;
        string description;
        uint startTime;  // Used as reference only with manual control
        uint endTime;    // Used as reference only with manual control
        ElectionState state;
        address[] candidates;
        uint[] voteCounts;
        bool exists;
    }
    
    struct ElectionCreationParams {
        string name;
        string description;
        uint startTime;
        uint endTime;
        address[] candidateAddresses;
    }
    
    address public admin;
    ICarthageChainElection public electionContract;
    
    uint public currentElectionId;
    mapping(uint => Election) public elections;
    mapping(uint => mapping(address => bool)) public hasVoted;
    uint[] public electionIds;
    
    event ElectionCreated(uint indexed electionId, string name, uint startTime, uint endTime);
    event ElectionStarted(uint indexed electionId);
    event ElectionEnded(uint indexed electionId);
    event VoteCast(uint indexed electionId, address indexed voter, address indexed candidate);
    
    modifier onlyAdmin() {
        require(electionContract.isAdmin(msg.sender), "Only admin can call this function");
        _;
    }
    
    modifier electionExists(uint _electionId) {
        require(elections[_electionId].exists, "Election does not exist");
        _;
    }
    
    constructor(address _electionContractAddress) {
        admin = msg.sender;
        electionContract = ICarthageChainElection(_electionContractAddress);
        currentElectionId = 0;
    }
    
    // Election related functions
    function createElection(ElectionCreationParams memory params) public onlyAdmin {
        // Modified to allow any start/end times - just for reference
        require(params.endTime > params.startTime, "End time must be after start time");
        require(params.candidateAddresses.length > 0, "At least one candidate is required");
        
        // Ensure all candidates are approved
        for (uint i = 0; i < params.candidateAddresses.length; i++) {
            address candidateAddress = params.candidateAddresses[i];
            
            // Check if address is a registered candidate
            require(
                electionContract.getUserRole(candidateAddress) == ICarthageChainElection.Role.Candidate,
                "Address is not a registered candidate"
            );
            
            // Check if candidate is approved - using the new getCandidateStatus function
            require(
                electionContract.getCandidateStatus(candidateAddress) == ICarthageChainElection.CandidateStatus.Approved,
                "Candidate is not approved"
            );
            
            // Check for duplicates
            for (uint j = 0; j < i; j++) {
                require(params.candidateAddresses[j] != candidateAddress, "Duplicate candidate");
            }
        }
        
        currentElectionId++;
        uint electionId = currentElectionId;
        
        // Create new election - always starts in NotStarted state
        Election storage newElection = elections[electionId];
        newElection.name = params.name;
        newElection.description = params.description;
        newElection.startTime = params.startTime;
        newElection.endTime = params.endTime;
        newElection.state = ElectionState.NotStarted;
        newElection.candidates = params.candidateAddresses;
        newElection.voteCounts = new uint[](params.candidateAddresses.length);
        newElection.exists = true;
        
        electionIds.push(electionId);
        
        emit ElectionCreated(electionId, params.name, params.startTime, params.endTime);
    }
    
    // Manually start an election - no time checks
    function startElection(uint _electionId) public onlyAdmin electionExists(_electionId) {
        Election storage election = elections[_electionId];
        require(election.state == ElectionState.NotStarted, "Election has already started or ended");
        
        // No time checks - allow admin to start anytime
        election.state = ElectionState.Ongoing;
        
        emit ElectionStarted(_electionId);
    }
    
    // Manually end an election - no time checks
    function endElection(uint _electionId) public onlyAdmin electionExists(_electionId) {
        Election storage election = elections[_electionId];
        require(election.state == ElectionState.Ongoing, "Election is not ongoing");
        
        // No time checks - allow admin to end anytime
        election.state = ElectionState.Ended;
        
        emit ElectionEnded(_electionId);
    }
    
    // Updated castVote function to work with separate status types
    function castVote(uint _electionId, uint _candidateIndex) public electionExists(_electionId) {
        Election storage election = elections[_electionId];
        require(election.state == ElectionState.Ongoing, "Election is not ongoing");
        require(_candidateIndex < election.candidates.length, "Invalid candidate index");
        
        // Get user role from the election contract
        ICarthageChainElection.Role userRole = electionContract.getUserRole(msg.sender);
        
        bool isApprovedVoter = false;
        bool isApprovedCandidate = false;
        
        // Check if user is an approved voter
        if (userRole == ICarthageChainElection.Role.Voter) {
            try electionContract.getVoterStatus(msg.sender) returns (ICarthageChainElection.VoterStatus status) {
                isApprovedVoter = (status == ICarthageChainElection.VoterStatus.Approved);
            } catch {
                // If the function call fails, user is not an approved voter
                isApprovedVoter = false;
            }
        }
        
        // Check if user is an approved candidate
        if (userRole == ICarthageChainElection.Role.Candidate) {
            try electionContract.getCandidateStatus(msg.sender) returns (ICarthageChainElection.CandidateStatus status) {
                isApprovedCandidate = (status == ICarthageChainElection.CandidateStatus.Approved);
            } catch {
                // If the function call fails, user is not an approved candidate
                isApprovedCandidate = false;
            }
        }
        
        // Allow voting if user is either an approved voter OR an approved candidate
        require(isApprovedVoter || isApprovedCandidate, 
                "You must be either an approved voter or an approved candidate to vote");
        
        require(!hasVoted[_electionId][msg.sender], "You have already voted in this election");
        
        // Record the vote
        election.voteCounts[_candidateIndex]++;
        hasVoted[_electionId][msg.sender] = true;
        
        emit VoteCast(_electionId, msg.sender, election.candidates[_candidateIndex]);
    }
    
    // Function to get all elections
    function getAllElections() public view returns (uint[] memory) {
        return electionIds;
    }
    
    // Function to get election details
    function getElectionDetails(uint _electionId) public view electionExists(_electionId) returns (
        string memory name,
        string memory description,
        uint startTime,
        uint endTime,
        ElectionState state,
        address[] memory candidates,
        uint[] memory voteCounts
    ) {
        Election storage election = elections[_electionId];
        
        return (
            election.name,
            election.description,
            election.startTime,
            election.endTime,
            election.state,
            election.candidates,
            election.voteCounts
        );
    }
    
    // Function to check if a voter has voted in an election
    function hasVotedInElection(uint _electionId, address _voter) public view electionExists(_electionId) returns (bool) {
        return hasVoted[_electionId][_voter];
    }
    
    // Function to get election results
    function getElectionResults(uint _electionId) public view electionExists(_electionId) returns (
        address[] memory candidates,
        uint[] memory voteCounts,
        address winner
    ) {
        Election storage election = elections[_electionId];
        require(election.state == ElectionState.Ended, "Election has not ended yet");
        
        uint winningVoteCount = 0;
        address winningCandidate = address(0);
        
        for (uint i = 0; i < election.candidates.length; i++) {
            if (election.voteCounts[i] > winningVoteCount) {
                winningVoteCount = election.voteCounts[i];
                winningCandidate = election.candidates[i];
            }
        }
        
        return (election.candidates, election.voteCounts, winningCandidate);
    }
    
    // Function to get the ongoing elections
    function getOngoingElections() public view returns (uint[] memory) {
        uint count = 0;
        
        // Count the number of ongoing elections
        for (uint i = 0; i < electionIds.length; i++) {
            uint electionId = electionIds[i];
            if (elections[electionId].state == ElectionState.Ongoing) {
                count++;
            }
        }
        
        // Create an array of the required size
        uint[] memory ongoingElectionIds = new uint[](count);
        
        // Fill the array
        uint index = 0;
        for (uint i = 0; i < electionIds.length; i++) {
            uint electionId = electionIds[i];
            if (elections[electionId].state == ElectionState.Ongoing) {
                ongoingElectionIds[index] = electionId;
                index++;
            }
        }
        
        return ongoingElectionIds;
    }
    
    // Function to get the past elections
    function getPastElections() public view returns (uint[] memory) {
        uint count = 0;
        
        // Count the number of past elections
        for (uint i = 0; i < electionIds.length; i++) {
            uint electionId = electionIds[i];
            if (elections[electionId].state == ElectionState.Ended) {
                count++;
            }
        }
        
        // Create an array of the required size
        uint[] memory pastElectionIds = new uint[](count);
        
        // Fill the array
        uint index = 0;
        for (uint i = 0; i < electionIds.length; i++) {
            uint electionId = electionIds[i];
            if (elections[electionId].state == ElectionState.Ended) {
                pastElectionIds[index] = electionId;
                index++;
            }
        }
        
        return pastElectionIds;
    }
    
    // Function to reset the contract for testing purposes
    function resetContract() public onlyAdmin {
        for (uint i = 0; i < electionIds.length; i++) {
            uint electionId = electionIds[i];
            delete elections[electionId];
        }
        
        delete electionIds;
        currentElectionId = 0;
    }
}