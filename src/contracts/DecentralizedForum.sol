// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DecentralizedForum {
    address public owner;
    uint256 public postCount;
    
    struct Post {
        uint256 id;
        address author;
        string content;
        uint256 timestamp;
        bool deleted;
        uint256[] replies;
    }
    
    struct Reply {
        uint256 id;
        uint256 postId;
        address author;
        string content;
        uint256 timestamp;
        bool deleted;
    }
    
    mapping(uint256 => Post) public posts;
    mapping(uint256 => Reply) public replies;
    uint256 public replyCount;
    
    event PostCreated(uint256 indexed postId, address indexed author, string content, uint256 timestamp);
    event ReplyCreated(uint256 indexed replyId, uint256 indexed postId, address indexed author, string content, uint256 timestamp);
    event PostDeleted(uint256 indexed postId);
    event ReplyDeleted(uint256 indexed replyId);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }
    
    function createPost(string memory _content) public {
        require(bytes(_content).length > 0, "Content cannot be empty");
        
        postCount++;
        posts[postCount] = Post({
            id: postCount,
            author: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            deleted: false,
            replies: new uint256[](0)
        });
        
        emit PostCreated(postCount, msg.sender, _content, block.timestamp);
    }
    
    function createReply(uint256 _postId, string memory _content) public {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        require(!posts[_postId].deleted, "Cannot reply to a deleted post");
        require(bytes(_content).length > 0, "Content cannot be empty");
        
        replyCount++;
        replies[replyCount] = Reply({
            id: replyCount,
            postId: _postId,
            author: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            deleted: false
        });
        
        posts[_postId].replies.push(replyCount);
        
        emit ReplyCreated(replyCount, _postId, msg.sender, _content, block.timestamp);
    }
    
    function deletePost(uint256 _postId) public onlyOwner {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        require(!posts[_postId].deleted, "Post already deleted");
        
        posts[_postId].deleted = true;
        
        emit PostDeleted(_postId);
    }
    
    function deleteReply(uint256 _replyId) public onlyOwner {
        require(_replyId > 0 && _replyId <= replyCount, "Reply does not exist");
        require(!replies[_replyId].deleted, "Reply already deleted");
        
        replies[_replyId].deleted = true;
        
        emit ReplyDeleted(_replyId);
    }
    
    function getPost(uint256 _postId) public view returns (
        uint256 id,
        address author,
        string memory content,
        uint256 timestamp,
        bool deleted,
        uint256[] memory replyIds
    ) {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        
        Post storage post = posts[_postId];
        return (
            post.id,
            post.author,
            post.content,
            post.timestamp,
            post.deleted,
            post.replies
        );
    }
    
    function getReply(uint256 _replyId) public view returns (
        uint256 id,
        uint256 postId,
        address author,
        string memory content,
        uint256 timestamp,
        bool deleted
    ) {
        require(_replyId > 0 && _replyId <= replyCount, "Reply does not exist");
        
        Reply storage reply = replies[_replyId];
        return (
            reply.id,
            reply.postId,
            reply.author,
            reply.content,
            reply.timestamp,
            reply.deleted
        );
    }
    
    function getPostReplies(uint256 _postId) public view returns (uint256[] memory) {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        return posts[_postId].replies;
    }
    
    function getAllPosts() public view returns (uint256[] memory) {
        uint256[] memory allPosts = new uint256[](postCount);
        for (uint256 i = 1; i <= postCount; i++) {
            allPosts[i-1] = i;
        }
        return allPosts;
    }
}