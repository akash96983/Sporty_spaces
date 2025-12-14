'use client';

import { useState } from 'react';
import { fetchWithAuth } from '../lib/api';

interface ImageUploaderProps {
  onImagesUploaded: (images: { url: string; publicId: string }[]) => void;
  maxImages?: number;
  existingImages?: { url: string; publicId: string }[];
}

export default function ImageUploader({ 
  onImagesUploaded, 
  maxImages = 4,
  existingImages = []
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<{ url: string; publicId: string }[]>(existingImages);
  const [error, setError] = useState('');

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + images.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Validate file sizes (max 5MB each)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Each image must be less than 5MB');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setUploading(true);
    setError('');
    
    try {
      const base64Images = await Promise.all(
        files.map(file => convertToBase64(file))
      );

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetchWithAuth(`${API_URL}/upload/images`, {
        method: 'POST',
        body: JSON.stringify({ images: base64Images })
      });

      const result = await response.json();

      if (result.success) {
        const newImages = [...images, ...result.images];
        setImages(newImages);
        onImagesUploaded(newImages);
      } else {
        setError(result.message || 'Failed to upload images');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload images');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesUploaded(newImages);
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <img
              src={image.url}
              alt={`Upload ${index + 1}`}
              className="w-full h-40 object-cover rounded-lg border border-slate-200"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {images.length < maxImages && (
        <label className="block cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            uploading 
              ? 'border-slate-300 bg-slate-50' 
              : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50'
          }`}>
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
                <p className="text-slate-600 text-sm">Uploading images...</p>
              </div>
            ) : (
              <>
                <svg className="w-12 h-12 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-slate-600 font-medium mb-1">Click to upload images</p>
                <p className="text-xs text-slate-500">
                  {images.length}/{maxImages} images • Max 5MB each
                </p>
              </>
            )}
          </div>
        </label>
      )}
    </div>
  );
}
