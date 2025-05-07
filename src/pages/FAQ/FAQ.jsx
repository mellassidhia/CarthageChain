import './FAQ.css'; 

const FAQ = () => {
  return (
    <div className="faq-container">
      <h1>Frequently Asked Questions - CarthageChain</h1>

      <div className="faq-item">
        <h2>What is a dApp platform?</h2>
        <p>
          A dApp platform is a software platform that supports decentralized applications (dApps). dApps run their backend code on a decentralized network and not a centralized server. 
          This means that a blockchain is used for data storage and smart contracts for their app logic.
        </p>
      </div>

      <div className="faq-item">
        <h2>What is a blockchain?</h2>
        <p>
          A blockchain is a transactional database or public ledger that is created and maintained by a network of computers/servers. 
          The various computers and/or servers that power the network take turns verifying sets of transactions and adding them to the database, 
          which are referred to as blocks. These “blocks” of transactions are mathematically linked to one another in a way that resembles a chain, 
          hence the name blockchain. Once stored in the database, these transactions are permanent and irreversible. 
          Our online voting platform has a blockchain-based ballot box that allows votes to be securely stored within the system.
        </p>
      </div>

      <div className="faq-item">
        <h2>What are smart contracts?</h2>
        <p>
          A smart contract is a set of rules that remain on the blockchain for all to see. Smart contracts operate precisely according to those rules. 
          The code allows agreements and transactions to be completed automatically.
        </p>
      </div>

      <div className="faq-item">
        <h2>What are the benefits of dApps?</h2>
        <p>
          dApps can look and feel just like regular apps, but they receive the same benefits of the blockchain they interact with. 
          This includes freedom from censorship, cryptographic security, increased efficiency, and greater transparency.
        </p>
      </div>

      <div className="faq-item">
        <h2>What is CarthageChain?</h2>
        <p>
          CarthageChain is a blockchain-based voting platform designed to provide secure, transparent, and tamper-proof elections. 
          It leverages Ethereum smart contracts to ensure that votes are immutable and verifiable.
        </p>
      </div>

      <div className="faq-item">
        <h2>How does CarthageChain ensure vote security?</h2>
        <p>
          Votes are recorded on the Ethereum blockchain using smart contracts, making them immutable and resistant to tampering.
          This ensures transparency and builds trust in the electoral process.
        </p>
      </div>

      <div className="faq-item">
        <h2>Who can participate in CarthageChain elections?</h2>
        <p>
          The platform supports various roles including voters, candidates, and administrators.
          Voters can cast their votes, candidates can manage their profiles and electoral programs, and administrators can create and supervise elections.
        </p>
      </div>

      <div className="faq-item">
        <h2>How do I log in to CarthageChain?</h2>
        <p>
          Users can log in via MetaMask for blockchain authentication or through standard email/password methods, depending on their role.
        </p>
      </div>

      <div className="faq-item">
        <h2>What are the benefits of using blockchain for elections?</h2>
        <p>
          Blockchain provides decentralization, transparency, and security, which help prevent fraud, ensure vote integrity, 
          and increase trust in the electoral process.
        </p>
      </div>

      <div className="faq-item">
        <h2>What technologies power CarthageChain?</h2>
        <p>
          CarthageChain utilizes React.js on the frontend, Node.js with Express.js on the backend, MongoDB for data storage, 
          and Ethereum (with ethers.js and Ganache for testing) for blockchain operations.
        </p>
      </div>

    </div>
  );
};

export default FAQ;
