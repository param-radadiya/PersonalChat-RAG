import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext } from '../App';
import { AppContextType, UploadedFile, ChatSession, Message } from '../types';
import { UploadIcon, FileIcon, TrashIcon, PlusIcon, ChatBubbleIcon, EyeIcon, PencilIcon } from './icons';
import { useNavigate } from 'react-router-dom';

declare var mammoth: any;
declare var pdfjsLib: any;

const FileViewerModal: React.FC<{ file: UploadedFile; onClose: () => void }> = ({ file, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col text-slate-800" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-indigo-600 truncate">{file.name}</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">&times;</button>
                </div>
                <div className="p-4 overflow-y-auto bg-slate-50 rounded-b-lg">
                    <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans">{file.content}</pre>
                </div>
            </div>
        </div>
    );
};

const NewChatModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, delay: number) => void;
}> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('New Chat Session');
  const [delay, setDelay] = useState(0);

  const handleCreate = () => {
    if (!title.trim()) {
      alert("Chat title cannot be empty.");
      return;
    }
    onCreate(title, delay);
    setTitle('New Chat Session');
    setDelay(0);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6">
                <h3 className="text-xl font-bold text-indigo-600 mb-6">Create New Chat</h3>
                <div className="space-y-5">
                    <div>
                        <label htmlFor="chat-title" className="block text-sm font-medium text-slate-700 mb-1">Chat Title</label>
                        <input
                            type="text"
                            id="chat-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-100 border-slate-300 border text-slate-800 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                            placeholder="e.g., Project Discussion"
                        />
                    </div>
                    <div>
                        <label htmlFor="chat-delay" className="block text-sm font-medium text-slate-700 mb-1">Message Cooldown (seconds)</label>
                        <input
                            type="number"
                            id="chat-delay"
                            min="0"
                            value={delay}
                            onChange={(e) => setDelay(Math.max(0, Number(e.target.value)))}
                            className="w-full bg-slate-100 border-slate-300 border text-slate-800 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                        />
                        <p className="text-xs text-slate-500 mt-2">Set a delay after each bot response to control message frequency. Use 0 for no delay.</p>
                    </div>
                </div>
            </div>
            <div className="bg-slate-50 p-4 flex justify-end gap-3 rounded-b-xl border-t border-slate-200">
                <button onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors">
                    Cancel
                </button>
                <button onClick={handleCreate} className="px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-300">
                    Create & Start Chat
                </button>
            </div>
        </div>
    </div>
  );
};

const EditChatModal: React.FC<{
  session: ChatSession;
  onClose: () => void;
  onSave: (title: string, delay: number) => void;
}> = ({ session, onClose, onSave }) => {
  const [title, setTitle] = useState(session.title);
  const [delay, setDelay] = useState(session.delaySeconds || 0);

  useEffect(() => {
    setTitle(session.title);
    setDelay(session.delaySeconds || 0);
  }, [session]);

  const handleSave = () => {
    if (!title.trim()) {
      alert("Chat title cannot be empty.");
      return;
    }
    onSave(title.trim(), delay);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6">
                <h3 className="text-xl font-bold text-indigo-600 mb-6">Edit Chat</h3>
                <div className="space-y-5">
                    <div>
                        <label htmlFor="edit-chat-title" className="block text-sm font-medium text-slate-700 mb-1">Chat Title</label>
                        <input
                            type="text"
                            id="edit-chat-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-100 border-slate-300 border text-slate-800 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                            placeholder="e.g., Project Discussion"
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-chat-delay" className="block text-sm font-medium text-slate-700 mb-1">Message Cooldown (seconds)</label>
                        <input
                            type="number"
                            id="edit-chat-delay"
                            min="0"
                            value={delay}
                            onChange={(e) => setDelay(Math.max(0, Number(e.target.value)))}
                            className="w-full bg-slate-100 border-slate-300 border text-slate-800 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                        />
                        <p className="text-xs text-slate-500 mt-2">Set a delay after each bot response to control message frequency. Use 0 for no delay.</p>
                    </div>
                </div>
            </div>
            <div className="bg-slate-50 p-4 flex justify-end gap-3 rounded-b-xl border-t border-slate-200">
                <button onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors">
                    Cancel
                </button>
                <button onClick={handleSave} className="px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-300">
                    Save Changes
                </button>
            </div>
        </div>
    </div>
  );
};


