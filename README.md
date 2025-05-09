# 🗳️ CarthageChain - Decentralized Voting DApp

CarthageChain is a secure, transparent, and decentralized voting platform built using **Ethereum smart contracts**, **React**, and **Flask** for on-chain voting with AI-based sentiment analysis support.

---

## 🚀 Tech Stack

### 🔗 Blockchain (Frontend + Smart Contract)
- **Remix IDE**: For writing and deploying Solidity smart contracts.
- **Ganache**: Local Ethereum testnet for development.
- **Ethers.js**: Ethereum library to interact with smart contracts.
- **MetaMask**: Wallet integration for user authentication.
- **Pinata Cloud**: IPFS-based decentralized storage for user documents and images.

### 🌐 Frontend
- **React 19**
- **Vite** (build tool)
- **Axios** (API communication)
- **FontAwesome** (icons)
- **React Router DOM** (routing)
- **Datetime Picker** (date input)

### 🧠 Backend + AI
- **Flask** (Python web API)
- **Flask-CORS** (cross-origin support)
- **ML Integration** (sentiment analysis for candidate campaigns)
- **Jupyter Notebook** (ML model training)

---

## 📦 Installation

### Prerequisites

- Node.js & npm
- Python 3.10+
- Ganache (CLI or GUI)
- MetaMask extension

### 1. Clone the Project

```bash
git https://github.com/mellassidhia/CarthageChain.git
cd carthagechain
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Start the Frontend
```bash
npm run dev
```
### 4. Set Up Python Environment (Backend)

Navigate to the Flask API directory:
```bash
 cd  .\CarthageChain\src\ml-api\ 
```
✅ **Create and activate a virtual environment:** 
```bash    
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```
📦 **Install Python dependencies:**
```bash   
pip install -r requirements.txt
```
Or install manually:

```bash
pip install flask flask-cors textblob nltk pandas numpy joblib
```
### 5. Run Flask API

```bash
venv\Scripts\activate  
python app.py
```

---

## ⚙️ Smart Contract Deployment

1. Open [Remix IDE](https://remix.ethereum.org/).
2. Create and paste the .sol files in contracts folder.
3. Compile the contract.
4. Deploy using **Injected Web3** with **MetaMask** connected to **Ganache**.

---

## 📤 IPFS Integration with Pinata
To enable decentralized storage for user documents and profile images, we use Pinata Cloud, which provides a gateway to interact with IPFS.

### 1. Add Environment Variables
Create or update your .env file in the root directory with the following:

```bash
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_API_KEY=your_pinata_secret
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/
```
> 🚨 **Important**:  
Never commit your .env file to version control. Use .gitignore to exclude it.

### 2. Update BlockchainService Files
You must replace hardcoded contract addresses with environment variables to support dynamic deployment. In the following files:
```bash
src/services/BlockchainService.js
src/utils/ratingBlockchain.js
src/utils/ratingBlockchain.js
```

---

## 🧠 Machine Learning Features

- **Sentiment Analysis**: Utilizes `TextBlob` and `nltk` for analyzing campaign texts.
- Trained in **Jupyter Notebook** and served via a **Flask API**.
- Accepts candidate campaign content and returns a **sentiment score**:
  - Positive
  - Neutral
  - Negative

> ⚠️ **Important**:  
To enable sentiment analysis, you must **download the dataset manually** from [this Kaggle link](https://www.kaggle.com/datasets/manchunhui/us-election-2020-tweets).  
Once downloaded, place the two `.csv` files into the following directory:
```bash
src/ml-api/data/
```

---

## 📁 Project Structure
<pre> CarthageChain/
├── .env                      # Environment variables
├── .vscode/                 # VSCode settings (optional)
├── node_modules/            # Installed dependencies
├── public/                  # Static assets
├── src/
│   ├── assets/              # Images, icons, etc.
│   ├── components/          # Reusable React components
│   ├── context/             # React context providers (e.g., auth, theme)
│   ├── contracts/           # Solidity smart contracts (ABI, deployments, smart Contract)
│   ├── ml-api/              # Flask API and ML model integration
│   ├── pages/               # Page-level components (e.g., Home, Dashboard)
│   ├── services/
│   │   └── BlockchainService.js    # Service for blockchain interaction
│   ├── utils/
│   │   ├── blockchain.js           # Web3 helper functions
│   │   ├── predictionUtils.js      # AI prediction utilities
│   │   └── ratingBlockchain.js     # Blockchain voting/rating logic
│   ├── App.jsx               # Root React component
│   ├── App.css               # App-wide styling
│   ├── index.css             # Global styles
│   └── main.jsx              # Entry point for React app
├── .gitignore
├── index.html               # HTML entry point for Vite
├── package.json
├── package-lock.json
├── vite.config.js           # Vite configuration
├── eslint.config.js         # Linting configuration
└── README.md</pre>

---

## ✅ Features

- 🔐 **MetaMask Login & Signature Verification**
- 🗳️ **Decentralized Voter & Candidate Registration**
- 📝 **Admin Panel for Approval/Rejection**
- 🧾 **Candidate Profiles with Campaign Description**
- 🤖 **Sentiment Analysis on Campaign Data (ML)**
- 🧾 **IPFS Integration for Storing User Images/Documents**

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

Developed by the **Dhia Mellassi**
