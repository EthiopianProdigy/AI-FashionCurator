import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { SendIcon } from './icons/SendIcon';

interface ChatProps {
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
);


const Chat: React.FC<ChatProps> = ({ 
  messages: externalMessages, 
  onSendMessage: externalOnSendMessage, 
  isLoading: externalIsLoading, 
  disabled: externalDisabled 
}) => {
  const [input, setInput] = useState('');
  const [internalMessages, setInternalMessages] = useState<Message[]>([
    { id: 'init1', sender: 'ai', text: "Welcome! Describe the outfit you want and I'll generate it for you." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use external props if provided, otherwise use internal state
  const messages = externalMessages || internalMessages;
  const isLoadingState = externalIsLoading !== undefined ? externalIsLoading : isLoading;
  const disabled = externalDisabled !== undefined ? externalDisabled : false;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoadingState, isLoading, generatedImage]);
  
  const callBackendAPI = async (userPrompt: string): Promise<{ success: boolean; imageBase64?: string; error?: string }> => {
    try {
      const response = await fetch('http://localhost:5000/api/generate-outfit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Backend API request failed' };
      }

      const data = await response.json();
      if (data.success) {
        return { success: true, imageBase64: data.image_base64 };
      } else {
        return { success: false, error: data.error || 'Unknown error from backend' };
      }
    } catch (err) {
      console.error('Backend API call failed:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to connect to backend server. Make sure the Flask server is running on port 5000.' 
      };
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoadingState && !disabled) {
      const userMessage = input.trim();
      
      // If external handler exists, use it
      if (externalOnSendMessage) {
        externalOnSendMessage(userMessage);
        setInput('');
        return;
      }

      // Otherwise, handle internally
      const newUserMessage: Message = { id: `user-${Date.now()}`, text: userMessage, sender: 'user' };
      setInternalMessages(prev => [...prev, newUserMessage]);
      setInput('');
      setError(null);
      setGeneratedImage(null);
      setIsLoading(true);

      // Add loading message
      setInternalMessages(prev => [...prev, { 
        id: `ai-loading-${Date.now()}`, 
        sender: 'ai', 
        text: "Generating your outfit..." 
      }]);

      try {
        const backendResult = await callBackendAPI(userMessage);
        
        if (backendResult.success && backendResult.imageBase64) {
          // Success - display image
          setGeneratedImage(`data:image/png;base64,${backendResult.imageBase64}`);
          setInternalMessages(prev => [...prev, { 
            id: `ai-success-${Date.now()}`, 
            sender: 'ai', 
            text: "Here's your generated outfit!" 
          }]);
        } else {
          // Error
          setError(backendResult.error || 'Failed to generate outfit');
          setInternalMessages(prev => [...prev, { 
            id: `ai-error-${Date.now()}`, 
            sender: 'ai', 
            text: `Sorry, I couldn't generate the outfit: ${backendResult.error || 'Unknown error'}` 
          }]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        setInternalMessages(prev => [...prev, { 
          id: `ai-error-${Date.now()}`, 
          sender: 'ai', 
          text: `Error: ${errorMessage}` 
        }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
       <h2 className="text-xl font-semibold text-gray-700 p-4 border-b">Style Chat</h2>
      {generatedImage && (
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Generated Outfit:</h3>
          <img 
            src={generatedImage} 
            alt="Generated outfit" 
            className="max-w-full h-auto max-h-96 rounded-lg shadow-sm"
          />
        </div>
      )}
      {error && (
        <div className="p-4 border-b bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                    <SparklesIcon className="w-5 h-5" />
                </div>
            )}
             <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        {(isLoadingState || isLoading) && (
            <div className="flex items-end gap-2 justify-start">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                    <SparklesIcon className="w-5 h-5" />
                </div>
                <div className="px-4 py-2 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none">
                    <LoadingSpinner />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={disabled ? "Upload an image first" : "Describe your style (e.g., 'dark and casual outfit for fall')..."}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            disabled={disabled || isLoadingState || isLoading}
          />
          <button
            type="submit"
            disabled={disabled || isLoadingState || isLoading || !input.trim()}
            className="p-3 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
           <SendIcon className="w-6 h-6"/>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
