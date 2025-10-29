import React, { createContext, useContext, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useLocalStorage } from './hooks/useLocalStorage';
import { UploadedFile, ChatSession, AppContextType } from './types';
import AdminView from './components/AdminView';
import ChatView from './components/ChatView';
import { Header } from './components/Header';

declare var LZString: any;

export const AppContext = createContext<AppContextType | null>(null);

const SharedChatLoader: React.FC = () => {
    const { data } = useParams<{ data: string }>();
    const { setFiles, setSessions } = useContext(AppContext) as AppContextType;
    const navigate = useNavigate();
  
    useEffect(() => {
      if (data) {
        try {
          const jsonString = LZString.decompressFromEncodedURIComponent(data);
          const sharedState: { files: UploadedFile[], session: ChatSession } = JSON.parse(jsonString);
          
          if (!sharedState.files || !sharedState.session) {
            throw new Error("Invalid shared data structure");
          }

          const { files: sharedFiles, session: sharedSession } = sharedState;
  
          // Merge files, avoiding duplicates
          setFiles(prevFiles => {
            const existingFileIds = new Set(prevFiles.map(f => f.id));
            const newFiles = sharedFiles.filter(sf => !existingFileIds.has(sf.id));
            return [...prevFiles, ...newFiles];
          });
  
          // Merge session, overwriting if it exists
          setSessions(prevSessions => {
            const sessionExists = prevSessions.some(s => s.id === sharedSession.id);
            if (sessionExists) {
              return prevSessions.map(s => s.id === sharedSession.id ? sharedSession : s);
            } else {
              return [...prevSessions, sharedSession];
            }
          });
  
          navigate(`/chat/${sharedSession.id}`, { replace: true });
        } catch (e) {
          console.error("Failed to load shared chat:", e);
          alert("The shared link is invalid or corrupted. Redirecting to admin page.");
          navigate('/admin', { replace: true });
        }
      }
    }, [data, setFiles, setSessions, navigate]);
    
    return (
        <div className="flex justify-center items-center h-screen bg-slate-100">
            <div className="text-center text-slate-600">
                <p className="text-xl">Loading shared chat...</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                </div>
            </div>
        </div>
    );
};

function App() {
  const [files, setFiles] = useLocalStorage<UploadedFile[]>('rag-files', []);
  const [sessions, setSessions] = useLocalStorage<ChatSession[]>('rag-sessions', []);

  return (
    <AppContext.Provider value={{ files, setFiles, sessions, setSessions }}>
      <HashRouter>
        <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
          <Header />
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<AdminView />} />
            <Route path="/chat/:sessionId" element={<ChatView />} />
            <Route path="/share/:data" element={<SharedChatLoader />} />
          </Routes>
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
}

export default App;