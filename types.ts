// FIX: Import React to use React.Dispatch and React.SetStateAction which were causing namespace errors.
import type * as React from 'react';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  content: string; // File content as a string
}

export interface ChatSession {
  id:string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface AppContextType {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  sessions: ChatSession[];
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
}