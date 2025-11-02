import type { ClothingItem } from '../types';


interface AppClothingData {
  tops: ClothingItem[];
  bottoms: ClothingItem[];
  shoes: ClothingItem[];
}


export const clothingData: AppClothingData = {
  tops: [
    { id: 't1', name: 'White Tee', category: 'tops', imageUrl: 'https://i.imgur.com/SKy7U6B.jpeg'},
    { id: 't2', name: 'Grey Hoodie', category: 'tops', imageUrl: 'https://i.imgur.com/8b0FXH0.jpeg'},
    { id: 't3', name: 'Red Hoodie', category: 'tops', imageUrl: 'https://i.imgur.com/sSoAFqm.jpeg'},
    { id: 't4', name: 'Green Polo', category: 'tops', imageUrl: 'https://i.imgur.com/zgMrdB8.jpeg'},
    { id: 't5', name: 'Blue Crewneck', category: 'tops', imageUrl: 'https://i.imgur.com/A0UbLof.jpeg'},
  ],
  bottoms: [
    { id: 'b1', name: 'Black Jeans', category: 'bottoms', imageUrl: 'https://i.imgur.com/SfPEZ8S.jpeg'},
    { id: 'b2', name: 'Blue Jeans', category: 'bottoms', imageUrl: 'https://i.imgur.com/JY8wHUP.jpeg'},
    { id: 'b3', name: 'Beige Chinos', category: 'bottoms', imageUrl: 'https://i.imgur.com/RsAINOv.jpeg'},
    { id: 'b4', name: 'Gray Sweatpants', category: 'bottoms', imageUrl: 'https://i.imgur.com/2VEMQ09.jpeg'},
    { id: 'b5', name: 'Light Wash Jeans', category: 'bottoms', imageUrl: 'https://i.imgur.com/VgpYCBO.jpeg'},
  ],
  shoes: [
    { id: 's1', name: 'White Sneakers', category: 'shoes', imageUrl: 'https://i.imgur.com/c9pKXml.jpeg'},
    { id: 's2', name: 'Brown Leather Boots', category: 'shoes', imageUrl: 'https://i.imgur.com/ebmtzzX.jpeg'},
    { id: 's3', name: 'Black Dress Shoes', category: 'shoes', imageUrl: 'https://i.imgur.com/39sZIbp.jpeg'},
    { id: 's4', name: 'Running Shoes', category: 'shoes', imageUrl: 'https://i.imgur.com/4ioOa8r.jpeg'},
    { id: 's5', name: 'Brown Timbs Boots', category: 'shoes', imageUrl: 'https://i.imgur.com/b29sUHs.jpeg'},
  ],
};
