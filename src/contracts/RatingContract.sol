// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RatingSystem {
    address public owner;
    uint256 public ratingCount;
    
    struct Rating {
        uint256 id;
        address author;
        uint8 stars; // 1-5 stars
        string comment;
        uint256 timestamp;
        bool deleted;
    }
    
    mapping(uint256 => Rating) public ratings;
    mapping(address => uint256[]) public userRatings;
    
    event RatingCreated(uint256 indexed ratingId, address indexed author, uint8 stars, string comment, uint256 timestamp);
    event RatingDeleted(uint256 indexed ratingId);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }
    
    function createRating(uint8 _stars, string memory _comment) public {
        require(_stars >= 1 && _stars <= 5, "Stars must be between 1 and 5");
        require(bytes(_comment).length > 0, "Comment cannot be empty");
        
        ratingCount++;
        ratings[ratingCount] = Rating({
            id: ratingCount,
            author: msg.sender,
            stars: _stars,
            comment: _comment,
            timestamp: block.timestamp,
            deleted: false
        });
        
        userRatings[msg.sender].push(ratingCount);
        
        emit RatingCreated(ratingCount, msg.sender, _stars, _comment, block.timestamp);
    }
    
    function deleteRating(uint256 _ratingId) public onlyOwner {
        require(_ratingId > 0 && _ratingId <= ratingCount, "Rating does not exist");
        require(!ratings[_ratingId].deleted, "Rating already deleted");
        
        ratings[_ratingId].deleted = true;
        
        emit RatingDeleted(_ratingId);
    }
    
    function getRating(uint256 _ratingId) public view returns (
        uint256 id,
        address author,
        uint8 stars,
        string memory comment,
        uint256 timestamp,
        bool deleted
    ) {
        require(_ratingId > 0 && _ratingId <= ratingCount, "Rating does not exist");
        
        Rating storage rating = ratings[_ratingId];
        return (
            rating.id,
            rating.author,
            rating.stars,
            rating.comment,
            rating.timestamp,
            rating.deleted
        );
    }
    
    function getUserRatings(address _user) public view returns (uint256[] memory) {
        return userRatings[_user];
    }
    
    function getAllRatings() public view returns (uint256[] memory) {
        uint256[] memory allRatings = new uint256[](ratingCount);
        for (uint256 i = 1; i <= ratingCount; i++) {
            allRatings[i-1] = i;
        }
        return allRatings;
    }
    
    function getAverageRating() public view returns (uint256) {
        uint256 totalStars = 0;
        uint256 activeRatings = 0;
        
        for (uint256 i = 1; i <= ratingCount; i++) {
            if (!ratings[i].deleted) {
                totalStars += ratings[i].stars;
                activeRatings++;
            }
        }
        
        if (activeRatings == 0) {
            return 0;
        }
        
        // Return average multiplied by 10 for one decimal place precision
        return (totalStars * 10) / activeRatings;
    }
}