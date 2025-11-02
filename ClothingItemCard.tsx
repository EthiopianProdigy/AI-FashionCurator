
import React from 'react';
import type { ClothingItem } from '../types';

interface ClothingItemCardProps {
  item: ClothingItem;
  isSelected: boolean;
}

const ClothingItemCard: React.FC<ClothingItemCardProps> = ({ item, isSelected }) => {
  return (
    <div className="group relative">
      <div 
        className={`aspect-square w-full overflow-hidden rounded-md bg-gray-200 transition-all ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : 'group-hover:opacity-75'}`}
      >
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-full w-full object-cover object-center"
        />
      </div>
      <p className="mt-1 block text-xs font-medium text-gray-900 truncate">{item.name}</p>
    </div>
  );
};

export default ClothingItemCard;
