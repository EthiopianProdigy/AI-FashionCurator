
import React from 'react';

interface ResultDisplayProps {
  image: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ image }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Your AI-Styled Outfit!</h3>
      <img
        src={image}
        alt="Generated outfit"
        className="max-h-[400px] object-contain rounded-lg shadow-lg"
      />
    </div>
  );
};

export default ResultDisplay;
