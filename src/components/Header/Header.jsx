import { Link } from 'react-router-dom';
import './Header.css'; 

function Header({ wallet, connectWallet, isOwner }) {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <h1>Decentralized Forum</h1>
        </Link>
        
        <div className="wallet-info">
          {wallet ? (
            <div className="connected">
              <span className="address">
                {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}
              </span>
              {isOwner && <span className="owner-badge">Owner</span>}
            </div>
          ) : (
            <button className="connect-btn" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;