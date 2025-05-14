import { ethers } from "ethers";
import axios from "axios";

// Import ABIs from JSON files
import electionContractABI from "../contracts/electionContractABI.json";
import votingContractABI from "../contracts/votingContractABI.json";

// Contract addresses
const electionContractAddress = "0xa88c320772df205ddf49fc64c40f6ed159fbc8c0";
const votingContractAddress = "0xf4dd23ddbe648f2234ab64f4195b8d32b8c78c13";

// Pinata Configuration from environment variables
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;
const PINATA_GATEWAY =
  import.meta.env.VITE_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

// Updated enums
export const VoterStatusEnum = {
  Pending: 0,
  Approved: 1,
  Rejected: 2,
};

export const CandidateStatusEnum = {
  Pending: 0,
  Approved: 1,
  Rejected: 2,
};

export const RoleEnum = {
  None: 0,
  Voter: 1,
  Candidate: 2,
};

export const ElectionStateEnum = {
  NotStarted: 0,
  Ongoing: 1,
  Ended: 2,
};

// Event names for notification system
export const EventTypes = {
  StatusChange: "statusChange",
  NewElection: "newElection",
  ElectionEnded: "electionEnded",
  VoteCast: "voteCast",
  AccountChanged: "accountChanged",
};

// Notification Manager Class - handles all notification-related operations
class NotificationManager {
  constructor() {
    this.eventListeners = new Map();
  }

  // Add event listener for notification events
  addEventListener(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(callback);
  }

