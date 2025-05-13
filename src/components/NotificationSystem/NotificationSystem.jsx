import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import "./NotificationSystem.css";
import BlockchainService, {
  VoterStatusEnum,
  CandidateStatusEnum,
  EventTypes,
} from "../../services/BlockchainService";

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newNotificationAdded, setNewNotificationAdded] = useState(false);
  const [newNotificationId, setNewNotificationId] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const notificationRef = useRef(null);
  const notificationSound = useRef(null);
  const notificationCheckingRef = useRef(false);
  // Load notifications from storage (account-specific)
  const loadNotificationsFromStorage = useCallback(() => {
    if (!currentAccount) return;

    try {
      // Get notifications for current account
      const accountKey = currentAccount.toLowerCase();
      const userNotificationsKey = `userNotifications_${accountKey}`;
      const storedNotifications = JSON.parse(
        localStorage.getItem(userNotificationsKey) || "[]"
      );

      // Also get global notifications
      const globalNotifications = JSON.parse(
        localStorage.getItem("globalNotifications") || "[]"
      );

      // Combine and sort by timestamp (newest first)
      const allNotifications = [
        ...storedNotifications,
        ...globalNotifications,
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Remove duplicates based on notification IDs
      const uniqueNotifications = [];
      const seenIds = new Set();

      allNotifications.forEach((notification) => {
        if (!seenIds.has(notification.id)) {
          seenIds.add(notification.id);
          uniqueNotifications.push(notification);
        }
      });

      setNotifications(uniqueNotifications);
      setUnreadCount(uniqueNotifications.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error loading notifications:", error);
      // Fallback to empty notifications
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentAccount]);

  // First useEffect: Set up initial account and listeners for account changes
  useEffect(() => {
    // Get initial account from localStorage
    const storedAccount = localStorage.getItem("connectedAccount");
    if (storedAccount) {
      setCurrentAccount(storedAccount.toLowerCase());
    }

    // Function to detect account changes
    const detectAccountChanges = async () => {
      try {
        // Use provider signer to get current account
        if (window.ethereum) {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts && accounts.length > 0) {
            const newAccount = accounts[0].toLowerCase();

            if (newAccount !== currentAccount) {
              console.log(
                `Account changed from ${currentAccount} to ${newAccount}`
              );
              setCurrentAccount(newAccount);
              localStorage.setItem("connectedAccount", newAccount);
            }
          }
        }
      } catch (error) {
        console.error("Error detecting account changes:", error);
      }
    };

    // Initial detection
    detectAccountChanges();

    // Set up MetaMask account change listeners
    if (window.ethereum) {
      const handleMetaMaskAccountChange = (accounts) => {
        if (accounts.length > 0) {
          const newAccount = accounts[0].toLowerCase();
          if (newAccount !== currentAccount) {
            console.log(`MetaMask account changed to ${newAccount}`);
            setCurrentAccount(newAccount);
            localStorage.setItem("connectedAccount", newAccount);
          }
        }
      };

      window.ethereum.on("accountsChanged", handleMetaMaskAccountChange);

      // Clean up
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener(
            "accountsChanged",
            handleMetaMaskAccountChange
          );
        }
      };
    }
  }, [currentAccount]);

  // Effect to load notifications when account changes
  useEffect(() => {
    if (currentAccount) {
      console.log(`Loading notifications for account: ${currentAccount}`);
      loadNotificationsFromStorage();
      // Initial check for notifications
      checkForNotifications();
    }
  }, [currentAccount, loadNotificationsFromStorage]);

  // Main setup for blockchain event listeners
  useEffect(() => {
    // Handle new notifications
    const handleNewNotification = ({ notification }) => {
      // Play sound for truly new notifications (not just updates)
      if (notification && !notification.read) {
        setNewNotificationAdded(true);

        // Save the ID of the new notification for highlighting
        if (notification.id) {
          setNewNotificationId(notification.id);

          // Clear the highlight after 3 seconds
          setTimeout(() => {
            setNewNotificationId(null);
          }, 3000);
        }
      }

      // Reload all notifications to ensure we have the latest
      loadNotificationsFromStorage();
    };

    // Handle notification status changes
    const handleNotificationStatusChange = ({ unreadCount }) => {
      setUnreadCount(unreadCount);
    };

    // Register listeners
    BlockchainService.addEventListener(
      "newNotification",
      handleNewNotification
    );
    BlockchainService.addEventListener(
      "notificationStatusChanged",
      handleNotificationStatusChange
    );

    // Register blockchain-specific event listeners too
    const blockchainEventHandler = (eventType) => (data) => {
      console.log(`Blockchain event detected: ${eventType}`, data);
      // The notifications will be handled by BlockchainService
      // and we'll receive them through the newNotification event

      // Force a check for new notifications
      setTimeout(() => {
        checkForNotifications();
      }, 1000);
    };

    // Add blockchain event listeners
    BlockchainService.addEventListener(
      EventTypes.StatusChange,
      blockchainEventHandler("StatusChange")
    );
    BlockchainService.addEventListener(
      EventTypes.NewElection,
      blockchainEventHandler("NewElection")
    );
    BlockchainService.addEventListener(
      EventTypes.ElectionEnded,
      blockchainEventHandler("ElectionEnded")
    );
    BlockchainService.addEventListener(
      EventTypes.VoteCast,
      blockchainEventHandler("VoteCast")
    );

    // Cleanup
    return () => {
      BlockchainService.removeEventListener(
        "newNotification",
        handleNewNotification
      );
      BlockchainService.removeEventListener(
        "notificationStatusChanged",
        handleNotificationStatusChange
      );
      BlockchainService.removeEventListener(
        EventTypes.StatusChange,
        blockchainEventHandler("StatusChange")
      );
      BlockchainService.removeEventListener(
        EventTypes.NewElection,
        blockchainEventHandler("NewElection")
      );
      BlockchainService.removeEventListener(
        EventTypes.ElectionEnded,
        blockchainEventHandler("ElectionEnded")
      );
      BlockchainService.removeEventListener(
        EventTypes.VoteCast,
        blockchainEventHandler("VoteCast")
      );
    };
  }, [loadNotificationsFromStorage]);

  // Set up periodic checks for notifications
  useEffect(() => {
    if (!currentAccount) return;

    // Check every 30 seconds
    const checkInterval = setInterval(() => {
      checkForNotifications();
    }, 30000);

    return () => {
      clearInterval(checkInterval);
    };
  }, [currentAccount]);

  // Function to check for new notifications
  const checkForNotifications = async () => {
    if (!currentAccount || notificationCheckingRef.current) return;

    // Set flag to prevent concurrent checks
    notificationCheckingRef.current = true;

    try {
      // 1. Check user status changes
      await checkUserStatusChanges();

      // 2. Check for elections and other updates
      await checkForElectionsAndUpdates();

      // 3. Check admin-specific notifications
      await checkAdminNotifications();

      // 4. Reload notifications to get latest
      loadNotificationsFromStorage();
    } catch (error) {
      console.error("Error checking for notifications:", error);
    } finally {
      // Clear flag
      notificationCheckingRef.current = false;
    }
  };

  // Check for user status changes
// Updated checkUserStatusChanges function
const checkUserStatusChanges = async () => {
  try {
    const accountKey = currentAccount.toLowerCase();
    const userInfo = await BlockchainService.getComprehensiveUserInfo(
      accountKey
    );

    // Check voter status changes
    if (userInfo.isVoter) {
      const currentStatus = userInfo.voterStatus;
      const lastStatusKey = `lastVoterStatus_${accountKey}`;
      const lastStatus = localStorage.getItem(lastStatusKey);

      // If status changed and not first-time check
      if (lastStatus !== null && lastStatus !== currentStatus.toString()) {
        console.log(
          `Voter status changed from ${lastStatus} to ${currentStatus}`
        );

        // If approved, notify about approval
        if (currentStatus === VoterStatusEnum.Approved) {
          const statusText = "Your voter registration has been approved!";
          const statusDetails = "You can now participate in elections. Check your profile for details.";
          
          BlockchainService.addLocalNotification({
            type: "status",
            title: "Voter Registration Approved",
            message: statusText,
            details: statusDetails,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Update last status
      localStorage.setItem(lastStatusKey, currentStatus.toString());
    }

    // Check candidate status changes
    if (userInfo.isCandidate) {
      const currentStatus = userInfo.candidateStatus;
      const lastStatusKey = `lastCandidateStatus_${accountKey}`;
      const lastStatus = localStorage.getItem(lastStatusKey);

      // If status changed and not first-time check
      if (lastStatus !== null && lastStatus !== currentStatus.toString()) {
        console.log(
          `Candidate status changed from ${lastStatus} to ${currentStatus}`
        );
        // If approved, notify about approval
        if (currentStatus === CandidateStatusEnum.Approved) {
          const statusText = "Your candidate registration has been approved!";
          const statusDetails = "You can now participate in elections. Check your profile for details.";
          
          BlockchainService.addLocalNotification({
            type: "status",
            title: "Candidate Registration Approved",
            message: statusText,
            details: statusDetails,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Update last status
      localStorage.setItem(lastStatusKey, currentStatus.toString());
    }

    return true;
  } catch (error) {
    console.error("Error checking user status changes:", error);
    return false;
  }
};

  // Check for elections and other updates
  const checkForElectionsAndUpdates = async () => {
    try {
      const accountKey = currentAccount.toLowerCase();
      const userInfo = await BlockchainService.getComprehensiveUserInfo(
        accountKey
      );

      // Only check elections for users who can vote
      if (userInfo.canVote) {
        const lastCheckKey = `lastElectionCheckTime_${accountKey}`;
        const currentTime = Date.now().toString();

        // Get ongoing elections
        const ongoingElections = await BlockchainService.getOngoingElections();

        // Get notified elections
        const notifiedKey = `notifiedElections_${accountKey}`;
        const notifiedElections = JSON.parse(
          localStorage.getItem(notifiedKey) || "[]"
        );

        // Find new elections
        for (const election of ongoingElections) {
          // Skip already notified elections
          if (notifiedElections.includes(election.id)) continue;

          // Create notification for this election
          BlockchainService.addLocalNotification({
            type: "election",
            title: "New Election Available",
            message: `A new election "${election.name}" is now open for voting.`,
            details:"Navigate to Ongoing Elections to view election details and cast your vote.",
            electionId: election.id,
            timestamp: new Date().toISOString(),
          });

          // Add to notified list
          notifiedElections.push(election.id);
        }

        // Save updated notified elections
        localStorage.setItem(notifiedKey, JSON.stringify(notifiedElections));

        // Update last check time
        localStorage.setItem(lastCheckKey, currentTime);
      }

      return true;
    } catch (error) {
      console.error("Error checking for elections:", error);
      return false;
    }
  };

  // Check for admin-specific notifications
  // Replace the existing checkAdminNotifications function with this improved version
// Updated checkAdminNotifications function
const checkAdminNotifications = async () => {
  try {
    // Only proceed if user is an admin
    const isAdmin = await BlockchainService.isAdmin();
    if (!isAdmin) return true;

    const accountKey = currentAccount.toLowerCase();

    // Check for pending voters and candidates
    const pendingVoters = await BlockchainService.getVotersByStatus(
      VoterStatusEnum.Pending
    );
    const pendingCandidates = await BlockchainService.getCandidatesByStatus(
      CandidateStatusEnum.Pending
    );

    // Get last known counts
    const lastVotersKey = `lastPendingVoterCount_${accountKey}`;
    const lastCandidatesKey = `lastPendingCandidateCount_${accountKey}`;

    const lastVoterCount = parseInt(
      localStorage.getItem(lastVotersKey) || "0"
    );
    const lastCandidateCount = parseInt(
      localStorage.getItem(lastCandidatesKey) || "0"
    );

    // Calculate new registrations
    const newVoters = pendingVoters.length - lastVoterCount;
    const newCandidates = pendingCandidates.length - lastCandidateCount;

    // Get details for new voters if available
    if (newVoters > 0) {
      // Get the most recent pending voters (the newly registered ones)
      const recentVoters = pendingVoters.slice(0, newVoters);
      
      // Create individual notifications for each new voter
      for (const voterAddress of recentVoters) {
        try {
          // Get voter details to include their name
          const voterDetails = await BlockchainService.getVoterDetails(voterAddress);
          const voterName = voterDetails.fullName || "Unknown Voter";
          
          // Check if this is a resubmission by checking rejection count
          const rejectionCount = await BlockchainService.getRejectionCountForVoter(voterAddress);
          const isResubmission = rejectionCount > 0;
          
          // Create message with attempt number if it's a resubmission
          let message = "";
          if (isResubmission) {
            message = `${voterName} has resubmitted their voter registration after being rejected (Attempt ${rejectionCount})`;
          } else {
            message = `${voterName} has submitted a new voter registration`;
          }
          
          // Create notification with the improved format
          BlockchainService.addLocalNotification({
            type: "admin",
            title: "Voter Registration",
            message: message,
            details: `The application is pending review. Address: ${voterAddress.substring(
              0,
              6
            )}...${voterAddress.slice(-4)}`,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error("Error creating notification for voter:", error);
          
          // Fallback notification if details can't be fetched
          BlockchainService.addLocalNotification({
            type: "admin",
            title: "Voter Registration",
            message: "A new voter registration has been submitted",
            details: `The application is pending review. Address: ${voterAddress.substring(
              0,
              6
            )}...${voterAddress.slice(-4)}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // Get details for new candidates if available
    if (newCandidates > 0) {
      // Get the most recent pending candidates (the newly registered ones)
      const recentCandidates = pendingCandidates.slice(0, newCandidates);
      
      // Create individual notifications for each new candidate
      for (const candidateAddress of recentCandidates) {
        try {
          // Get candidate details to include their name
          const candidateDetails = await BlockchainService.getCandidateDetails(candidateAddress);
          const candidateName = candidateDetails.fullName || "Unknown Candidate";
          
          // Check if this is a resubmission by checking rejection count
          const rejectionCount = await BlockchainService.getRejectionCountForCandidate(candidateAddress);
          const isResubmission = rejectionCount > 0;
          
          // Create message with attempt number if it's a resubmission
          let message = "";
          if (isResubmission) {
            message = `${candidateName} has resubmitted their candidate registration after being rejected (Attempt ${rejectionCount})`;
          } else {
            message = `${candidateName} has submitted a new candidate registration`;
          }
          
          // Create notification with the improved format
          BlockchainService.addLocalNotification({
            type: "admin",
            title: "Candidate Registration",
            message: message,
            details: `The application is pending review. Address: ${candidateAddress.substring(
              0,
              6
            )}...${candidateAddress.slice(-4)}`,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error("Error creating notification for candidate:", error);
          
          // Fallback notification if details can't be fetched
          BlockchainService.addLocalNotification({
            type: "admin",
            title: "Candidate Registration",
            message: "A new candidate registration has been submitted",
            details: `The application is pending review. Address: ${candidateAddress.substring(
              0,
              6
            )}...${candidateAddress.slice(-4)}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // Update counts
    localStorage.setItem(lastVotersKey, pendingVoters.length.toString());
    localStorage.setItem(
      lastCandidatesKey,
      pendingCandidates.length.toString()
    );

    return true;
  } catch (error) {
    console.error("Error checking admin notifications:", error);
    return false;
  }
};

  // Effect to play sound for new notifications
  useEffect(() => {
    if (newNotificationAdded && notificationSound.current) {
      notificationSound.current.play().catch((error) => {
        // Browser may block autoplay
        console.log("Could not play notification sound:", error);
      });
      setNewNotificationAdded(false);
    }
  }, [newNotificationAdded]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);

    // If opening notifications and there are unread notifications,
    // update the unread counter in the UI even before marking them as read
    if (!showNotifications && unreadCount > 0) {
      // Only update UI counter without actually marking notifications as read yet
      setUnreadCount(0);
    }
  };

  const markAsRead = (id) => {
    if (!currentAccount) return;

    const accountKey = currentAccount.toLowerCase();
    const userNotificationsKey = `userNotifications_${accountKey}`;

    // Update in local storage
    try {
      // Check user-specific notifications
      let userNotifications = JSON.parse(
        localStorage.getItem(userNotificationsKey) || "[]"
      );
      let found = false;

      // Update if found in user notifications
      userNotifications = userNotifications.map((notification) => {
        if (notification.id === id) {
          found = true;
          return { ...notification, read: true };
        }
        return notification;
      });

      // Save back user notifications
      localStorage.setItem(
        userNotificationsKey,
        JSON.stringify(userNotifications)
      );

      // If not found, check global notifications
      if (!found) {
        let globalNotifications = JSON.parse(
          localStorage.getItem("globalNotifications") || "[]"
        );

        globalNotifications = globalNotifications.map((notification) => {
          if (notification.id === id) {
            return { ...notification, read: true };
          }
          return notification;
        });

        // Save back global notifications
        localStorage.setItem(
          "globalNotifications",
          JSON.stringify(globalNotifications)
        );
      }

      // Update UI
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );

      // Update unread count
      const updatedUnreadCount = notifications.filter(
        (n) => !n.read && n.id !== id
      ).length;
      setUnreadCount(updatedUnreadCount);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = () => {
    if (!currentAccount) return;

    const accountKey = currentAccount.toLowerCase();
    const userNotificationsKey = `userNotifications_${accountKey}`;

    try {
      // Update user-specific notifications
      let userNotifications = JSON.parse(
        localStorage.getItem(userNotificationsKey) || "[]"
      );
      userNotifications = userNotifications.map((notification) => ({
        ...notification,
        read: true,
      }));
      localStorage.setItem(
        userNotificationsKey,
        JSON.stringify(userNotifications)
      );

      // Also mark global notifications as read for this user
      let globalNotifications = JSON.parse(
        localStorage.getItem("globalNotifications") || "[]"
      );
      globalNotifications = globalNotifications.map((notification) => ({
        ...notification,
        read: true,
      }));
      localStorage.setItem(
        "globalNotifications",
        JSON.stringify(globalNotifications)
      );

      // Update UI
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const clearAllNotifications = () => {
    if (!currentAccount) return;

    const accountKey = currentAccount.toLowerCase();
    const userNotificationsKey = `userNotifications_${accountKey}`;

    try {
      // Clear user notifications
      localStorage.setItem(userNotificationsKey, JSON.stringify([]));

      // Don't clear global notifications, just mark them as read
      let globalNotifications = JSON.parse(
        localStorage.getItem("globalNotifications") || "[]"
      );
      globalNotifications = globalNotifications.map((notification) => ({
        ...notification,
        read: true,
      }));
      localStorage.setItem(
        "globalNotifications",
        JSON.stringify(globalNotifications)
      );

      // Update UI
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "status":
        return "🔔";
      case "election":
        return "🗳️";
      case "election_ended":
        return "🏁";
      case "vote":
        return "✅";
      case "admin":
        return "🚨";
      case "error":
        return "⚠️";
      default:
        return "📝";
    }
  };

  return (
    <div className="notification-system" ref={notificationRef}>
      <div
        className={`notification-icon ${
          unreadCount > 0 ? "has-notifications" : ""
        }`}
        onClick={toggleNotifications}
        data-testid="notification-bell"
      >
        <i className="bell-icon"></i>
        {unreadCount > 0 && (
          <div className="notification-badge">{unreadCount}</div>
        )}
      </div>

      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <div className="notification-actions">
              {notifications.length > 0 && (
                <>
                  <button className="mark-all-read" onClick={markAllAsRead}>
                    Mark all as read
                  </button>
                  <button className="clear-all" onClick={clearAllNotifications}>
                    Clear all
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="notification-content">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    notification.read ? "read" : "unread"
                  } ${notification.type || ""} ${
                    newNotificationId === notification.id
                      ? "new-notification"
                      : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="notification-icon-wrapper">
                    <div className="notification-type-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  <div className="notification-content-wrapper">
                    <div className="notification-title">
                      <span>{notification.title}</span>
                      <span className="notification-time">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    {notification.details && (
                      <div className="notification-details">
                        {notification.details}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-notifications">No notifications</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;
