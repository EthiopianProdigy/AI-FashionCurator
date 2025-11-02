
import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ImageData } from '../types';
import { CameraIcon } from './icons/CameraIcon';
import { fileToBase64, getMimeType, saveImageToFile } from '../utils/fileUtils';

interface ImageUploaderProps {
  onImageUpload: (imageData: ImageData) => void;
  initialImage: ImageData | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, initialImage }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage ? `data:${initialImage.mimeType};base64,${initialImage.base64}` : null);
  const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(null);
  const [currentMimeType, setCurrentMimeType] = useState<string>('image/jpeg');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertToJpeg = async (base64: string, mimeType: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image to blob'));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const jpegBase64 = result.split(',')[1];
            resolve(jpegBase64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.9);
      };
      img.onerror = reject;
      img.src = `data:${mimeType};base64,${base64}`;
    });
  };

  const handleSaveToBackend = useCallback(async () => {
    if (!currentImageBase64) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Convert to JPG first
      const jpegBase64 = await convertToJpeg(currentImageBase64, currentMimeType);

      // Send to backend to save to components/icons/person/person_image.jpg
      const response = await fetch('http://localhost:3006/api/save-person-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: jpegBase64,
          mimeType: 'image/jpeg'
        }),
      });


      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save image to backend');
      }

      const result = await response.json();
      setSaveMessage('✓ Saved to components/icons/person/person_image.jpg');
      console.log('Image saved to:', result.path);
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving image to backend:', error);
      setSaveMessage(`Error: ${error instanceof Error ? error.message : 'Failed to save'}`);
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  }, [currentImageBase64, currentMimeType]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setSaveMessage('⚠ Please upload a valid image file');
          setTimeout(() => setSaveMessage(null), 3000);
          return;
        }

        const base64 = await fileToBase64(file);
        const mimeType = getMimeType(file);
        
        // Create object URL for preview
        const objectUrl = URL.createObjectURL(file);
        setImagePreview(objectUrl);
        
        // Store the image data for the save button
        setCurrentImageBase64(base64);
        setCurrentMimeType(mimeType);
        setSaveMessage(null);
        
        onImageUpload({ base64, mimeType });
        
        // Automatically save the image to backend for clothing_recommend_backend.py
        // This saves to components/icons/person/person_image.jpg
        // Run this asynchronously without blocking the UI
        (async () => {
          try {
            const jpegBase64 = await convertToJpeg(base64, mimeType);
            const response = await fetch('http://localhost:3006/api/save-person-image', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                image_base64: jpegBase64,
                mimeType: 'image/jpeg'
              }),
            });

            if (response.ok) {
              const result = await response.json();
              setSaveMessage('✓ Saved to components/icons/person/person_image.jpg');
              console.log('Image saved to:', result.path);
              setTimeout(() => setSaveMessage(null), 3000);
            } else {
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
              console.warn('Failed to auto-save image to backend:', errorData);
              // Don't show error message for auto-save failures - user can manually save if needed
            }
          } catch (saveError) {
            // Silently fail - backend might not be running, that's okay
            console.warn('Backend server not available for auto-save. Make sure backend_server.py is running on port 5000:', saveError);
            // Don't show error to user - auto-save is optional
          }
        })();
      } catch (error) {
        console.error("Error converting file to base64", error);
      }
    }
  }, [onImageUpload]);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
       const changeEvent = { target: { files: event.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
       await handleFileChange(changeEvent);
    }
  }, [handleFileChange]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Cleanup object URL to prevent memory leaks
  // Store previous blob URL to cleanup when it changes
  useEffect(() => {
    const currentPreview = imagePreview;
    return () => {
      // Cleanup the previous blob URL when imagePreview changes or component unmounts
      if (currentPreview && currentPreview.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreview);
      }
    };
  }, [imagePreview]);

  return (
    <div className="flex flex-col h-full">
      <div 
        className="relative flex flex-col items-center justify-center flex-1 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        {imagePreview ? (
          <img 
            src={imagePreview} 
            alt="Character preview" 
            className="max-h-[400px] object-contain rounded-lg" 
            onError={(e) => {
              console.error('Image preview load failed');
              setSaveMessage('⚠ Failed to load image preview');
              setTimeout(() => setSaveMessage(null), 3000);
            }}
          />
        ) : (
          <div className="text-center text-gray-500">
            <CameraIcon className="mx-auto h-12 w-12" />
            <p className="mt-2 font-semibold">Click to upload or drag & drop</p>
            <p className="text-sm">Upload a photo of your character</p>
            <p className="text-xs mt-1">PNG, JPG, or WEBP</p>
          </div>
        )}
      </div>
      
      {imagePreview && currentImageBase64 && (
        <div className="mt-4 flex flex-col items-center space-y-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSaveToBackend();
            }}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save to components/icons/person'}
          </button>
          {saveMessage && (
            <p className={`text-sm ${saveMessage.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
              {saveMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