const AdminView: React.FC = () => {
  const { files, setFiles, sessions, setSessions } = useContext(AppContext) as AppContextType;
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingFile, setViewingFile] = useState<UploadedFile | null>(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ChatSession | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setIsProcessing(true);
      const fileList = Array.from(event.target.files);
      const newFiles: UploadedFile[] = [];

      for (const file of fileList as File[]) {
        let content = '';
        const extension = file.name.split('.').pop()?.toLowerCase();

        try {
          if (extension === 'pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              content += textContent.items.map((item: any) => item.str).join(' ');
            }
          } else if (extension === 'docx') {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            content = result.value;
          } else if (['txt', 'md', 'csv'].includes(extension || '')) {
            content = await file.text();
          } else {
            alert(`Unsupported file type: ${file.name}. Only .txt, .md, .csv, .pdf, and .docx are supported.`);
            continue;
          }
          
          newFiles.push({
            id: `${file.name}-${Date.now()}`,
            name: file.name,
            content: content,
          });

        } catch (error) {
          console.error('Error processing file:', file.name, error);
          alert(`Could not process file: ${file.name}`);
        }
      }
      setFiles(prev => [...prev, ...newFiles]);
      setIsProcessing(false);
    }
  };
  
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleCreateNewChat = (title: string, delay: number) => {
    const newSessionId = `chat-${Date.now()}`;
    
    const documentNames = files.map(f => `"${f.name}"`).join(', ');
    const welcomeText = files.length > 0 
      ? `Hi there! I'm ready to help. You can ask me questions about the following documents: ${documentNames}, or we can discuss a general topic. How can I assist you today?`
      : `Hi there! I'm ready to help. Please note that no documents have been uploaded yet, so I'll be answering from my general knowledge. How can I assist you today?`;
      
    const initialBotMessage: Message = {
      id: `msg-bot-${Date.now()}`,
      text: welcomeText,
      sender: 'bot',
      timestamp: Date.now(),
    };

    const newSession: ChatSession = {
      id: newSessionId,
      title: title,
      messages: [initialBotMessage],
      createdAt: Date.now(),
      delaySeconds: delay,
    };
    setSessions(prev => [newSession, ...prev]);
    setIsNewChatModalOpen(false);
    navigate(`/chat/${newSessionId}`);
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleSaveEdit = (updatedTitle: string, updatedDelay: number) => {
    if (!editingSession) return;
    setSessions(prev => 
      prev.map(s => 
        s.id === editingSession.id 
          ? { ...s, title: updatedTitle, delaySeconds: updatedDelay } 
          : s
      )
    );
    setEditingSession(null);
  };

  const analysisStats = useMemo(() => {
    const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);
    const avgMessages = sessions.length > 0 ? (totalMessages / sessions.length).toFixed(1) : 0;
    return {
      fileCount: files.length,
      sessionCount: sessions.length,
      avgMessages,
    }
  }, [files, sessions]);

  return (
    <>
      <NewChatModal isOpen={isNewChatModalOpen} onClose={() => setIsNewChatModalOpen(false)} onCreate={handleCreateNewChat} />
      {editingSession && (
        <EditChatModal 
          session={editingSession} 
          onClose={() => setEditingSession(null)} 
          onSave={handleSaveEdit}
        />
      )}
      {viewingFile && <FileViewerModal file={viewingFile} onClose={() => setViewingFile(null)} />}
      <div className="container mx-auto p-4 pt-24 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
              <section className="bg-white p-6 rounded-xl shadow-lg shadow-blue-500/5">
                  <h2 className="text-2xl font-bold mb-4 text-indigo-600">Manage Database</h2>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                      <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
                      <label htmlFor="file-upload" className={`mt-4 inline-block text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 ${isProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30'}`}>
                          {isProcessing ? 'Processing...' : 'Upload Files'}
                      </label>
                      <input id="file-upload" type="file" multiple accept=".txt,.md,.csv,.pdf,.docx" className="hidden" onChange={handleFileChange} disabled={isProcessing} />
                      <p className="mt-2 text-sm text-slate-500">Upload .txt, .md, .csv, .pdf, or .docx files.</p>
                  </div>
                  <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2 text-slate-700">Uploaded Files:</h3>
                      {files.length === 0 ? (
                          <p className="text-slate-500">No files uploaded yet.</p>
                      ) : (
                          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                          {files.map(file => (
                              <li key={file.id} className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 p-3 rounded-md group transition-colors">
                              <div className="flex items-center gap-3 overflow-hidden">
                                  <FileIcon className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                                  <span className="text-sm font-medium text-slate-700 truncate" title={file.name}>{file.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => setViewingFile(file)} className="text-sky-500 hover:text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity" title="View Content">
                                    <EyeIcon className="h-5 w-5" />
                                </button>
                                <button onClick={() => removeFile(file.id)} className="text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete File">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                              </li>
                          ))}
                          </ul>
                      )}
                  </div>
              </section>
              
              <section className="bg-white p-6 rounded-xl shadow-lg shadow-blue-500/5">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-indigo-600">Manage Chats</h2>
                      <button onClick={() => setIsNewChatModalOpen(true)} className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30">
                          <PlusIcon className="h-5 w-5" /> New Chat
                      </button>
                  </div>
                  {sessions.length === 0 ? (
                      <p className="text-slate-500">No chat sessions started yet.</p>
                  ) : (
                      <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {sessions.map(session => (
                          <li key={session.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-md hover:shadow-md hover:border-slate-300 border border-transparent transition-all duration-200 group">
                            <div className="flex items-center gap-3 w-full" >
                                <ChatBubbleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                                <div className="flex-grow cursor-pointer" onClick={() => navigate(`/chat/${session.id}`)}>
                                    <p className="font-semibold text-slate-800">{session.title}</p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(session.createdAt).toLocaleString()} - {session.messages.length} messages
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setEditingSession(session)} className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Edit Chat">
                                    <PencilIcon className="h-5 w-5" />
                                </button>
                                <button onClick={() => deleteSession(session.id)} className="text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Chat">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                          </li>
                      ))}
                      </ul>
                  )}
              </section>
          </div>
          <div className="lg:col-span-1">
              <aside className="bg-white p-6 rounded-xl shadow-lg shadow-blue-500/5 sticky top-24">
                  <h2 className="text-2xl font-bold mb-4 text-indigo-600 border-b border-slate-200 pb-2">Analysis</h2>
                  <div className="space-y-4 mt-4">
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md">
                          <span className="font-medium text-slate-600">Knowledge Files</span>
                          <span className="font-bold text-2xl text-indigo-600">{analysisStats.fileCount}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md">
                          <span className="font-medium text-slate-600">Chat Sessions</span>
                          <span className="font-bold text-2xl text-indigo-600">{analysisStats.sessionCount}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md">
                          <span className="font-medium text-slate-600">Avg. Msgs / Session</span>
                          <span className="font-bold text-2xl text-indigo-600">{analysisStats.avgMessages}</span>
                      </div>
                  </div>
              </aside>
          </div>
      </div>
    </>
  );
};

export default AdminView;
