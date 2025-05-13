import React, { useState, useEffect, useRef } from 'react';
import './ChatBot.css';
import GeminiService from '../../services/GeminiService';
import DOMPurify from 'dompurify'; // Import DOMPurify

const ChatBot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [serviceStatus, setServiceStatus] = useState({
        message: 'Connecting to Voting Assistant...',
        type: 'system'
    });
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Initialize Gemini with your API key
        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        if (API_KEY) {
            const initialized = GeminiService.initialize(API_KEY);
            setIsInitialized(initialized);

            // Update service status based on initialization
            if (initialized) {
                setServiceStatus({
                    message: 'Voting Assistant is ready to help!',
                    type: 'system success'
                });
            } else {
                setServiceStatus({
                    message: 'Voting Assistant is currently unavailable. Please try again later.',
                    type: 'system error'
                });
            }
        } else {
            // No API key provided
            setServiceStatus({
                message: 'Voting Assistant requires configuration. Please contact support.',
                type: 'system error'
            });
        }
    }, []);

    const formatBotMessage = (text) => {
        let output = text;

        // Bold Text
        output = output.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

        // Lists (Numbered and Bulleted)
        const lines = output.split('\n');
        let inList = false;
        const listItems = [];
        const processedLines = lines.reduce((acc, line) => {
            const listItemMatch = line.match(/^\s*(\d+\.|-|\*)\s+(.*)/); // Matches 1., -, or *
            if (listItemMatch) {
                if (!inList) {
                    acc.push('<ul>');
                    inList = true;
                }
                listItems.push(`<li>${listItemMatch[2]}</li>`);
            } else {
                if (inList) {
                    acc.push(listItems.join(''));
                    acc.push('</ul>');
                    inList = false;
                    listItems.length = 0;
                }
                acc.push(line);
            }
            return acc;
        }, []);

        if (inList) {
            processedLines.push(listItems.join(''));
            processedLines.push('</ul>');
        }

        output = processedLines.join('\n');

        // Sanitize HTML
        return DOMPurify.sanitize(output);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || !isInitialized) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message
        setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
        setIsLoading(true);

        try {
            const response = await GeminiService.getVotingAssistance(userMessage);
            setMessages(prev => [...prev, {
                text: response,
                sender: 'bot',
                formattedText: formatBotMessage(response) // Store formatted version
            }]);
        } catch (error) {
            console.error('Error getting response:', error);
            setMessages(prev => [...prev, {
                text: 'Sorry, I encountered an error. Please try again later.',
                sender: 'bot',
                error: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="chatbot-container">
            <button
                className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
                onClick={toggleChat}
            >
                {isOpen ? '×' : '💬'}
            </button>

            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <h3>Voting Assistant</h3>
                    </div>

                    <div className="chatbot-messages">
                        {/* Service Status Message */}
                        {serviceStatus && (
                            <div className={`message ${serviceStatus.type}`}>
                                {serviceStatus.message}
                            </div>
                        )}

                        {/* Initial Welcome Message */}
                        {messages.length === 0 && (
                            <div className="welcome-message">
                                Hello! I'm your voting assistant. How can I help you today?
                            </div>
                        )}

                        {/* Message History */}
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`message ${message.sender} ${message.error ? 'error' : ''}`}
                            >
                                {message.sender === 'bot' && message.formattedText ? (
                                    <div dangerouslySetInnerHTML={{ __html: message.formattedText }} />
                                ) : (
                                    message.text
                                )}
                            </div>
                        ))}

                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className="message bot loading">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="chatbot-input">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            disabled={isLoading || !isInitialized}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim() || !isInitialized}
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatBot;