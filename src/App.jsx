import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/Home/Home';
import FAQ from './pages/FAQ/FAQ';
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import ScrollUpButton from "./components/ScrollUpButton/ScrollUpButton";
import About from './pages/About/About';
import Security from './pages/Security/Security';
import Policy from './pages/Policy/Policy';
import TermsOfService from './pages/TermsOfService/TermsOfService';
import ContactUs from './pages/ContactUs/ContactUs';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import Login from './pages/Login/Login';
import CandidateForm from './pages/CandidateForm/CandidateForm';
import VoterForm from './pages/VoterForm/VoterForm';
import Forum from './pages/Forum/Forum';
import PostDetail from './pages/PostDetail/PostDetail';
import UserProfile from './pages/UserProfile/UserProfile';
import AdminPanel from './pages/AdminPanel/AdminPanel';
import ElectionManagement from './pages/ElectionManagement/ElectionManagement';
import OngoingElections from './pages/OngoingElections/OngoingElections';
import ElectionResults from './pages/ElectionResults/ElectionResults';
import AllCandidates from './pages/AllCandidates/AllCandidates';
import ApprovedCandidates from './pages/ApprovedCandidates/ApprovedCandidates';
import ElectionPredictionPage from './pages/ElectionPredictionPage/ElectionPredictionPage';
import BlockchainService from './services/BlockchainService';
// Import the RateUs component
import RateUs from './pages/RateUs/RateUs';
import './App.css';

const App = () => {
  const [wallet, setWallet] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // Check localStorage for connected account from Login component
        const storedAccount = localStorage.getItem('connectedAccount');
        if (storedAccount) {
          setWallet({
            address: storedAccount
          });
          
          // Check if the user is an admin using our blockchain service
          try {
            await BlockchainService.initialize();
            const adminStatus = await BlockchainService.isAdmin();
            setIsOwner(adminStatus);
          } catch (error) {
            console.error('Error checking admin status:', error);
            // If there's an error, we default to false for isOwner
            setIsOwner(false);
          }
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
    
    // Listen for localStorage changes (for when login/logout happens in Login component)
    const handleStorageChange = async () => {
      const account = localStorage.getItem('connectedAccount');
      if (account) {
        setWallet({ address: account });
        
        // Check admin status when account changes
        try {
          await BlockchainService.initialize();
          const adminStatus = await BlockchainService.isAdmin();
          setIsOwner(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsOwner(false);
        }
      } else {
        setWallet(null);
        setIsOwner(false);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (loading) {
    return <div className="loading">Loading application...</div>;
  }

  return (
    <Router>
      <div className="app">      
        {/* Main Content Container */}
        <div className="container">
          <Navbar wallet={wallet} isOwner={isOwner} />
          <ScrollToTop />
          <Routes>
            {/* Home Page */}
            <Route path="/" element={<HomePage />} />
            
            {/* Decentralized Forum Routes */}
            <Route path="/forum" element={<Forum wallet={wallet} />} />
            <Route path="/post/:id" element={<PostDetail wallet={wallet} isOwner={isOwner} />} />
            
            {/* Election Prediction Page - New Route */}
            <Route path="/election-prediction" element={<ElectionPredictionPage wallet={wallet} />} />
            
            {/* User Registration and Profile Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/candidate-form" element={<CandidateForm />} />
            <Route path="/voter-form" element={<VoterForm />} />
            <Route path="/profile" element={<UserProfile />} />
            
            {/* Rate Us Page - New Route */}
            <Route path="/rate-us" element={<RateUs />} />
            
            {/* Election Routes */}
            <Route path="/elections/ongoing" element={<OngoingElections />} />
            <Route path="/election-results" element={<ElectionResults />} />
            <Route path="/election-results/:electionId" element={<ElectionResults />} />
            
            {/* Candidate Listing Pages */}
            <Route path="/all-candidates" element={<AllCandidates />} />
            <Route path="/approved-candidates" element={<ApprovedCandidates />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                isOwner ? 
                <AdminPanel /> : 
                <Navigate to="/" replace />
              } 
            />
            <Route 
              path="/admin/create-election" 
              element={
                isOwner ? 
                <ElectionManagement /> : 
                <Navigate to="/" replace />
              } 
            />
            
            {/* Additional Pages */}
            <Route path="/faq" element={<FAQ />} />
            <Route path="/about" element={<About />} />
            <Route path="/security" element={<Security />} />
            <Route path="/policy" element={<Policy />} />
            <Route path="/terms-of-use" element={<TermsOfService />} />
            <Route path="/contact" element={<ContactUs />} />
          </Routes>
        </div>

        {/* Footer */}
        <Footer />
        <ScrollUpButton />
      </div>
    </Router>
  );
};

export default App;