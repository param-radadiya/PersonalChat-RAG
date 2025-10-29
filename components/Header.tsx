
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BotIcon } from './icons';

export const Header: React.FC = () => {
    const location = useLocation();
    
    return (
        <header className="bg-gray-800/50 backdrop-blur-sm p-4 border-b border-gray-700 fixed top-0 left-0 right-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/admin" className="flex items-center gap-2 text-xl font-bold text-white hover:text-indigo-400 transition-colors">
                    <BotIcon className="w-8 h-8 text-indigo-500" />
                    <h1>PersonaChat RAG</h1>
                </Link>
                <nav>
                    <Link 
                        to="/admin" 
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/admin' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                    >
                        Admin Dashboard
                    </Link>
                </nav>
            </div>
        </header>
    );
};
