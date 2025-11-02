
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

interface PromptControlProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  disabled: boolean;
}

const LoadingSpinner: React.FC = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const PromptControl: React.FC<PromptControlProps> = ({ prompt, setPrompt, onGenerate, isLoading, disabled }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">Describe Your Style</h2>
      <div className="relative">
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'A professional look for a business meeting' or 'Casual and comfy for a weekend brunch...'"
          className="w-full p-3 pr-12 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
          disabled={disabled || isLoading}
        />
      </div>
      <button
        onClick={onGenerate}
        disabled={disabled || isLoading || !prompt}
        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            Generating...
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5 mr-2" />
            Generate Outfit
          </>
        )}
      </button>
    </div>
  );
};

export default PromptControl;
