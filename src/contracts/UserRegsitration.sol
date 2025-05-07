// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CarthageChainElection {
    enum VoterStatus { Pending, Approved, Rejected }
    enum CandidateStatus { Pending, Approved, Rejected }
    enum Role { None, Voter, Candidate }
    
    struct Voter {
        string fullName;
        string dob;
        string govId;
        string residentialAddress;
        string email;
        string phone;
        string profileDataCID; // IPFS CID for profile image
        string idDocumentCID; // IPFS CID for ID document
        VoterStatus status;
        string statusMessage; // Added to store admin's message
        bool exists;
    }
    
    // Split candidate struct into basic and extended details to avoid stack depth issues
    struct CandidateBasic {
        string fullName;
        string dob;
        string nationality;
        string govId;
        string residentialAddress;
        string email;
        string phone;
        CandidateStatus status;
        string statusMessage; // Added to store admin's message
        bool exists;
    }
    
    struct CandidateExtended {
        string education;
        string occupation;
        string politicalParty;
        string previousExperience;
        string keyProposals;
        string campaignFunding;
        uint supportSignatures;
    }
    
    struct CandidateDocuments {
        string profileDataCID;
        string idDocumentCID;
        string supportDocumentCID;
        string financialDocumentCID;
    }
    
    // Structs for parameter passing to avoid stack too deep errors
    struct VoterRegistrationParams {
        string fullName;
        string dob;
        string govId;
        string residentialAddress;
        string email;
        string phone;
        string profileDataCID;
        string idDocumentCID;
    }
    
    address public admin;
    mapping(address => Voter) public voters;
    mapping(address => CandidateBasic) public candidatesBasic;
    mapping(address => CandidateExtended) public candidatesExtended;
    mapping(address => CandidateDocuments) public candidatesDocuments;
    mapping(address => Role) public userRoles;
    
    address[] public voterAddresses;
    address[] public candidateAddresses;
    
    event VoterRegistered(address indexed userAddress, VoterStatus status);
    event CandidateRegistered(address indexed userAddress, CandidateStatus status);
    event VoterStatusUpdated(address indexed userAddress, VoterStatus status, string message);
    event CandidateStatusUpdated(address indexed userAddress, CandidateStatus status, string message);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    // Register a voter with struct parameter to avoid stack too deep
    function registerVoter(VoterRegistrationParams memory params) public {
        // Block admin from registering as a voter
        require(msg.sender != admin, "Admin cannot register as a voter");
        require(userRoles[msg.sender] == Role.None || userRoles[msg.sender] == Role.Voter, "Already registered as candidate");
        
        Voter storage voter = voters[msg.sender];
        
        // If first time registering, add to list
        if (!voter.exists) {
            voterAddresses.push(msg.sender);
        }
        
        // Update voter information
        voter.fullName = params.fullName;
        voter.dob = params.dob;
        voter.govId = params.govId;
        voter.residentialAddress = params.residentialAddress;
        voter.email = params.email;
        voter.phone = params.phone;
        voter.profileDataCID = params.profileDataCID;
        voter.idDocumentCID = params.idDocumentCID;
        voter.status = VoterStatus.Pending;
        voter.statusMessage = ""; // Initialize message as empty
        voter.exists = true;
        
        userRoles[msg.sender] = Role.Voter;
        
        emit VoterRegistered(msg.sender, VoterStatus.Pending);
    }
    
    // Split candidate registration into multiple functions to avoid stack too deep
    function registerCandidateBasicInfo(
        string memory _fullName,
        string memory _dob,
        string memory _nationality,
        string memory _govId,
        string memory _residentialAddress,
        string memory _email,
        string memory _phone
    ) public {
        // Block admin from registering as a candidate
        require(msg.sender != admin, "Admin cannot register as a candidate");
        
        CandidateBasic storage candidate = candidatesBasic[msg.sender];
        
        // If first time registering, add to list
        if (!candidate.exists) {
            candidateAddresses.push(msg.sender);
        }
        
        // Update candidate basic information
        candidate.fullName = _fullName;
        candidate.dob = _dob;
        candidate.nationality = _nationality;
        candidate.govId = _govId;
        candidate.residentialAddress = _residentialAddress;
        candidate.email = _email;
        candidate.phone = _phone;
        candidate.status = CandidateStatus.Pending;
        candidate.statusMessage = ""; // Initialize message as empty
        candidate.exists = true;
        
        userRoles[msg.sender] = Role.Candidate;
    }
    
    function registerCandidateExtendedInfo(
        string memory _education,
        string memory _occupation,
        string memory _politicalParty,
        string memory _previousExperience,
        string memory _keyProposals,
        string memory _campaignFunding,
        uint _supportSignatures
    ) public {
        // Ensure basic info exists
        require(candidatesBasic[msg.sender].exists, "Register basic info first");
        
        CandidateExtended storage candidateExt = candidatesExtended[msg.sender];
        
        // Update candidate extended information
        candidateExt.education = _education;
        candidateExt.occupation = _occupation;
        candidateExt.politicalParty = _politicalParty;
        candidateExt.previousExperience = _previousExperience;
        candidateExt.keyProposals = _keyProposals;
        candidateExt.campaignFunding = _campaignFunding;
        candidateExt.supportSignatures = _supportSignatures;
    }
    
    function registerCandidateDocuments(
        string memory _profileDataCID,
        string memory _idDocumentCID,
        string memory _supportDocumentCID,
        string memory _financialDocumentCID
    ) public {
        // Ensure basic info exists
        require(candidatesBasic[msg.sender].exists, "Register basic info first");
        
        CandidateDocuments storage candidateDocs = candidatesDocuments[msg.sender];
        
        // Update candidate documents
        candidateDocs.profileDataCID = _profileDataCID;
        candidateDocs.idDocumentCID = _idDocumentCID;
        candidateDocs.supportDocumentCID = _supportDocumentCID;
        candidateDocs.financialDocumentCID = _financialDocumentCID;
        
        // Emit registration event only after all information is provided
        emit CandidateRegistered(msg.sender, CandidateStatus.Pending);
    }
    
    function updateVoterStatus(address _voterAddress, VoterStatus _status, string memory _message) public onlyAdmin {
        require(voters[_voterAddress].exists, "Voter does not exist");
        voters[_voterAddress].status = _status;
        voters[_voterAddress].statusMessage = _message; // Store the message
        emit VoterStatusUpdated(_voterAddress, _status, _message);
    }
    
    function updateCandidateStatus(address _candidateAddress, CandidateStatus _status, string memory _message) public onlyAdmin {
        require(candidatesBasic[_candidateAddress].exists, "Candidate does not exist");
        candidatesBasic[_candidateAddress].status = _status;
        candidatesBasic[_candidateAddress].statusMessage = _message; // Store the message
        emit CandidateStatusUpdated(_candidateAddress, _status, _message);
    }
    
    // New function to get voter status message
    function getVoterStatusMessage(address _voterAddress) public view returns (string memory) {
        require(voters[_voterAddress].exists, "Voter does not exist");
        return voters[_voterAddress].statusMessage;
    }
    
    // New function to get candidate status message
    function getCandidateStatusMessage(address _candidateAddress) public view returns (string memory) {
        require(candidatesBasic[_candidateAddress].exists, "Candidate does not exist");
        return candidatesBasic[_candidateAddress].statusMessage;
    }
    
    function getVoterDetails(address _voterAddress) public view returns (
        string memory fullName,
        string memory dob,
        string memory govId,
        string memory residentialAddress,
        string memory email,
        string memory phone,
        string memory profileDataCID,
        string memory idDocumentCID,
        VoterStatus status
    ) {
        Voter storage voter = voters[_voterAddress];
        require(voter.exists, "Voter does not exist");
        
        return (
            voter.fullName,
            voter.dob,
            voter.govId,
            voter.residentialAddress,
            voter.email,
            voter.phone,
            voter.profileDataCID,
            voter.idDocumentCID,
            voter.status
        );
    }
    
    function getCandidateBasicDetails(address _candidateAddress) public view returns (
        string memory fullName,
        string memory dob,
        string memory nationality,
        string memory govId,
        string memory residentialAddress,
        string memory email,
        string memory phone,
        CandidateStatus status
    ) {
        CandidateBasic storage candidate = candidatesBasic[_candidateAddress];
        require(candidate.exists, "Candidate does not exist");
        
        return (
            candidate.fullName,
            candidate.dob,
            candidate.nationality,
            candidate.govId,
            candidate.residentialAddress,
            candidate.email,
            candidate.phone,
            candidate.status
        );
    }
    
    function getCandidateExtendedDetails(address _candidateAddress) public view returns (
        string memory education,
        string memory occupation,
        string memory politicalParty,
        string memory previousExperience,
        string memory keyProposals,
        string memory campaignFunding,
        uint supportSignatures
    ) {
        require(candidatesBasic[_candidateAddress].exists, "Candidate does not exist");
        CandidateExtended storage candidateExt = candidatesExtended[_candidateAddress];
        
        return (
            candidateExt.education,
            candidateExt.occupation,
            candidateExt.politicalParty,
            candidateExt.previousExperience,
            candidateExt.keyProposals,
            candidateExt.campaignFunding,
            candidateExt.supportSignatures
        );
    }
    
    function getCandidateDocuments(address _candidateAddress) public view returns (
        string memory profileDataCID,
        string memory idDocumentCID,
        string memory supportDocumentCID,
        string memory financialDocumentCID
    ) {
        require(candidatesBasic[_candidateAddress].exists, "Candidate does not exist");
        CandidateDocuments storage candidateDocs = candidatesDocuments[_candidateAddress];
        
        return (
            candidateDocs.profileDataCID,
            candidateDocs.idDocumentCID,
            candidateDocs.supportDocumentCID,
            candidateDocs.financialDocumentCID
        );
    }
    
    function getUserRole(address _userAddress) public view returns (Role) {
        return userRoles[_userAddress];
    }
    
    function getVoterStatus(address _userAddress) public view returns (VoterStatus) {
        require(userRoles[_userAddress] == Role.Voter, "Address is not a voter");
        return voters[_userAddress].status;
    }
    
    function getCandidateStatus(address _userAddress) public view returns (CandidateStatus) {
        require(userRoles[_userAddress] == Role.Candidate, "Address is not a candidate");
        return candidatesBasic[_userAddress].status;
    }
    
    function getAllVoters() public view returns (address[] memory) {
        return voterAddresses;
    }
    
    function getAllCandidates() public view returns (address[] memory) {
        return candidateAddresses;
    }
    
    function getFilteredVoters(VoterStatus _status) public view returns (address[] memory) {
        // Count the number of voters with the given status
        uint count = 0;
        for (uint i = 0; i < voterAddresses.length; i++) {
            if (voters[voterAddresses[i]].status == _status) {
                count++;
            }
        }
        
        // Create an array of the required size
        address[] memory filteredVoters = new address[](count);
        
        // Fill the array
        uint index = 0;
        for (uint i = 0; i < voterAddresses.length; i++) {
            if (voters[voterAddresses[i]].status == _status) {
                filteredVoters[index] = voterAddresses[i];
                index++;
            }
        }
        
        return filteredVoters;
    }
    
    function getFilteredCandidates(CandidateStatus _status) public view returns (address[] memory) {
        // Count the number of candidates with the given status
        uint count = 0;
        for (uint i = 0; i < candidateAddresses.length; i++) {
            if (candidatesBasic[candidateAddresses[i]].status == _status) {
                count++;
            }
        }
        
        // Create an array of the required size
        address[] memory filteredCandidates = new address[](count);
        
        // Fill the array
        uint index = 0;
        for (uint i = 0; i < candidateAddresses.length; i++) {
            if (candidatesBasic[candidateAddresses[i]].status == _status) {
                filteredCandidates[index] = candidateAddresses[i];
                index++;
            }
        }
        
        return filteredCandidates;
    }
    
    function isAdmin(address _address) public view returns (bool) {
        return _address == admin;
    }
    
    function resetUserRole(address _userAddress) public onlyAdmin {
        userRoles[_userAddress] = Role.None;
    }

    // Add a batch reset function to handle multiple addresses efficiently
    function batchResetUserRoles(address[] memory _addresses) public onlyAdmin {
        for (uint i = 0; i < _addresses.length; i++) {
            userRoles[_addresses[i]] = Role.None;
        }
    }
    
    function resetAllRoles() public onlyAdmin {
        // Reset all voters
        for (uint i = 0; i < voterAddresses.length; i++) {
            address voterAddr = voterAddresses[i];
            userRoles[voterAddr] = Role.None;
            if (voters[voterAddr].exists) {
                voters[voterAddr].status = VoterStatus.Rejected;
                voters[voterAddr].statusMessage = "System reset by admin"; // Added message for reset
                voters[voterAddr].exists = false; // Reset the exists flag
            }
        }
        
        // Reset all candidates
        for (uint i = 0; i < candidateAddresses.length; i++) {
            address candAddr = candidateAddresses[i];
            userRoles[candAddr] = Role.None;
            if (candidatesBasic[candAddr].exists) {
                candidatesBasic[candAddr].status = CandidateStatus.Rejected;
                candidatesBasic[candAddr].statusMessage = "System reset by admin"; // Added message for reset
                candidatesBasic[candAddr].exists = false; // Reset the exists flag
            }
        }
        
        // Clear the address arrays
        delete voterAddresses;
        delete candidateAddresses;
    }
}