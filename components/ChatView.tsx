
import React, { useState, useContext, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../App';
import { AppContextType, Message } from '../types';
import { getBotResponse } from '../services/geminiService';
import { CopyIcon, SendIcon, BotIcon, UserIcon, MicrophoneIcon } from './icons';

declare var LZString: any;

const ChatView: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const { files, sessions, setSessions } = useContext(AppContext) as AppContextType;
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [shareMessage, setShareMessage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const speechRecognitionRef = useRef<any>(null);

    const currentSession = sessions.find(s => s.id === sessionId);

    useEffect(() => {
        // FIX: Cast window to `any` to access non-standard SpeechRecognition APIs.
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [currentSession?.messages]);

    const handleSend = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading || !currentSession) return;

        const userMessage: Message = { id: `msg-${Date.now()}`, text: trimmedInput, sender: 'user', timestamp: Date.now() };
        
        // --- FIX: Correctly update state to show user message immediately ---
        setSessions(prev => prev.map(s => 
            s.id === sessionId 
                ? { ...s, messages: [...s.messages, userMessage] } 
                : s
        ));
        setInput('');
        setIsLoading(true);

        const documentContext = files.map(f => f.content).join('\n\n---\n\n');
        
        if (files.length === 0) {
            const botMessage: Message = { id: `msg-${Date.now() + 1}`, text: "I can't answer any questions because no documents have been uploaded. An administrator needs to upload files first.", sender: 'bot', timestamp: Date.now() };
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, botMessage] } : s));
            setIsLoading(false);
            return;
        }

        const botResponseText = await getBotResponse(trimmedInput, documentContext);
        const botMessage: Message = { id: `msg-${Date.now() + 1}`, text: botResponseText, sender: 'bot', timestamp: Date.now() };

        // --- Use a functional update to guarantee we're updating the latest state ---
        setSessions(prev => prev.map(s => 
            s.id === sessionId 
                ? { ...s, messages: [...s.messages, botMessage] } 
                : s
        ));
        setIsLoading(false);
    };

    const handleCopyLink = () => {
        if (!currentSession) return;
        const shareableState = { files: files, session: currentSession };
        const jsonString = JSON.stringify(shareableState);
        const compressed = LZString.compressToEncodedURIComponent(jsonString);
        
        // --- FIX: Create a robust URL that works with HashRouter ---
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
        return <div className="text-center pt-24 text-red-400">Chat session not found.</div>;
    }

    return (
        <div className="flex flex-col h-screen pt-16">
            <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center relative">
                <h1 className="text-xl font-bold">{currentSession.title}</h1>
                <div>
                    <button onClick={handleCopyLink} className="flex items-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                        <CopyIcon className="h-4 w-4"/>
                        Share Chat
                    </button>
                    {shareMessage && (
                        <div className="absolute top-full right-4 mt-2 w-72 bg-indigo-700 text-white text-xs rounded-lg shadow-lg p-3 z-10">
                            {shareMessage}
                        </div>
                    )}
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-900">
                {currentSession.messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'bot' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center"><BotIcon className="w-5 h-5 text-white" /></div>}
                        <div className={`max-w-xl p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        {msg.sender === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center"><UserIcon className="w-5 h-5 text-white" /></div>}
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-4 justify-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center"><BotIcon className="w-5 h-5 text-white" /></div>
                        <div className="max-w-xl p-4 rounded-2xl bg-gray-700 text-gray-200 rounded-bl-none">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="container mx-auto">
                    <div className="relative flex items-center gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Ask a question..."
                            className="w-full bg-gray-700 text-gray-200 rounded-lg p-3 pr-24 resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            rows={1}
                            disabled={isLoading}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <button 
                                onClick={handleVoiceInput}
                                disabled={isLoading}
                                className={`p-2 rounded-full ${isListening ? 'bg-red-600 animate-pulse' : 'bg-gray-600 hover:bg-gray-500'} text-white transition-colors`}
                                title="Ask with voice"
                            >
                                <MicrophoneIcon className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
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