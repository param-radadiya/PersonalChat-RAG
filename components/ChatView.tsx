
import React, { useState, useContext, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { AppContextType, Message } from '../types';
import { getBotResponse } from '../services/geminiService';
import { CopyIcon, SendIcon, BotIcon, UserIcon, MicrophoneIcon, ArrowLeftIcon } from './icons';

declare var LZString: any;

const ChatView: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const { files, sessions, setSessions } = useContext(AppContext) as AppContextType;
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [shareMessage, setShareMessage] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const speechRecognitionRef = useRef<any>(null);
    const wasLoading = useRef(false);

    const currentSession = sessions.find(s => s.id === sessionId);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            speechRecognitionRef.current = new SpeechRecognition();
            speechRecognitionRef.current.continuous = false;
            speechRecognitionRef.current.interimResults = false;
            speechRecognitionRef.current.lang = 'en-US';

            speechRecognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev ? `${prev} ${transcript}` : transcript);
                setIsListening(false);
            };
            speechRecognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                alert(`Speech recognition error: ${event.error}`);
                setIsListening(false);
            };
            speechRecognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);
    
    // Effect to handle the start of the cooldown
    useEffect(() => {
        // If the state just changed from loading to not loading
        if (wasLoading.current && !isLoading) {
            // And if the session has a defined delay
            if (currentSession?.delaySeconds && currentSession.delaySeconds > 0) {
                setCooldown(currentSession.delaySeconds);
            }
        }
        // Update the ref to the current loading state for the next render.
        wasLoading.current = isLoading;
    }, [isLoading, currentSession]);
    
    // Effect for the countdown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => {
                setCooldown(c => c - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [currentSession?.messages]);

    const handleSend = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading || !currentSession || cooldown > 0) return;
    
        setIsLoading(true);
        setInput('');
    
        const userMessage: Message = {
            id: `msg-user-${Date.now()}`,
            text: trimmedInput,
            sender: 'user',
            timestamp: Date.now()
        };
    
        const botMessageId = `msg-bot-${Date.now()}`;
        const botLoadingMessage: Message = {
            id: botMessageId,
            text: '', // Text is empty while loading
            sender: 'bot',
            timestamp: Date.now(),
            isLoading: true,
        };
    
        setSessions(prev => prev.map(s => 
            s.id === sessionId 
                ? { ...s, messages: [...s.messages, userMessage, botLoadingMessage] } 
                : s
        ));
    
        const documentContext = files.map(f => f.content).join('\n\n---\n\n');
    
        let botResponseText;
        if (files.length === 0 && currentSession.messages.length <= 2) { 
             botResponseText = await getBotResponse(trimmedInput, "No context provided.");
        } else if (files.length === 0) {
             botResponseText = "Please upload documents in the admin panel to ask questions about them. I can still chat about general topics.";
        }
        else {
            botResponseText = await getBotResponse(trimmedInput, documentContext);
        }
    
        const finalBotMessage: Message = {
            id: botMessageId,
            text: botResponseText,
            sender: 'bot',
            timestamp: Date.now(),
            isLoading: false,
        };
    
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                return { ...s, messages: s.messages.map(m => m.id === botMessageId ? finalBotMessage : m) };
            }
            return s;
        }));
    
        setIsLoading(false);
    };


    const handleCopyLink = () => {
        if (!currentSession) return;
        const shareableState = { files: files, session: currentSession };
        const jsonString = JSON.stringify(shareableState);
        const compressed = LZString.compressToEncodedURIComponent(jsonString);
        
        const baseUrl = window.location.href.split('#')[0];
        const url = `${baseUrl}#/share/${compressed}`;

        navigator.clipboard.writeText(url);
        setShareMessage('Link copied! Note: The app must be on a public URL for others to use this link.');
        setTimeout(() => setShareMessage(null), 5000);
    };

    const handleVoiceInput = () => {
        if (!speechRecognitionRef.current) {
            alert("Speech recognition is not supported in your browser.");
            return;
        }
        if (isListening) {
            speechRecognitionRef.current.stop();
        } else {
            speechRecognitionRef.current.start();
            setIsListening(true);
        }
    };

    if (!currentSession) {
        return <div className="text-center pt-24 text-red-500">Chat session not found.</div>;
    }

    return (
        <div className="flex flex-col h-screen pt-16 bg-slate-100">
            <header className="bg-white/80 backdrop-blur-sm p-4 border-b border-slate-200 flex justify-between items-center relative z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin')}
                        className="p-2 rounded-full hover:bg-slate-200 transition-colors"
                        title="Back to Dashboard"
                        aria-label="Back to Dashboard"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 truncate" title={currentSession.title}>{currentSession.title}</h1>
                </div>
                <div>
                    <button onClick={handleCopyLink} className="flex items-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 text-sm">
                        <CopyIcon className="h-4 w-4"/>
                        Share Chat
                    </button>
                    {shareMessage && (
                        <div className="absolute top-full right-4 mt-2 w-72 bg-indigo-600 text-white text-xs rounded-lg shadow-xl shadow-indigo-500/10 p-3 z-20">
                            {shareMessage}
                        </div>
                    )}
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {currentSession.messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'bot' && <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-300"><BotIcon className="w-5 h-5 text-white" /></div>}
                        <div className={`max-w-xl p-4 rounded-2xl shadow-md ${msg.sender === 'user' ? 'bg-indigo-500 text-white rounded-br-none shadow-indigo-500/30' : 'bg-white text-slate-700 rounded-bl-none shadow-slate-500/10 border border-slate-200'}`}>
                           {msg.isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse"></div>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            )}
                        </div>
                        {msg.sender === 'user' && <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center shadow-sm shadow-indigo-300"><UserIcon className="w-5 h-5 text-white" /></div>}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 bg-white/80 backdrop-blur-sm border-t border-slate-200 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
                <div className="container mx-auto">
                    {cooldown > 0 && (
                        <div className="text-center text-sm text-indigo-600 mb-2 font-medium">
                            Next message in {cooldown} second{cooldown > 1 ? 's' : ''}...
                        </div>
                    )}
                    <div className="relative flex items-center gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={cooldown > 0 ? "Please wait for the cooldown..." : "Ask a question..."}
                            className="w-full bg-slate-100 border-slate-200 border text-slate-800 rounded-lg p-3 pr-28 resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow disabled:bg-slate-200 disabled:cursor-not-allowed"
                            rows={1}
                            disabled={isLoading || cooldown > 0}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button 
                                onClick={handleVoiceInput}
                                disabled={isLoading || cooldown > 0}
                                className={`p-2 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 hover:bg-slate-300 text-slate-600'} transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed`}
                                title="Ask with voice"
                            >
                                <MicrophoneIcon className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={handleSend}
                                disabled={isLoading || !input.trim() || cooldown > 0}
                                className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30"
                                title="Send message"
                            >
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ChatView;