  // Remove event listener
  removeEventListener(eventType, callback) {
    if (this.eventListeners.has(eventType)) {
      const listeners = this.eventListeners.get(eventType);
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Trigger event for listeners
  triggerEvent(eventType, data) {
    if (this.eventListeners.has(eventType)) {
      const listeners = this.eventListeners.get(eventType);
      for (const callback of listeners) {
        callback(data);
      }
    }
  }

  // Get current user account
  getCurrentAccount() {
    try {
      return localStorage.getItem("connectedAccount")?.toLowerCase() || null;
    } catch (error) {
      console.error("Error getting current account:", error);
      return null;
    }
  }

  // Add notification that's specific to the current user
  addLocalNotification(notification) {
    try {
      const currentAccount = this.getCurrentAccount();
      if (!currentAccount) {
        // Store in global notifications if no account is available
        return this.addGlobalNotification(notification);
      }

      // Generate a unique ID for the notification
      notification.id = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      notification.read = false;
      notification.timestamp =
        notification.timestamp || new Date().toISOString();
      notification.accountId = currentAccount; // Tag with account ID for tracking

      // Get user-specific notifications
      const userNotificationsKey = `userNotifications_${currentAccount}`;
      const existingNotifications = JSON.parse(
        localStorage.getItem(userNotificationsKey) || "[]"
      );

      // Check for duplicate notifications in the last hour (prevents spam)
      const lastHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const isDuplicate = existingNotifications.some(
        (n) =>
          n.type === notification.type &&
          n.title === notification.title &&
          n.message === notification.message &&
          n.timestamp > lastHour
      );

      if (isDuplicate) {
        console.log("Skipping duplicate notification:", notification.title);
        return null;
      }

      // Add new notification at the beginning
      existingNotifications.unshift(notification);

      // Limit to 50 notifications
      const limitedNotifications = existingNotifications.slice(0, 50);

      // Save back to localStorage
      localStorage.setItem(
        userNotificationsKey,
        JSON.stringify(limitedNotifications)
      );

      // Count unread notifications and trigger notification event
      const unreadCount = limitedNotifications.filter((n) => !n.read).length;
      this.triggerEvent("newNotification", { notification, unreadCount });

      return notification.id;
    } catch (error) {
      console.error("Error adding local notification:", error);
      return null;
    }
  }

  // Add notification for a specific user account
  addNotificationForUser(userAddress, notification) {
    try {
      if (!userAddress) {
        console.error("Cannot add notification for undefined user address");
        return null;
      }

      const targetAccount = userAddress.toLowerCase();

      // Generate a unique ID for the notification
      notification.id = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      notification.read = false;
      notification.timestamp =
        notification.timestamp || new Date().toISOString();
      notification.accountId = targetAccount; // Tag with account ID for tracking

      // Store in user-specific notifications
      const userNotificationsKey = `userNotifications_${targetAccount}`;
      const existingNotifications = JSON.parse(
        localStorage.getItem(userNotificationsKey) || "[]"
      );

      // Check for duplicate notifications in the last hour
      const lastHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const isDuplicate = existingNotifications.some(
        (n) =>
          n.type === notification.type &&
          n.title === notification.title &&
          n.message === notification.message &&
          n.timestamp > lastHour
      );

      if (isDuplicate) {
        console.log(
          "Skipping duplicate notification for user:",
          notification.title
        );
        return null;
      }

      // Add new notification at the beginning
      existingNotifications.unshift(notification);

      // Limit to 50 notifications
      const limitedNotifications = existingNotifications.slice(0, 50);

      // Save back to localStorage
      localStorage.setItem(
        userNotificationsKey,
        JSON.stringify(limitedNotifications)
      );

      // If this is the current user, also trigger the notification event
      const currentAccount = this.getCurrentAccount();
      if (currentAccount === targetAccount) {
        const unreadCount = limitedNotifications.filter((n) => !n.read).length;
        this.triggerEvent("newNotification", { notification, unreadCount });
      }

      return notification.id;
    } catch (error) {
      console.error("Error adding notification for user:", error);
      return null;
    }
  }

  // Add global notification (visible to all users)
  addGlobalNotification(notification) {
    try {
      // Generate a unique ID for the notification
      notification.id = `global-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      notification.read = false;
      notification.timestamp =
        notification.timestamp || new Date().toISOString();
      notification.global = true; // Mark as global

      // Get global notifications
      const existingNotifications = JSON.parse(
        localStorage.getItem("globalNotifications") || "[]"
      );

      // Check for duplicate notifications in the last hour
      const lastHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const isDuplicate = existingNotifications.some(
        (n) =>
          n.type === notification.type &&
          n.title === notification.title &&
          n.message === notification.message &&
          n.timestamp > lastHour
      );

      if (isDuplicate) {
        console.log(
          "Skipping duplicate global notification:",
          notification.title
        );
        return null;
      }

      // Add new notification at the beginning
      existingNotifications.unshift(notification);

      // Limit to 50 global notifications
      const limitedNotifications = existingNotifications.slice(0, 50);

      // Save back to localStorage
      localStorage.setItem(
        "globalNotifications",
        JSON.stringify(limitedNotifications)
      );

      // Trigger notification event
      this.triggerEvent("newNotification", { notification, unreadCount: 1 });

      return notification.id;
    } catch (error) {
      console.error("Error adding global notification:", error);
      return null;
    }
  }

  // Get all notifications for current user
  getNotifications() {
    try {
      const currentAccount = this.getCurrentAccount();
      if (!currentAccount) {
        // Return only global notifications if no account is available
        return JSON.parse(localStorage.getItem("globalNotifications") || "[]");
      }

      // Get user-specific notifications
      const userKey = `userNotifications_${currentAccount}`;
      const userNotifications = JSON.parse(
        localStorage.getItem(userKey) || "[]"
      );

      // Get global notifications
      const globalNotifications = JSON.parse(
        localStorage.getItem("globalNotifications") || "[]"
      );

      // Get read global notifications for this user
      const readGlobalKey = `readGlobalNotifications_${currentAccount}`;
      const readGlobalIds = JSON.parse(
        localStorage.getItem(readGlobalKey) || "[]"
      );

      // Mark global notifications as read if they're in the read list
      const markedGlobalNotifications = globalNotifications.map(
        (notification) => {
          if (readGlobalIds.includes(notification.id)) {
            return { ...notification, read: true };
          }
          return notification;
        }
      );

      // Combine and sort by timestamp (newest first)
      const allNotifications = [
        ...userNotifications,
        ...markedGlobalNotifications,
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Remove duplicates (prefer user-specific over global)
      const uniqueNotifications = [];
      const seenIds = new Set();

      for (const notification of allNotifications) {
        if (!seenIds.has(notification.id)) {
          seenIds.add(notification.id);
          uniqueNotifications.push(notification);
        }
      }

      return uniqueNotifications;
    } catch (error) {
      console.error("Error getting notifications:", error);
      return [];
    }
  }

  // Get unread notification count
  getUnreadNotificationCount() {
    try {
      const notifications = this.getNotifications();
      return notifications.filter((n) => !n.read).length;
    } catch (error) {
      console.error("Error getting unread notification count:", error);
      return 0;
    }
  }

  // Mark a specific notification as read
  markNotificationAsRead(notificationId) {
    try {
      if (!notificationId) return false;

      const currentAccount = this.getCurrentAccount();
      if (!currentAccount) return false;

      // Check user-specific notifications
      const userKey = `userNotifications_${currentAccount}`;
      let userNotifications = JSON.parse(localStorage.getItem(userKey) || "[]");
      let found = false;

      // Update user notifications
      userNotifications = userNotifications.map((notification) => {
        if (notification.id === notificationId) {
          found = true;
          return { ...notification, read: true };
        }
        return notification;
      });

      // Save user notifications
      localStorage.setItem(userKey, JSON.stringify(userNotifications));

      // If not found in user notifications, check global
      if (!found) {
        // Mark global notification as read for this user
        const readGlobalKey = `readGlobalNotifications_${currentAccount}`;
        let readGlobalIds = JSON.parse(
          localStorage.getItem(readGlobalKey) || "[]"
        );

        // Add this notification ID to the read list if not already there
        if (!readGlobalIds.includes(notificationId)) {
          readGlobalIds.push(notificationId);
          localStorage.setItem(readGlobalKey, JSON.stringify(readGlobalIds));
        }
      }

      // Trigger event with updated unread count
      const unreadCount = this.getUnreadNotificationCount();
      this.triggerEvent("notificationStatusChanged", { unreadCount });

      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  // Mark all notifications as read for current user
  markAllNotificationsAsRead() {
    try {
      const currentAccount = this.getCurrentAccount();
      if (!currentAccount) return false;

      // Update user-specific notifications
      const userKey = `userNotifications_${currentAccount}`;
      let userNotifications = JSON.parse(localStorage.getItem(userKey) || "[]");
      userNotifications = userNotifications.map((n) => ({ ...n, read: true }));
      localStorage.setItem(userKey, JSON.stringify(userNotifications));

      // Mark all global notifications as read for this user
      const allGlobalNotifications = JSON.parse(
        localStorage.getItem("globalNotifications") || "[]"
      );
      const readGlobalKey = `readGlobalNotifications_${currentAccount}`;
      const readGlobalIds = allGlobalNotifications.map((n) => n.id);
      localStorage.setItem(readGlobalKey, JSON.stringify(readGlobalIds));

      // Trigger event
      this.triggerEvent("notificationStatusChanged", { unreadCount: 0 });

      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }

  // Clear all notifications for current user
  clearAllNotifications() {
    try {
      const currentAccount = this.getCurrentAccount();
      if (!currentAccount) return false;

      // Clear user-specific notifications
      const userKey = `userNotifications_${currentAccount}`;
      localStorage.setItem(userKey, JSON.stringify([]));

      // Mark all global notifications as read for this user
      const allGlobalNotifications = JSON.parse(
        localStorage.getItem("globalNotifications") || "[]"
      );
      const readGlobalKey = `readGlobalNotifications_${currentAccount}`;
      const readGlobalIds = allGlobalNotifications.map((n) => n.id);
      localStorage.setItem(readGlobalKey, JSON.stringify(readGlobalIds));

      // Trigger event
      this.triggerEvent("notificationStatusChanged", { unreadCount: 0 });

      return true;
    } catch (error) {
      console.error("Error clearing notifications:", error);
      return false;
    }
  }

  // Reset notification tracking for the current user
  // Reset notification tracking for the current user
  clearNotificationTracking() {
    try {
      const message = "The System has been reset by the administrator.";

      // Clear all localStorage data
      localStorage.clear();

      // Add notification about the reset with the original message
      this.addLocalNotification({
        type: "system",
        title: "Notification System Reset",
        message: message,
        timestamp: new Date().toISOString(),
      });

      // Force page reload to ensure clean state
      window.location.reload();

      return true;
    } catch (error) {
      console.error("Error clearing notification tracking:", error);
      return false;
    }
  }

  // Troubleshoot notification system (for user support)
  troubleshootNotifications() {
    try {
      const currentAccount = this.getCurrentAccount();
      if (!currentAccount) {
        return {
          success: false,
          message:
            "No connected account found. Please connect your wallet first.",
        };
      }

      // Collect diagnostic information
      const diagnosticInfo = {
        account: currentAccount,
        userNotificationsCount: 0,
        globalNotificationsCount: 0,
        unreadCount: 0,
        storageKeys: {},
        browserInfo: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };

      // Get notification counts
      const userKey = `userNotifications_${currentAccount}`;
      const userNotifications = JSON.parse(
        localStorage.getItem(userKey) || "[]"
      );
      const globalNotifications = JSON.parse(
        localStorage.getItem("globalNotifications") || "[]"
      );

      diagnosticInfo.userNotificationsCount = userNotifications.length;
      diagnosticInfo.globalNotificationsCount = globalNotifications.length;
      diagnosticInfo.unreadCount = this.getUnreadNotificationCount();

      // Get storage info
      const relevantKeys = [
        userKey,
        `readGlobalNotifications_${currentAccount}`,
        `lastVoterStatus_${currentAccount}`,
        `lastCandidateStatus_${currentAccount}`,
        `lastElectionCheckTime_${currentAccount}`,
        `notifiedElections_${currentAccount}`,
        `lastPendingVoterCount_${currentAccount}`,
        `lastPendingCandidateCount_${currentAccount}`,
        `processedEvents_${currentAccount}`,
        "globalNotifications",
        "connectedAccount",
      ];

      relevantKeys.forEach((key) => {
        const value = localStorage.getItem(key);
        diagnosticInfo.storageKeys[key] = value
          ? `Exists (${value.length} chars)`
          : "Not found";
      });

      // Log diagnostic info
      console.log("Notification System Diagnostics:", diagnosticInfo);

      // Reset notification tracking
      this.clearNotificationTracking();

      return {
        success: true,
        message:
          "Notification system has been reset. Diagnostic information has been logged to the console.",
        diagnostics: diagnosticInfo,
      };
    } catch (error) {
      console.error("Error troubleshooting notifications:", error);
      return {
        success: false,
        message: "Error troubleshooting notifications: " + error.message,
      };
    }
  }
}

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.electionContract = null;
    this.votingContract = null;
    this.initialized = false;

    // Initialize the notification manager
    this.notificationManager = new NotificationManager();
  }

  // Get rejection count for a voter
  async getRejectionCountForVoter(address) {
    try {
      const accountKey = address.toLowerCase();
      const rejectionCountKey = `voterRejectionCount_${accountKey}`;
      const rejectionCount = parseInt(
        localStorage.getItem(rejectionCountKey) || "0"
      );
      return rejectionCount;
    } catch (error) {
      console.error("Error getting voter rejection count:", error);
      return 0;
    }
  }

  // Get rejection count for a candidate
  async getRejectionCountForCandidate(address) {
    try {
      const accountKey = address.toLowerCase();
      const rejectionCountKey = `candidateRejectionCount_${accountKey}`;
      const rejectionCount = parseInt(
        localStorage.getItem(rejectionCountKey) || "0"
      );
      return rejectionCount;
    } catch (error) {
      console.error("Error getting candidate rejection count:", error);
      return 0;
    }
  }

  // Increment rejection count for a voter
  async incrementRejectionCountForVoter(address) {
    try {
      const accountKey = address.toLowerCase();
      const rejectionCountKey = `voterRejectionCount_${accountKey}`;
      const currentCount = parseInt(
        localStorage.getItem(rejectionCountKey) || "0"
      );
      const newCount = currentCount + 1;
      localStorage.setItem(rejectionCountKey, newCount.toString());
      return newCount;
    } catch (error) {
      console.error("Error incrementing voter rejection count:", error);
      return 0;
    }
  }

  // Increment rejection count for a candidate
  async incrementRejectionCountForCandidate(address) {
    try {
      const accountKey = address.toLowerCase();
      const rejectionCountKey = `candidateRejectionCount_${accountKey}`;
      const currentCount = parseInt(
        localStorage.getItem(rejectionCountKey) || "0"
      );
      const newCount = currentCount + 1;
      localStorage.setItem(rejectionCountKey, newCount.toString());
      return newCount;
    } catch (error) {
      console.error("Error incrementing candidate rejection count:", error);
      return 0;
    }
  }

  // Reset rejection count for voter (use when approved)
  async resetRejectionCountForVoter(address) {
    try {
      const accountKey = address.toLowerCase();
      const rejectionCountKey = `voterRejectionCount_${accountKey}`;
      localStorage.setItem(rejectionCountKey, "0");
      return true;
    } catch (error) {
      console.error("Error resetting voter rejection count:", error);
      return false;
    }
  }

  // Reset rejection count for candidate (use when approved)
  async resetRejectionCountForCandidate(address) {
    try {
      const accountKey = address.toLowerCase();
      const rejectionCountKey = `candidateRejectionCount_${accountKey}`;
      localStorage.setItem(rejectionCountKey, "0");
      return true;
    } catch (error) {
      console.error("Error resetting candidate rejection count:", error);
      return false;
    }
  }

  // Check if this is a resubmission for voter
  async isVoterResubmission(address) {
    try {
      const rejectionCount = await this.getRejectionCountForVoter(address);
      return rejectionCount > 0;
    } catch (error) {
      console.error("Error checking if voter is resubmitting:", error);
      return false;
    }
  }

  // Check if this is a resubmission for candidate
  async isCandidateResubmission(address) {
    try {
      const rejectionCount = await this.getRejectionCountForCandidate(address);
      return rejectionCount > 0;
    } catch (error) {
      console.error("Error checking if candidate is resubmitting:", error);
      return false;
    }
  }

  // Add event listener (delegate to notification manager)
  addEventListener(eventType, callback) {
    this.notificationManager.addEventListener(eventType, callback);
  }

  // Remove event listener (delegate to notification manager)
  removeEventListener(eventType, callback) {
    this.notificationManager.removeEventListener(eventType, callback);
  }

  // Trigger event (delegate to notification manager)
  triggerEvent(eventType, data) {
    this.notificationManager.triggerEvent(eventType, data);
  }

  // Check if contract addresses have changed
  checkContractAddressesChanged() {
    try {
      const storedVotingAddress = localStorage.getItem(
        "currentVotingContractAddress"
      );
      const votingChanged =
        storedVotingAddress && storedVotingAddress !== votingContractAddress;
      return votingChanged;
    } catch (error) {
      console.error("Error checking contract addresses:", error);
      return false;
    }
  }

  // Store current contract addresses
  storeContractAddresses() {
    try {
      localStorage.setItem(
        "currentVotingContractAddress",
        votingContractAddress
      );
    } catch (error) {
      console.error("Error storing contract addresses:", error);
    }
  }

  // Clear notification tracking
  clearNotificationTracking() {
    return this.notificationManager.clearNotificationTracking();
  }

  // Troubleshoot notifications
  troubleshootNotifications() {
    return this.notificationManager.troubleshootNotifications();
  }

  // Get voter status message (for rejected applications)
  async getVoterStatusMessage(address) {
    await this.initialize();

    try {
      return await this.electionContract.getVoterStatusMessage(address);
    } catch (error) {
      console.error("Error getting voter status message:", error);
      return "";
    }
  }

  // Get candidate status message (for rejected applications)
  async getCandidateStatusMessage(address) {
    await this.initialize();

    try {
      return await this.electionContract.getCandidateStatusMessage(address);
    } catch (error) {
      console.error("Error getting candidate status message:", error);
      return "";
    }
  }

  // Load processed events for current account
  loadProcessedEvents() {
    try {
      const currentAccount = localStorage
        .getItem("connectedAccount")
        ?.toLowerCase();
      if (!currentAccount) return new Set();

      const key = `processedEvents_${currentAccount}`;
      const storedEvents = localStorage.getItem(key);
      return storedEvents ? new Set(JSON.parse(storedEvents)) : new Set();
    } catch (error) {
      console.error("Error loading processed events:", error);
      return new Set();
    }
  }

  // Update processed events
  updateProcessedEvents(eventsSet) {
    try {
      const currentAccount = localStorage
        .getItem("connectedAccount")
        ?.toLowerCase();
      if (!currentAccount) return;

      const key = `processedEvents_${currentAccount}`;
      const eventsArray = Array.from(eventsSet);
      localStorage.setItem(key, JSON.stringify(eventsArray));
    } catch (error) {
      console.error("Error storing processed events:", error);
    }
  }

  async initialize() {
    if (this.initialized) return;

    // Check if contract addresses have changed
    if (this.checkContractAddressesChanged()) {
      this.clearNotificationTracking();
      this.initialized = false; // Force reinitialization
    }

    // Store current addresses
    this.storeContractAddresses();

    if (window.ethereum) {
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });

        // Create a provider and signer
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();

        // Get current account and store it
        const currentAccount = await this.signer.getAddress();
        localStorage.setItem("connectedAccount", currentAccount.toLowerCase());

        // Create contract instances
        this.electionContract = new ethers.Contract(
          electionContractAddress,
          electionContractABI,
          this.signer
        );

        this.votingContract = new ethers.Contract(
          votingContractAddress,
          votingContractABI,
          this.signer
        );

        this.initialized = true;

        // Set up event listeners for status changes
        this.setupContractEventListeners();

        // Set up account change listener
        this.setupAccountChangeListener();
      } catch (error) {
        console.error("Error initializing blockchain service:", error);
        throw error;
      }
    } else {
      throw new Error("Ethereum provider not found. Please install MetaMask.");
    }
  }

  // Set up listener for account changes
  setupAccountChangeListener() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length > 0) {
          const newAccount = accounts[0].toLowerCase();
          const oldAccount = localStorage
            .getItem("connectedAccount")
            ?.toLowerCase();

          if (newAccount !== oldAccount) {
            console.log(`Account changed from ${oldAccount} to ${newAccount}`);
            localStorage.setItem("connectedAccount", newAccount);

            // Notify the UI about account change
            this.triggerEvent(EventTypes.AccountChanged, {
              previousAccount: oldAccount,
              currentAccount: newAccount,
            });

            // Re-initialize contracts with new signer
            this.initialized = false;
            await this.initialize();
          }
        }
      });
    }
  }

  // Set up blockchain event listeners
  setupContractEventListeners() {
    try {
      // Reset previously tracked events for the new account
      const currentAccount = localStorage
        .getItem("connectedAccount")
        ?.toLowerCase();
      if (currentAccount) {
        const lastAccount = localStorage.getItem("lastListenerAccount");
        if (lastAccount !== currentAccount) {
          localStorage.setItem("lastListenerAccount", currentAccount);
        }
      }

      // Load processed events for current account
      const processedEvents = this.loadProcessedEvents();

      //Listen for voter status updates
      this.electionContract.on(
        "VoterStatusUpdated",
        async (userAddress, status) => {
          const eventId = `voter_${userAddress}_${status}_${Date.now()}`;
          // Skip if already processed
          if (processedEvents.has(eventId)) return;
          processedEvents.add(eventId);
          this.updateProcessedEvents(processedEvents);
        }
      );

      //Listen for candidate status updates
      this.electionContract.on(
        "CandidateStatusUpdated",
        async (userAddress, status) => {
          const eventId = `candidate_${userAddress}_${status}_${Date.now()}`;

          // Skip if already processed
          if (processedEvents.has(eventId)) return;
          processedEvents.add(eventId);
          this.updateProcessedEvents(processedEvents);
        }
      );

      // Listen for new elections
      this.votingContract.on(
        "ElectionCreated",
        (electionId, name, startTime, endTime) => {
          const electionIdStr = electionId.toString();
          const eventId = `created_${electionIdStr}`;

          // Check if we've already processed this election
          if (processedEvents.has(eventId)) {
            return;
          }

          processedEvents.add(eventId);
          this.updateProcessedEvents(processedEvents);

          // Also trigger general event
          this.triggerEvent(EventTypes.NewElection, {
            electionId: electionIdStr,
            name,
            startTime: new Date(startTime.toNumber() * 1000),
            endTime: new Date(endTime.toNumber() * 1000),
            timestamp: new Date(),
          });
        }
      );

      // Listen for election start events
      this.votingContract.on("ElectionStarted", (electionId) => {
        const electionIdStr = electionId.toString();
        const eventId = `started_${electionIdStr}`;

        // Check if we've already processed this election
        if (processedEvents.has(eventId)) {
          return;
        }

        processedEvents.add(eventId);
        this.updateProcessedEvents(processedEvents);

        // Get election details and notify
        this.getElectionDetails(electionIdStr)
          .then((details) => {
            // Also trigger general event
            this.triggerEvent(EventTypes.NewElection, {
              electionId: electionIdStr,
              name: details.name,
              description: details.description,
              startTime: new Date(details.startTime),
              endTime: new Date(details.endTime),
              timestamp: new Date(),
            });
          })
          .catch((error) =>
            console.error(
              "Error getting election details for notification:",
              error
            )
          );
      });

      // Listen for election end events
      this.votingContract.on("ElectionEnded", (electionId) => {
        const electionIdStr = electionId.toString();
        const eventId = `ended_${electionIdStr}`;

        if (processedEvents.has(eventId)) {
          return;
        }

        processedEvents.add(eventId);
        this.updateProcessedEvents(processedEvents);

        // Get election details and notify
        this.getElectionDetails(electionIdStr)
          .then((details) => {
            // Create notification for all eligible voters
            // This will send notifications to all approved voters
            this.sendElectionEndNotificationToEligibleVoters(
              electionIdStr,
              details
            );

            // Also trigger general event
            this.triggerEvent(EventTypes.ElectionEnded, {
              electionId: electionIdStr,
              name: details.name,
              timestamp: new Date(),
            });
          })
          .catch((error) =>
            console.error(
              "Error getting election details for notification:",
              error
            )
          );
      });
      
    } catch (error) {
      console.error("Error setting up contract event listeners:", error);
    }
  }

  // Add local notification
  addLocalNotification(notification) {
    return this.notificationManager.addLocalNotification(notification);
  }

  // Add global notification
  addGlobalNotification(notification) {
    return this.notificationManager.addGlobalNotification(notification);
  }

  // Add notification for a specific user
  addNotificationForUser(userAddress, notification) {
    return this.notificationManager.addNotificationForUser(
      userAddress,
      notification
    );
  }

  // Get all notifications
  getNotifications() {
    return this.notificationManager.getNotifications();
  }

  // Get unread notification count
  getUnreadNotificationCount() {
    return this.notificationManager.getUnreadNotificationCount();
  }

  // Mark notification as read
  markNotificationAsRead(notificationId) {
    return this.notificationManager.markNotificationAsRead(notificationId);
  }

  // Mark all notifications as read
  markAllNotificationsAsRead() {
    return this.notificationManager.markAllNotificationsAsRead();
  }

  // Clear all notifications
  clearAllNotifications() {
    return this.notificationManager.clearAllNotifications();
  }

  // Upload a file to Pinata and get the IPFS CID
  async uploadFileToPinata(file) {
    if (!file) return null;

    // Check if Pinata credentials are configured
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
      console.error(
        "Pinata API credentials are not configured in environment variables"
      );
      throw new Error(
        "IPFS storage configuration missing. Please check environment variables."
      );
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY,
          },
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error("Error uploading to Pinata:", error);
      throw error;
    }
  }

  // Send election end notifications to all eligible voters
  async sendElectionEndNotificationToEligibleVoters(
    electionId,
    electionDetails
  ) {
    try {
      // Get all approved voters
      const approvedVoters = await this.getVotersByStatus(
        VoterStatusEnum.Approved
      );

      // Get all approved candidates - they can vote too
      const approvedCandidates = await this.getCandidatesByStatus(
        CandidateStatusEnum.Approved
      );

      // Create the notification
      const notification = {
        type: "election_ended",
        title: "Election Has Ended",
        message: `The election "${electionDetails.name}" has ended`,
        details: "The results are now available for viewing",
        electionId: electionId,
        timestamp: new Date().toISOString(),
      };

      // Send to all approved voters
      for (const voterAddress of approvedVoters) {
        this.addNotificationForUser(voterAddress, notification);
      }

      // Send to all approved candidates
      for (const candidateAddress of approvedCandidates) {
        this.addNotificationForUser(candidateAddress, notification);
      }

      console.log(
        `Sent election end notifications to ${approvedVoters.length} voters and ${approvedCandidates.length} candidates`
      );
      return true;
    } catch (error) {
      console.error("Error sending election end notifications:", error);
      return false;
    }
  }

  // =========== ELECTION CONTRACT FUNCTIONS ===========

  async registerVoter(voterData, profileImage, idDocument) {
    await this.initialize();

    try {
      const userAddress = await this.signer.getAddress();

      // Check if this user was previously rejected
      let wasRejected = false;
      try {
        const currentStatus = await this.getVoterStatus(userAddress);
        wasRejected = currentStatus === VoterStatusEnum.Rejected;
      } catch (error) {
        // If error occurs, user probably wasn't registered before
        // Continue with regular registration
        console.error("Error checking previous voter status:", error);
      }

      // Upload files to IPFS via Pinata
      const profileImageCID = await this.uploadFileToPinata(profileImage);
      const idDocumentCID = await this.uploadFileToPinata(idDocument);

      // Prepare voter registration params
      const voterParams = {
        fullName: voterData.fullName,
        dob: voterData.dob,
        govId: voterData.govId,
        residentialAddress: voterData.address,
        email: voterData.email,
        phone: voterData.phone,
        profileDataCID: profileImageCID,
        idDocumentCID: idDocumentCID,
      };

      // Register voter on blockchain
      const tx = await this.electionContract.registerVoter(voterParams);

      await tx.wait();

      // Create an admin notification for resubmissions
      this.notifyAdminsAboutRegistration(
        "voter",
        voterData.fullName,
        userAddress,
        wasRejected
      );

      return true;
    } catch (error) {
      console.error("Error registering voter:", error);
      throw error;
    }
  }

  async notifyAdminsAboutRegistration(
    userType,
    fullName,
    userAddress,
    isResubmission = false
  ) {
    try {
      // Get all admin addresses
      const adminAddresses = await this.getAllAdmins();

      // Get rejection count
      let rejectionCount = 0;
      if (isResubmission) {
        if (userType === "voter") {
          rejectionCount = await this.getRejectionCountForVoter(userAddress);
        } else {
          rejectionCount = await this.getRejectionCountForCandidate(
            userAddress
          );
        }
      }

      // Create message with resubmission attempt number if applicable
      let message = "";
      if (isResubmission) {
        message = `${fullName} has resubmitted their ${userType} registration after being rejected (Attempt ${rejectionCount})`;
      } else {
        message = `${fullName} has submitted a new ${userType} registration`;
      }

      // Prepare the notification
      const notification = {
        type: "admin",
        title: `${userType === "voter" ? "Voter" : "Candidate"} Registration`,
        message: message,
        details: `The application is pending review. Address: ${userAddress.substring(
          0,
          6
        )}...${userAddress.slice(-4)}`,
        timestamp: new Date().toISOString(),
      };

      // Notify each admin
      for (const adminAddress of adminAddresses) {
        this.addNotificationForUser(adminAddress, notification);
      }

      // If current user is an admin, also show notification immediately
      const currentAccount = localStorage.getItem("connectedAccount");
      if (currentAccount) {
        const isAdmin = await this.isAdmin();

        if (isAdmin) {
          this.addLocalNotification(notification);
        }
      }
    } catch (error) {
      console.error("Error notifying admins about registration:", error);
    }
  }

  async getAllAdmins() {
    try {
      // Check if there's a method to get all admins from the contract
      if (typeof this.electionContract.getAllAdmins === "function") {
        return await this.electionContract.getAllAdmins();
      }

      // Fallback: If there's no getAllAdmins method in contract,
      // we'll use a workaround by storing admin addresses in localStorage
      const storedAdmins = localStorage.getItem("adminAddresses");
      if (storedAdmins) {
        return JSON.parse(storedAdmins);
      }

      // If no stored admins, at least add the current admin
      const currentAccount = localStorage.getItem("connectedAccount");
      if (currentAccount) {
        const isAdmin = await this.isAdmin();
        if (isAdmin) {
          // Store this admin address for future use
          localStorage.setItem(
            "adminAddresses",
            JSON.stringify([currentAccount])
          );
          return [currentAccount];
        }
      }

      return [];
    } catch (error) {
      console.error("Error getting admin addresses:", error);
      return [];
    }
  }

  async registerCandidate(
    candidateData,
    profileImage,
    idDocument,
    supportDocument,
    financialDocument
  ) {
    await this.initialize();

    try {
      const userAddress = await this.signer.getAddress();

      // Check if this user was previously rejected
      let wasRejected = false;
      try {
        const currentStatus = await this.getCandidateStatus(userAddress);
        wasRejected = currentStatus === CandidateStatusEnum.Rejected;
      } catch (error) {
        // If error occurs, user probably wasn't registered before
        // Continue with regular registration
        console.log(error);
      }

      // Upload files to IPFS via Pinata
      const profileImageCID = await this.uploadFileToPinata(profileImage);
      const idDocumentCID = await this.uploadFileToPinata(idDocument);
      const supportDocumentCID = await this.uploadFileToPinata(supportDocument);
      const financialDocumentCID = await this.uploadFileToPinata(
        financialDocument
      );

      // Step 1: Register basic candidate info
      let tx = await this.electionContract.registerCandidateBasicInfo(
        candidateData.fullName,
        candidateData.dob,
        candidateData.nationality,
        candidateData.govId,
        candidateData.address,
        candidateData.email,
        candidateData.phone
      );

      await tx.wait();

      // Step 2: Register extended candidate info
      tx = await this.electionContract.registerCandidateExtendedInfo(
        candidateData.education,
        candidateData.occupation,
        candidateData.politicalParty,
        candidateData.previousExperience,
        candidateData.keyProposals,
        candidateData.campaignFunding,
        candidateData.supportSignatures
      );

      await tx.wait();

      // Step 3: Register candidate documents
      tx = await this.electionContract.registerCandidateDocuments(
        profileImageCID,
        idDocumentCID,
        supportDocumentCID,
        financialDocumentCID
      );

      await tx.wait();

      // Create an admin notification for resubmissions
      this.notifyAdminsAboutRegistration(
        "candidate",
        candidateData.fullName,
        userAddress,
        wasRejected
      );

      return true;
    } catch (error) {
      console.error("Error registering candidate:", error);
      throw error;
    }
  }

  // Get user role
  async getUserRole(address) {
    await this.initialize();

    try {
      const role = await this.electionContract.getUserRole(address);
      return role;
    } catch (error) {
      console.error("Error getting user role:", error);
      throw error;
    }
  }

  // Get voter status
  async getVoterStatus(address) {
    await this.initialize();

    try {
      return await this.electionContract.getVoterStatus(address);
    } catch (error) {
      console.error("Error getting voter status:", error);
      throw error;
    }
  }

  // Get candidate status
  async getCandidateStatus(address) {
    await this.initialize();

    try {
      return await this.electionContract.getCandidateStatus(address);
    } catch (error) {
      console.error("Error getting candidate status:", error);
      throw error;
    }
  }

  // Get comprehensive user info including voter and candidate details if available
  async getComprehensiveUserInfo(address) {
    await this.initialize();

    try {
      let result = {
        isVoter: false,
        isCandidate: false,
        voterStatus: null,
        candidateStatus: null,
        canVote: false,
        voterInfo: null,
        candidateInfo: null,
      };

      // First get the base role info
      const role = await this.getUserRole(address);

      // Check for voter details
      if (role === RoleEnum.Voter || role === RoleEnum.Candidate) {
        try {
          if (role === RoleEnum.Voter) {
            const voterStatus = await this.getVoterStatus(address);
            const voterDetails = await this.getVoterDetails(address);
            const statusMessage = await this.getVoterStatusMessage(address);

            result.isVoter = true;
            result.voterStatus = voterStatus;
            result.voterInfo = {
              ...voterDetails,
              statusMessage,
            };
          }
        } catch (error) {
          if (
            !error.message.includes("Address is not a voter") &&
            !error.message.includes("Voter does not exist")
          ) {
            console.error("Error fetching voter details:", error);
          }
        }

        // Check for candidate details
        try {
          if (role === RoleEnum.Candidate) {
            const candidateStatus = await this.getCandidateStatus(address);
            const candidateDetails = await this.getCandidateDetails(address);
            const statusMessage = await this.getCandidateStatusMessage(address);

            result.isCandidate = true;
            result.candidateStatus = candidateStatus;
            result.candidateInfo = {
              ...candidateDetails,
              statusMessage,
            };
          }
        } catch (error) {
          if (
            !error.message.includes("Address is not a candidate") &&
            !error.message.includes("Candidate does not exist")
          ) {
            console.error("Error fetching candidate details:", error);
          }
        }
      }

      // Determine if user can vote - either approved voter OR approved candidate
      result.canVote =
        (result.isVoter && result.voterStatus === VoterStatusEnum.Approved) ||
        (result.isCandidate &&
          result.candidateStatus === CandidateStatusEnum.Approved);

      return result;
    } catch (error) {
      console.error("Error getting comprehensive user info:", error);
      throw error;
    }
  }

  // Get voter details
  async getVoterDetails(address) {
    await this.initialize();

    try {
      const voterDetails = await this.electionContract.getVoterDetails(address);
      return {
        fullName: voterDetails[0],
        dob: voterDetails[1],
        govId: voterDetails[2],
        residentialAddress: voterDetails[3],
        email: voterDetails[4],
        phone: voterDetails[5],
        profileDataCID: voterDetails[6],
        idDocumentCID: voterDetails[7],
        status: voterDetails[8],
        profileImageUrl: voterDetails[6]
          ? `${PINATA_GATEWAY}${voterDetails[6]}`
          : null,
        idDocumentUrl: voterDetails[7]
          ? `${PINATA_GATEWAY}${voterDetails[7]}`
          : null,
      };
    } catch (error) {
      console.error("Error getting voter details:", error);
      throw error;
    }
  }

  // Get candidate details (combining multiple calls)
  async getCandidateDetails(address) {
    await this.initialize();

    try {
      const basicDetails = await this.electionContract.getCandidateBasicDetails(
        address
      );
      const extendedDetails =
        await this.electionContract.getCandidateExtendedDetails(address);
      const documentDetails = await this.electionContract.getCandidateDocuments(
        address
      );

      return {
        // Basic details
        fullName: basicDetails[0],
        dob: basicDetails[1],
        nationality: basicDetails[2],
        govId: basicDetails[3],
        residentialAddress: basicDetails[4],
        email: basicDetails[5],
        phone: basicDetails[6],
        status: basicDetails[7],

        // Extended details
        education: extendedDetails[0],
        occupation: extendedDetails[1],
        politicalParty: extendedDetails[2],
        previousExperience: extendedDetails[3],
        keyProposals: extendedDetails[4],
        campaignFunding: extendedDetails[5],
        supportSignatures: extendedDetails[6],

        // Document details
        profileDataCID: documentDetails[0],
        idDocumentCID: documentDetails[1],
        supportDocumentCID: documentDetails[2],
        financialDocumentCID: documentDetails[3],

        // URLs for easier frontend access
        profileImageUrl: documentDetails[0]
          ? `${PINATA_GATEWAY}${documentDetails[0]}`
          : null,
        idDocumentUrl: documentDetails[1]
          ? `${PINATA_GATEWAY}${documentDetails[1]}`
          : null,
        supportDocumentUrl: documentDetails[2]
          ? `${PINATA_GATEWAY}${documentDetails[2]}`
          : null,
        financialDocumentUrl: documentDetails[3]
          ? `${PINATA_GATEWAY}${documentDetails[3]}`
          : null,
      };
    } catch (error) {
      console.error("Error getting candidate details:", error);
      throw error;
    }
  }

  // Check if user can vote (either approved voter OR approved candidate)
  async canUserVote(address) {
    await this.initialize();

    try {
      let isApprovedVoter = false;
      let isApprovedCandidate = false;
      const role = await this.getUserRole(address);

      // Check voter status if they are a voter
      if (role === RoleEnum.Voter) {
        try {
          const voterStatus = await this.getVoterStatus(address);
          isApprovedVoter = voterStatus === VoterStatusEnum.Approved;
        } catch (error) {
          if (
            !error.message.includes("Address is not a voter") &&
            !error.message.includes("Voter does not exist")
          ) {
            console.error("Error checking voter status:", error);
          }
        }
      }

      // If already an approved voter, no need to check candidate status
      if (isApprovedVoter) return true;

      // Check candidate status if they are a candidate
      if (role === RoleEnum.Candidate) {
        try {
          const candidateStatus = await this.getCandidateStatus(address);
          isApprovedCandidate =
            candidateStatus === CandidateStatusEnum.Approved;
        } catch (error) {
          if (
            !error.message.includes("Address is not a candidate") &&
            !error.message.includes("Candidate does not exist")
          ) {
            console.error("Error checking candidate status:", error);
          }
        }
      }

      // User can vote if either an approved voter OR an approved candidate
      return isApprovedVoter || isApprovedCandidate;
    } catch (error) {
      console.error("Error checking if user can vote:", error);
      throw error;
    }
  }

  // Admin: Update voter status
  async updateVoterStatus(voterAddress, status, message) {
    await this.initialize();

    try {
      const tx = await this.electionContract.updateVoterStatus(
        voterAddress,
        status,
        message
      );
      const receipt = await tx.wait();

      // Handle rejection count tracking
      if (status === VoterStatusEnum.Rejected) {
        // Increment rejection count
        const newRejectionCount = await this.incrementRejectionCountForVoter(
          voterAddress
        );
        // Create a notification for the specific voter with rejection count
        this.addNotificationForUser(voterAddress, {
          type: "status",
          title: "Voter Registration Rejected",
          message: `Your voter registration has been rejected (Rejection #${newRejectionCount})`,
          details: `Reason: ${message}. You may update your information and resubmit your application.`,
          timestamp: new Date().toISOString(),
        });
      } else if (status === VoterStatusEnum.Approved) {
        // Reset rejection count when approved
        await this.resetRejectionCountForVoter(voterAddress);
        // Create a notification for the specific voter
        this.addNotificationForUser(voterAddress, {
          type: "status",
          title: "Voter Registration Approved",
          message: "Your voter registration has been approved!",
          details:
            "You can now participate in elections. Check your profile for details.",
          timestamp: new Date().toISOString(),
        });
      }

      return true;
    } catch (error) {
      console.error("Error updating voter status:", error);

      // Notification for error
      this.addLocalNotification({
        type: "error",
        title: "Voter Status Update Failed",
        message: `Failed to update voter status`,
        details: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  // Admin: Update candidate status
  async updateCandidateStatus(candidateAddress, status, message) {
    await this.initialize();

    try {
      const tx = await this.electionContract.updateCandidateStatus(
        candidateAddress,
        status,
        message
      );
      const receipt = await tx.wait();

      // Handle rejection count tracking
      if (status === CandidateStatusEnum.Rejected) {
        // Increment rejection count
        const newRejectionCount =
          await this.incrementRejectionCountForCandidate(candidateAddress);

        // Create a notification for the specific candidate with rejection count
        this.addNotificationForUser(candidateAddress, {
          type: "status",
          title: "Candidate Registration Rejected",
          message: `Your candidate registration has been rejected (Rejection #${newRejectionCount})`,
          details: `Reason: ${message}. You may update your information and resubmit your application.`,
          timestamp: new Date().toISOString(),
        });
      } else if (status === CandidateStatusEnum.Approved) {
        // Reset rejection count when approved
        await this.resetRejectionCountForCandidate(candidateAddress);
        // Create a notification for the specific candidate
        this.addNotificationForUser(candidateAddress, {
          type: "status",
          title: "Candidate Registration Approved",
          message: "Your candidate registration has been approved!",
          details:
            "You can now participate in elections. Check your profile for details.",
          timestamp: new Date().toISOString(),
        });
      }

      return true;
    } catch (error) {
      console.error("Error updating candidate status:", error);

      // Notification for error
      this.addLocalNotification({
        type: "error",
        title: "Candidate Status Update Failed",
        message: `Failed to update candidate status`,
        details: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  // Check if the current user is an admin
  async isAdmin() {
    await this.initialize();

    try {
      const userAddress = await this.signer.getAddress();
      return await this.electionContract.isAdmin(userAddress);
    } catch (error) {
      console.error("Error checking admin status:", error);
      throw error;
    }
  }

  // Get all voters with a specific status
  async getVotersByStatus(status) {
    await this.initialize();

    try {
      const addresses = await this.electionContract.getFilteredVoters(status);
      return addresses;
    } catch (error) {
      console.error("Error getting voters by status:", error);
      throw error;
    }
  }

  // Get all candidates with a specific status
  async getCandidatesByStatus(status) {
    await this.initialize();

    try {
      const addresses = await this.electionContract.getFilteredCandidates(
        status
      );
      return addresses;
    } catch (error) {
      console.error("Error getting candidates by status:", error);
      throw error;
    }
  }

  // =========== VOTING CONTRACT FUNCTIONS ===========
  // Create a new election - with no automatic start/end
  async createElection(electionData) {
    await this.initialize();

    try {
      // Convert ISO dates to Unix timestamps (seconds)
      const startTime = Math.floor(
        new Date(electionData.startTime).getTime() / 1000
      );
      const endTime = Math.floor(
        new Date(electionData.endTime).getTime() / 1000
      );

      console.log("Creating election with times:", {
        currentTime: Math.floor(Date.now() / 1000),
        startTime: startTime,
        endTime: endTime,
      });

      const params = {
        name: electionData.name,
        description: electionData.description,
        startTime: startTime,
        endTime: endTime,
        candidateAddresses: electionData.candidateAddresses,
      };

      const tx = await this.votingContract.createElection(params);
      const receipt = await tx.wait();

      // Check for the ElectionCreated event in the transaction receipt
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.votingContract.interface.parseLog(log);
          if (parsedLog.name === "ElectionCreated") {
            console.log("ElectionCreated event detected:", parsedLog.args);
          }
        } catch (error) {
          // Not an event we can parse, skip
          console.log("Not an ElectionCreated event, skipping:", error);
        }
      }

      return true;
    } catch (error) {
      console.error("Error creating election:", error);
      throw error;
    }
  }

  // Start an election manually
  async startElection(electionId) {
    await this.initialize();

    try {
      // Use higher gas limit to prevent transaction failures
      const tx = await this.votingContract.startElection(electionId, {
        gasLimit: 500000,
      });
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error starting election:", error);
      throw error;
    }
  }

  // End an election manually
  async endElection(electionId) {
    await this.initialize();

    try {
      // Use higher gas limit to prevent transaction failures
      const tx = await this.votingContract.endElection(electionId, {
        gasLimit: 500000,
      });
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error ending election:", error);
      throw error;
    }
  }

  // Get all elections
  async getAllElections() {
    await this.initialize();

    try {
      const electionIds = await this.votingContract.getAllElections();

      const electionsPromises = electionIds.map(async (id) => {
        const details = await this.getElectionDetails(id);
        return {
          id: id.toString(),
          ...details,
        };
      });

      return await Promise.all(electionsPromises);
    } catch (error) {
      console.error("Error getting all elections:", error);
      throw error;
    }
  }

  // Get ongoing elections
  async getOngoingElections() {
    await this.initialize();

    try {
      const electionIds = await this.votingContract.getOngoingElections();

      const electionsPromises = electionIds.map(async (id) => {
        const details = await this.getElectionDetails(id);
        return {
          id: id.toString(),
          ...details,
        };
      });

      return await Promise.all(electionsPromises);
    } catch (error) {
      console.error("Error getting ongoing elections:", error);
      throw error;
    }
  }

  // Get past elections
  async getPastElections() {
    await this.initialize();

    try {
      const electionIds = await this.votingContract.getPastElections();

      const electionsPromises = electionIds.map(async (id) => {
        const details = await this.getElectionDetails(id);
        const results = await this.getElectionResults(id);
        return {
          id: id.toString(),
          ...details,
          ...results,
        };
      });

      return await Promise.all(electionsPromises);
    } catch (error) {
      console.error("Error getting past elections:", error);
      throw error;
    }
  }

  // Get election details
  async getElectionDetails(electionId) {
    await this.initialize();

    try {
      const details = await this.votingContract.getElectionDetails(electionId);

      // Get candidate details for each candidate
      const candidateDetailsPromises = details[5].map((address) =>
        this.getCandidateDetails(address)
      );
      const candidateDetails = await Promise.all(candidateDetailsPromises);

      // Combine vote counts with candidate details
      const candidatesWithVotes = candidateDetails.map((candidate, index) => ({
        ...candidate,
        voteCount: details[6][index].toString(),
        address: details[5][index],
      }));

      return {
        name: details[0],
        description: details[1],
        startTime: new Date(details[2] * 1000).toISOString(), // Convert to ISO string
        endTime: new Date(details[3] * 1000).toISOString(), // Convert to ISO string
        state: details[4],
        candidates: candidatesWithVotes,
      };
    } catch (error) {
      console.error("Error getting election details:", error);
      throw error;
    }
  }

  // Get election results
  async getElectionResults(electionId) {
    await this.initialize();

    try {
      const results = await this.votingContract.getElectionResults(electionId);

      // Get winner details
      let winnerDetails = null;
      if (results[2] !== ethers.constants.AddressZero) {
        winnerDetails = await this.getCandidateDetails(results[2]);
      }

      return {
        winnerAddress: results[2],
        winner: winnerDetails,
      };
    } catch (error) {
      console.error("Error getting election results:", error);
      return {
        winnerAddress: null,
        winner: null,
      };
    }
  }

  // Cast a vote - Updated to use separate status checks and add notification
  async castVote(electionId, candidateIndex) {
    await this.initialize();

    try {
      const userAddress = await this.signer.getAddress();
      const role = await this.getUserRole(userAddress);

      // Explicitly check voter status
      let isApprovedVoter = false;
      if (role === RoleEnum.Voter) {
        try {
          const voterStatus = await this.getVoterStatus(userAddress);
          isApprovedVoter = voterStatus === VoterStatusEnum.Approved;
        } catch (error) {
          // Not a voter or error
          if (
            !error.message.includes("Address is not a voter") &&
            !error.message.includes("Voter does not exist")
          ) {
            console.error("Error checking voter status:", error);
          }
        }
      }

      // Explicitly check candidate status
      let isApprovedCandidate = false;
      if (role === RoleEnum.Candidate) {
        try {
          const candidateStatus = await this.getCandidateStatus(userAddress);
          isApprovedCandidate =
            candidateStatus === CandidateStatusEnum.Approved;
        } catch (error) {
          // Not a candidate or error
          if (
            !error.message.includes("Address is not a candidate") &&
            !error.message.includes("Candidate does not exist")
          ) {
            console.error("Error checking candidate status:", error);
          }
        }
      }

      // If neither role is approved, throw error
      if (!isApprovedVoter && !isApprovedCandidate) {
        throw new Error(
          "You must be either an approved voter or an approved candidate to vote"
        );
      }

      // Check if already voted
      const hasVoted = await this.hasVotedInElection(electionId, userAddress);
      if (hasVoted) {
        throw new Error("You have already voted in this election");
      }

      console.log(
        `Casting vote with electionId ${electionId}, candidateIndex ${candidateIndex}`
      );
      console.log(
        `User status: isApprovedVoter=${isApprovedVoter}, isApprovedCandidate=${isApprovedCandidate}`
      );

      const tx = await this.votingContract.castVote(electionId, candidateIndex);
      await tx.wait();

      return true;
    } catch (error) {
      console.error("Error casting vote:", error);
      throw error;
    }
  }

  // Check if a voter has voted in an election
  async hasVotedInElection(electionId, voterAddress) {
    await this.initialize();

    try {
      return await this.votingContract.hasVotedInElection(
        electionId,
        voterAddress
      );
    } catch (error) {
      console.error("Error checking if voter has voted:", error);
      throw error;
    }
  }

  // Get IPFS URL for a CID
  getIpfsUrl(cid) {
    if (!cid) return null;
    return `${PINATA_GATEWAY}${cid}`;
  }

  // Reset contract (admin only)
  async resetContract() {
    await this.initialize();

    try {
      // Check if user is admin (important security check)
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        throw new Error("Only admin can reset the contract state");
      }

      // 1. First, handle the voting contract
      try {
        // Get all elections
        const electionIds = await this.votingContract.getAllElections();

        // For each ongoing election, end it first
        for (const electionId of electionIds) {
          const details = await this.votingContract.getElectionDetails(
            electionId
          );
          if (details[4] === 1) {
            // if state is ONGOING (1)
            const tx = await this.votingContract.endElection(electionId, {
              gasLimit: 500000,
            });
            await tx.wait();
          }
        }

        // Call resetContract on voting contract if it exists
        if (typeof this.votingContract.resetContract === "function") {
          const tx = await this.votingContract.resetContract({
            gasLimit: 500000,
          });
          await tx.wait();
        }
      } catch (e) {
        console.error("Error resetting voting contract:", e);
      }

      // 2. Reset all roles in the election contract
      try {
        const tx = await this.electionContract.resetAllRoles({
          gasLimit: 500000,
        });
        await tx.wait();
        console.log("Successfully reset all user roles and statuses");
      } catch (e) {
        console.error("Error resetting user roles:", e);

        // Fallback approach if resetAllRoles fails
        try {
          console.log("Trying alternative reset approach...");

          // Get all voters and candidates
          const allVoters = await this.electionContract.getAllVoters();
          const allCandidates = await this.electionContract.getAllCandidates();

          // Use batch reset if available
          if (typeof this.electionContract.batchResetUserRoles === "function") {
            if (allVoters.length > 0) {
              const txVoters = await this.electionContract.batchResetUserRoles(
                allVoters,
                {
                  gasLimit: 500000,
                }
              );
              await txVoters.wait();
            }

            if (allCandidates.length > 0) {
              const txCandidates =
                await this.electionContract.batchResetUserRoles(allCandidates, {
                  gasLimit: 500000,
                });
              await txCandidates.wait();
            }
          } else {
            // Individual resets if batch isn't available
            for (const voter of allVoters) {
              const tx = await this.electionContract.resetUserRole(voter, {
                gasLimit: 100000,
              });
              await tx.wait();
            }

            for (const candidate of allCandidates) {
              const tx = await this.electionContract.resetUserRole(candidate, {
                gasLimit: 100000,
              });
              await tx.wait();
            }
          }
        } catch (fallbackError) {
          console.error("Fallback reset approach also failed:", fallbackError);
        }
      }

      // 3. Clear all localStorage data
      if (typeof window !== "undefined") {
        localStorage.clear();
      }

      // 4. Clear notification tracking system
      this.clearAllNotificationTracking();

      // 5. Add final reset notification (this will be the only notification in the system)
      this.addLocalNotification({
        type: "admin",
        title: "System Reset Complete",
        message: "Successful reset to the entire voting system",
        details: "All user roles, elections, and votes have been reset",
        timestamp: new Date().toISOString(),
      });

      // 6. Force window reload after a short delay
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }

      return true;
    } catch (error) {
      console.error("Error during contract reset:", error);

      // Add error notification
      this.addLocalNotification({
        type: "error",
        title: "System Reset Failed",
        message: "Failed to reset the voting system",
        details: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  // Clear notification tracking for all users
  clearAllNotificationTracking() {
    try {
      // Find all notification-related keys in localStorage
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key.includes("Notification") ||
          key.includes("notification") ||
          key.includes("lastVoterStatus") ||
          key.includes("lastCandidateStatus") ||
          key.includes("processedEvents") ||
          key.includes("notifiedElections") ||
          key.includes("lastElectionCheck")
        ) {
          keys.push(key);
        }
      }

      // Clear all found keys
      for (const key of keys) {
        localStorage.removeItem(key);
      }

      console.log(`Cleared ${keys.length} notification-related storage keys`);
      return true;
    } catch (error) {
      console.error("Error clearing all notification tracking:", error);
      return false;
    }
  }
}

export default new BlockchainService();
