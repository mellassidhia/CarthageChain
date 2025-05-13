import { GoogleGenAI } from "@google/genai";

class GeminiService {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.backoffTime = 1000; // Initial backoff time in milliseconds
    }

    initialize(apiKey) {
        try {
            if (!apiKey) {
                console.error('No API key provided');
                return false;
            }

            // Initialize GoogleGenAI with the API key
            this.genAI = new GoogleGenAI({ apiKey });

            // Set the default model
            this.model = 'gemini-2.0-flash';

            return true;
        } catch (error) {
            console.error('Error initializing Gemini:', error);
            return false;
        }
    }

    async sendMessage(message) {
        try {
            if (!this.genAI) {
                throw new Error('AI service not initialized. Please initialize with API key first.');
            }

            // Retry mechanism with exponential backoff
            const attempt = async (currentRetry = 0) => {
                try {
                    const response = await this.genAI.models.generateContent({
                        model: this.model,
                        contents: message,
                        generationConfig: {
                            maxOutputTokens: 500,
                        }
                    });

                    // Check if the response has a candidates array and get the first text
                    const responseText = response.candidates && response.candidates[0]?.content?.parts[0]?.text;
                    
                    if (!responseText) {
                        throw new Error('No valid response text found');
                    }

                    // Reset retry count on successful message
                    this.retryCount = 0;

                    return responseText;
                } catch (error) {
                    console.error(`Attempt ${currentRetry + 1} failed:`, error);

                    // Check if we should retry
                    if (currentRetry < this.maxRetries && this.isRetryableError(error)) {
                        // Exponential backoff
                        const waitTime = this.backoffTime * Math.pow(2, currentRetry);
                        
                        console.warn(`Retrying in ${waitTime}ms. Attempt ${currentRetry + 1}`);
                        
                        // Wait before retrying
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        
                        // Recursive retry
                        return attempt(currentRetry + 1);
                    }

                    // If max retries reached or error is not retryable, throw
                    throw error;
                }
            };

            return await attempt();
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    isRetryableError(error) {
        // Check for retriable error conditions
        return (
            error.message.includes('429') || // Too Many Requests
            error.message.includes('quota') || 
            error.message.includes('rate limit') ||
            error.message.includes('Too Many Requests') ||
            error.message.includes('network') ||
            error.message.includes('timeout') ||
            error.message.includes('No valid response text found')
        );
    }

    async getVotingAssistance(query) {
        const context = `You are an AI assistant for CarthageChain - a blockchain-based Tunisian presidential election platform. 
        Provide responses specifically about:
        - CarthageChain's voting process: Once verified, voters can participate using their public wallet address; Navigate to Elections > Ongoing Elections > Select Election > View Candidates > Cast Vote > Receive confirmation with chosen candidate's name > Post-election results available in Election Results
        - Voter registration steps: 1) Visit Voter Registration page 2) Complete form with personal details 3) Upload ID document and profile photo (stored securely on IPFS) 4) Submit MetaMask transaction 5) Check profile for status (Pending/Approved/Rejected) 6) If rejected, review admin notes and resubmit
        - Candidate registration steps: 1) Access Candidate Registration page 2) Provide: Personal Information; Qualifications & Experience; Campaign Details; Required Documents (ID, profile photo, supporter signatures, financial disclosure) 3) Upload verification documents to IPFS 4) Complete MetaMask validation 5) Await admin approval/rejection 6) Resubmit with corrections if denied
        - Platform security: Smart contract audits; MetaMask authentication; Admin-managed registration approvals
        -Definition of blockchain: A decentralized, immutable, and transparent ledger technology
        -Definition of IPFS: A peer-to-peer protocol for storing and sharing data
        -Definition of MetaMask: A browser extension for interacting with the Ethereum blockchain
        - Blockchain & IPFS Integration: Secure document storage on IPFS; Immutable voting records on blockchain; Transparent transaction history
        - Current/past elections: Access Elections section -> Ongoing Elections page for active elections; Election Results page for finalized elections with historical data
        - Candidate and voters profiles securely stored on IPFS with verified credentials
        - Vote encryption and tallying mechanisms
        - Voter authentication using MetaMask: All users start as unregistered; Complete registration form for voter/candidate status; Applications enter Pending Review until admin approval/denial
        - Election results transparency: Final results published by administrator post-election; Available in Election Results page in Elections section with blockchain-verified data
        - Election management tools (online voting, result tallying)
        - Platform documentation: Direct users to Resources section containing Terms of Use, Security Protocols, FAQ, Privacy Policy, and About CarthageChain
        - Community Forum: Discussion platform for election-related topics and voter experiences
        - Rate Us Page: Submit feedback and rate platform experience
        - Election types: Currently supporting presidential elections; Future expansion planned for student/local elections; Dedicated registration forms for each election category
        - Election administration tools (candidate registration, results review): 1) Registration Review Panel - Manage candidate/voter applications 2) Election Control Panel - Create/start/end elections, publish results, reset contract state
        - Notification System: Real-time updates via blockchain events; MetaMask-integrated alerts for registration status, vote confirmations, and election results; Admin notifications for pending approvals

        Only reference features implemented in CarthageChain. For technical questions, mention:
        - Private Ethereum blockchain implementation
        - IPFS for document storage
        - Admin-published election results with blockchain verification
        - Compliance with Tunisian electoral laws and regulations
        - Secure MetaMask authentication for voter/candidate registration and voting
        - User-friendly interface with intuitive navigation
        - Responsive design for optimal viewing on various devices
        - Real-time notification system powered by blockchain events
        - Single administrator model: Always refer to "platform administrator" (singular) for all management functions

        Responses must be English based on user's language. 
        Never discuss other voting systems or platforms.`;
        
        try {
            const fullPrompt = `${context}\n\nUser Query: ${query}`;
            return await this.sendMessage(fullPrompt);
        } catch (error) {
            console.error('Error getting voting assistance:', error);
            
            // Provide more specific error handling
            if (this.isRetryableError(error)) {
                return 'The voting assistant is currently experiencing high traffic. Please try again later.';
            }
            
            // Generic fallback message
            return 'I apologize, but I\'m currently unable to process your request. Please try again later or contact support.';
        }
    }

    resetService() {
        try {
            // Clear any existing state
            this.retryCount = 0;
            return true;
        } catch (error) {
            console.error('Error resetting service:', error);
            return false;
        }
    }
}

export default new GeminiService();