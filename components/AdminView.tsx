
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { AppContextType, UploadedFile, ChatSession } from '../types';
import { UploadIcon, FileIcon, TrashIcon, PlusIcon, ChatBubbleIcon, EyeIcon, PencilIcon } from './icons';
import { useNavigate } from 'react-router-dom';

declare var mammoth: any;
declare var pdfjsLib: any;

const FileViewerModal: React.FC<{ file: UploadedFile; onClose: () => void }> = ({ file, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-indigo-400 truncate">{file.name}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div className="p-4 overflow-y-auto">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">{file.content}</pre>
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
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setIsProcessing(true);
      const fileList = Array.from(event.target.files);
      const newFiles: UploadedFile[] = [];

      // FIX: The left-hand side of a 'for...of' statement cannot use a type annotation.
      // The type of `file` is correctly inferred from `fileList`.
      for (const file of fileList) {
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

  const createNewChat = () => {
    const newSessionId = `chat-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: `New Chat Session`,
      messages: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    navigate(`/chat/${newSessionId}`);
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleStartEdit = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveTitle = () => {
    if (!editingSessionId) return;
    setSessions(prev => prev.map(s => s.id === editingSessionId ? { ...s, title: editingTitle.trim() || "Untitled Chat" } : s));
    setEditingSessionId(null);
    setEditingTitle('');
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
      {viewingFile && <FileViewerModal file={viewingFile} onClose={() => setViewingFile(null)} />}
      <div className="container mx-auto p-4 pt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
              <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
                  <h2 className="text-2xl font-bold mb-4 text-indigo-400">Manage Database</h2>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                      <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                      <label htmlFor="file-upload" className={`mt-4 inline-block text-white font-bold py-2 px-4 rounded-lg transition-colors ${isProcessing ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'}`}>
                          {isProcessing ? 'Processing...' : 'Upload Files'}
                      </label>
                      <input id="file-upload" type="file" multiple accept=".txt,.md,.csv,.pdf,.docx" className="hidden" onChange={handleFileChange} disabled={isProcessing} />
                      <p className="mt-2 text-sm text-gray-400">Upload .txt, .md, .csv, .pdf, or .docx files.</p>
                  </div>
                  <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2">Uploaded Files:</h3>
                      {files.length === 0 ? (
                          <p className="text-gray-400">No files uploaded yet.</p>
                      ) : (
                          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                          {files.map(file => (
                              <li key={file.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-md group">
                              <div className="flex items-center gap-3 overflow-hidden">
                                  <FileIcon className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                                  <span className="text-sm font-medium truncate" title={file.name}>{file.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => setViewingFile(file)} className="text-sky-400 hover:text-sky-300 opacity-0 group-hover:opacity-100 transition-opacity" title="View Content">
                                    <EyeIcon className="h-5 w-5" />
                                </button>
                                <button onClick={() => removeFile(file.id)} className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete File">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                              </li>
                          ))}
                          </ul>
                      )}
                  </div>
              </section>
              
              <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-indigo-400">Manage Chats</h2>
                      <button onClick={createNewChat} className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                          <PlusIcon className="h-5 w-5" /> New Chat
                      </button>
                  </div>
                  {sessions.length === 0 ? (
                      <p className="text-gray-400">No chat sessions started yet.</p>
                  ) : (
                      <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {sessions.map(session => (
                          <li key={session.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-md hover:bg-gray-600 transition-colors group">
                            <div className="flex items-center gap-3 w-full" >
                                <ChatBubbleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                                <div className="flex-grow" onClick={() => editingSessionId !== session.id && navigate(`/chat/${session.id}`)}>
                                  {editingSessionId === session.id ? (
                                    <input
                                      type="text"
                                      value={editingTitle}
                                      onChange={(e) => setEditingTitle(e.target.value)}
                                      onBlur={handleSaveTitle}
                                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditingSessionId(null); }}
                                      className="bg-gray-600 text-white p-1 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      autoFocus
                                    />
                                  ) : (
                                    <>
                                      <p className="font-semibold cursor-pointer">{session.title}</p>
                                      <p className="text-xs text-gray-400 cursor-pointer">
                                          {new Date(session.createdAt).toLocaleString()} - {session.messages.length} messages
                                      </p>
                                    </>
                                  )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleStartEdit(session)} className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <PencilIcon className="h-5 w-5" />
                                </button>
                                <button onClick={() => deleteSession(session.id)} className="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                          </li>
                      ))}
                      </ul>
                  )}
              </section>
          </div>
          <div className="md:col-span-1">
              <aside className="bg-gray-800 p-6 rounded-lg shadow-lg sticky top-24">
                  <h2 className="text-2xl font-bold mb-4 text-indigo-400 border-b border-gray-700 pb-2">Analysis</h2>
                  <div className="space-y-4 mt-4">
                      <div className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
                          <span className="font-medium text-gray-300">Knowledge Files</span>
                          <span className="font-bold text-2xl text-indigo-400">{analysisStats.fileCount}</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
                          <span className="font-medium text-gray-300">Chat Sessions</span>
                          <span className="font-bold text-2xl text-indigo-400">{analysisStats.sessionCount}</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
                          <span className="font-medium text-gray-300">Avg. Msgs / Session</span>
                          <span className="font-bold text-2xl text-indigo-400">{analysisStats.avgMessages}</span>
                      </div>
                  </div>
              </aside>
          </div>
      </div>
    </>
  );
};

export default AdminView;