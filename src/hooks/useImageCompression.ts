import { useState } from 'react';

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export const useImageCompression = () => {
  const [isCompressing, setIsCompressing] = useState(false);

  const compressImage = async (
    file: File, 
    options: CompressionOptions = {}
  ): Promise<File> => {
    setIsCompressing(true);
    
    try {
      const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.8,
        format = 'jpeg'
      } = options;

      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Set canvas size
          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File(
                  [blob], 
                  file.name.replace(/\.[^/.]+$/, `.${format}`),
                  { 
                    type: `image/${format}`,
                    lastModified: Date.now()
                  }
                );
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            `image/${format}`,
            quality
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const batchCompress = async (
    files: File[],
    options: CompressionOptions = {}
  ): Promise<File[]> => {
    setIsCompressing(true);
    
    try {
      const compressed = await Promise.all(
        files.map(file => compressImage(file, options))
      );
      return compressed;
    } finally {
      setIsCompressing(false);
    }
  };

  const calculateCompressionRatio = (originalFile: File, compressedFile: File): number => {
    return Math.round((1 - compressedFile.size / originalFile.size) * 100);
  };

  return {
    compressImage,
    batchCompress,
    calculateCompressionRatio,
    isCompressing
  };
};