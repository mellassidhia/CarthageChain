import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import BlockchainService from "../../services/BlockchainService";
import NotificationSystem from "../../components/NotificationSystem/NotificationSystem";

const Navbar = () => {
  const [account, setAccount] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const navigate = useNavigate();

  // Check for existing connection in localStorage on component mount
  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true);
      const storedAccount = localStorage.getItem("connectedAccount");

      if (storedAccount) {
        setAccount(storedAccount);

        // Check if the user is an admin
        try {
          await BlockchainService.initialize();
          const adminStatus = await BlockchainService.isAdmin();
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      } else {
        setAccount("");
        setIsAdmin(false);
      }

      setIsLoading(false);
    };

    checkConnection();

    // Set up listener for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    // Set up a function to check localStorage periodically
    const checkStorageChange = async () => {
      const currentAccount = localStorage.getItem("connectedAccount");
      if (currentAccount !== account) {
        setAccount(currentAccount || "");

        if (currentAccount) {
          // Re-check admin status if account changes
          try {
            await BlockchainService.initialize();
            const adminStatus = await BlockchainService.isAdmin();
            setIsAdmin(adminStatus);
          } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      }
    };

    // Check every second
    const interval = setInterval(checkStorageChange, 1000);

    // Clean up interval and event listener on unmount
    return () => {
      clearInterval(interval);
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, [account]);

  // Function to connect with MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsConnecting(true);

        // Request account access
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        // Get the first account
        const userAccount = accounts[0];
        setAccount(userAccount);

        // Check if the account is an admin
        await BlockchainService.initialize();
        const adminStatus = await BlockchainService.isAdmin();
        setIsAdmin(adminStatus);

        // Store in localStorage for persistence
        localStorage.setItem("connectedAccount", userAccount);

        setIsConnecting(false);

        // Refresh the page to ensure all components update properly
        window.location.reload();
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
        setIsConnecting(false);
        alert("Error connecting to MetaMask. Please try again.");
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask to continue.");
    }
  };

  // Function to disconnect wallet
  const disconnectWallet = () => {
    localStorage.removeItem("connectedAccount");

    // Clear notification related storage
    localStorage.removeItem("userNotifications");
    localStorage.removeItem("lastVoterStatus");
    localStorage.removeItem("lastCandidateStatus");
    localStorage.removeItem("lastElectionCheckTime");

    setAccount("");
    setIsAdmin(false);

    // If MetaMask is available, remove the event listener
    if (window.ethereum) {
      window.ethereum.removeAllListeners("accountsChanged");
    }

    // Navigate to home and then refresh the page
    navigate("/");
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Handle account changes - navigate to home and reset state
  const handleAccountsChanged = (accounts) => {
    // Always disconnect first
    localStorage.removeItem("connectedAccount");

    // Clear notification related storage
    localStorage.removeItem("userNotifications");
    localStorage.removeItem("lastVoterStatus");
    localStorage.removeItem("lastCandidateStatus");
    localStorage.removeItem("lastElectionCheckTime");

    setAccount("");
    setIsAdmin(false);

    // Navigate to home and then refresh the page
    navigate("/");
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Function to format the address for display
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Toggle mobile dropdown
  const toggleDropdown = (key) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle mobile menu link click
  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
    setOpenDropdowns({});
  };

  return (
    <nav className="navbar">
      {/* Logo and brand name */}
      <div className="navbar-brand">
        <div className="navbar-logo-container">
          <Link to="/">
            <img src={assets.logo} alt="Logo" className="logo-image" />
          </Link>
        </div>
        <Link to="/" className="navbar-brand-name">
          CarthageChain
        </Link>
      </div>

      {/* Mobile menu button */}
      <button className="mobile-menu-button" onClick={toggleMobileMenu}>
        ☰
      </button>

      {/* Desktop navigation links */}
      <div className="nav-links">
        <Link to="/">Home</Link>

        {/* Elections Dropdown - Updated to match routes in App.js */}
        <div className="dropdown">
          <span className="dropdown-toggle">Elections</span>
          <div className="dropdown-content">
            <Link to="/elections/ongoing">Ongoing Elections</Link>
            <Link to="/election-results">Election Results</Link>
          </div>
        </div>

        {/* Candidates Dropdown */}
        <div className="dropdown">
          <span className="dropdown-toggle">Candidates</span>
          <div className="dropdown-content">
            <Link to="/all-candidates">All Candidates</Link>
            <Link to="/approved-candidates">Approved Candidates</Link>
          </div>
        </div>

        {/* Resources Dropdown */}
        <div className="dropdown">
          <span className="dropdown-toggle">Resources</span>
          <div className="dropdown-content">
            <Link to="/about">About</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/security">Security</Link>
            <Link to="/policy">Privacy Policy</Link>
            <Link to="/terms-of-use">Terms of Service</Link>
          </div>
        </div>

        {/* Community Dropdown - New dropdown containing Forum and Rate Us */}
        <div className="dropdown">
          <span className="dropdown-toggle">Community</span>
          <div className="dropdown-content">
            <Link to="/forum">Forum</Link>
            <Link to="/rate-us">Rate Us</Link>
          </div>
        </div>
      </div>

      {/* Desktop right side buttons - conditional based on connection status */}
      <div className="nav-actions">
        {!account ? (
          <button
            className="login-btn"
            onClick={connectWallet}
            disabled={isConnecting}
          >
            <div className="metamask-icon"></div>
            {isConnecting ? "Connecting..." : "Login"}
          </button>
        ) : (
          <div className="wallet-info">
            {/* Add notification system here */}
            <NotificationSystem />

            <div className="user-dropdown">
              <div className="wallet-address">{formatAddress(account)}</div>
              <div className="user-dropdown-content">
                <Link to="/profile">My Profile</Link>
                {isAdmin && (
                  <>
                    <Link to="/admin">Admin Panel</Link>
                    <Link to="/admin/create-election">Election Management</Link>
                  </>
                )}

                {/* Only show registration options for non-admin users */}
                {!isAdmin && (
                  <>
                    <Link to="/voter-form">Voter Registration</Link>
                    <Link to="/candidate-form">Candidate Registration</Link>
                  </>
                )}

                {/* Rate Us link removed from here since it's now in the Community dropdown */}

                <a onClick={disconnectWallet} className="logout-link">
                  Logout
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? "active" : ""}`}
        onClick={toggleMobileMenu}
      ></div>

      {/* Mobile menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? "active" : ""}`}>
        <button className="mobile-menu-close" onClick={toggleMobileMenu}>
          ×
        </button>

        <div className="mobile-nav-links">
          <Link to="/" onClick={handleMobileLinkClick}>
            Home
          </Link>

          {/* Mobile Elections Dropdown */}
          <div className="mobile-dropdown">
            <div
              className={`mobile-dropdown-toggle ${
                openDropdowns.elections ? "active" : ""
              }`}
              onClick={() => toggleDropdown("elections")}
            >
              Elections
            </div>
            <div
              className={`mobile-dropdown-content ${
                openDropdowns.elections ? "active" : ""
              }`}
            >
              <Link to="/elections/ongoing" onClick={handleMobileLinkClick}>
                Ongoing Elections
              </Link>
              <Link to="/election-results" onClick={handleMobileLinkClick}>
                Election Results
              </Link>
            </div>
          </div>

          {/* Mobile Candidates Dropdown */}
          <div className="mobile-dropdown">
            <div
              className={`mobile-dropdown-toggle ${
                openDropdowns.candidates ? "active" : ""
              }`}
              onClick={() => toggleDropdown("candidates")}
            >
              Candidates
            </div>
            <div
              className={`mobile-dropdown-content ${
                openDropdowns.candidates ? "active" : ""
              }`}
            >
              <Link to="/all-candidates" onClick={handleMobileLinkClick}>
                All Candidates
              </Link>
              <Link to="/approved-candidates" onClick={handleMobileLinkClick}>
                Approved Candidates
              </Link>
            </div>
          </div>

          {/* Mobile Resources Dropdown */}
          <div className="mobile-dropdown">
            <div
              className={`mobile-dropdown-toggle ${
                openDropdowns.resources ? "active" : ""
              }`}
              onClick={() => toggleDropdown("resources")}
            >
              Resources
            </div>
            <div
              className={`mobile-dropdown-content ${
                openDropdowns.resources ? "active" : ""
              }`}
            >
              <Link to="/about" onClick={handleMobileLinkClick}>
                About
              </Link>
              <Link to="/faq" onClick={handleMobileLinkClick}>
                FAQ
              </Link>
              <Link to="/security" onClick={handleMobileLinkClick}>
                Security
              </Link>
              <Link to="/policy" onClick={handleMobileLinkClick}>
                Privacy Policy
              </Link>
              <Link to="/terms-of-use" onClick={handleMobileLinkClick}>
                Terms of Service
              </Link>
            </div>
          </div>

          {/* Mobile Community Dropdown */}
          <div className="mobile-dropdown">
            <div
              className={`mobile-dropdown-toggle ${
                openDropdowns.community ? "active" : ""
              }`}
              onClick={() => toggleDropdown("community")}
            >
              Community
            </div>
            <div
              className={`mobile-dropdown-content ${
                openDropdowns.community ? "active" : ""
              }`}
            >
              <Link to="/forum" onClick={handleMobileLinkClick}>
                Forum
              </Link>
              <Link to="/rate-us" onClick={handleMobileLinkClick}>
                Rate Us
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile user actions */}
        <div className="mobile-user-actions">
          {!account ? (
            <button
              className="mobile-login-btn"
              onClick={() => {
                connectWallet();
                toggleMobileMenu();
              }}
              disabled={isConnecting}
            >
              <div className="metamask-icon"></div>
              {isConnecting ? "Connecting..." : "Login"}
            </button>
          ) : (
            <div className="mobile-wallet-info">
              <div className="mobile-wallet-address">
                {formatAddress(account)}
              </div>
              <div className="mobile-user-dropdown">
                <Link to="/profile" onClick={handleMobileLinkClick}>
                  My Profile
                </Link>
                {isAdmin && (
                  <>
                    <Link to="/admin" onClick={handleMobileLinkClick}>
                      Admin Panel
                    </Link>
                    <Link
                      to="/admin/create-election"
                      onClick={handleMobileLinkClick}
                    >
                      Election Management
                    </Link>
                  </>
                )}

                {/* Only show registration options for non-admin users */}
                {!isAdmin && (
                  <>
                    <Link to="/voter-form" onClick={handleMobileLinkClick}>
                      Voter Registration
                    </Link>
                    <Link to="/candidate-form" onClick={handleMobileLinkClick}>
                      Candidate Registration
                    </Link>
                  </>
                )}
                <div
                  onClick={() => {
                    disconnectWallet();
                    toggleMobileMenu();
                  }}
                  className="mobile-logout-link"
                >
                  Logout
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;