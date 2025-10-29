import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BotIcon } from './icons';

export const Header: React.FC = () => {
    const location = useLocation();
    
    return (
        <header className="bg-white/80 backdrop-blur-sm p-4 border-b border-slate-200 fixed top-0 left-0 right-0 z-50 shadow-sm">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/admin" className="flex items-center gap-3 text-xl font-bold text-slate-800 hover:text-indigo-600 transition-colors">
                    <BotIcon className="w-8 h-8 text-indigo-600" />
                    <h1>Chat with Param (RAG)</h1>
                </Link>
                <nav>
                    <Link 
                        to="/admin" 
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/admin' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                        Admin Dashboard
                    </Link>
                </nav>
            </div>
        </header>
    );
};