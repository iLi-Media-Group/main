/**
 * Image Optimization Utility
 * Uses browser Canvas API to resize and compress images
 * No external dependencies required
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'jpeg' | 'webp' | 'png';
  maxFileSize?: number; // in bytes
}

export interface OptimizedImage {
  file: File;
  dataUrl: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

/**
 * Optimize an image file with the given options
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImage> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'jpeg',
    maxFileSize = 500 * 1024 // 500KB default
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and resize image
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to blob with specified quality and format
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            // Create new file
            const optimizedFile = new File([blob], file.name, {
              type: getMimeType(format),
              lastModified: Date.now()
            });

            // Get data URL for preview
            const dataUrl = canvas.toDataURL(getMimeType(format), quality);

            const result: OptimizedImage = {
              file: optimizedFile,
              dataUrl,
              originalSize: file.size,
              optimizedSize: optimizedFile.size,
              compressionRatio: optimizedFile.size / file.size
            };

            resolve(result);
          },
          getMimeType(format),
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // If image is smaller than max dimensions, keep original size
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  // Calculate scaling factor
  const scaleX = maxWidth / width;
  const scaleY = maxHeight / height;
  const scale = Math.min(scaleX, scaleY);

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale)
  };
}

/**
 * Get MIME type for the specified format
 */
function getMimeType(format: string): string {
  switch (format) {
    case 'webp':
      return 'image/webp';
    case 'png':
      return 'image/png';
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
}

/**
 * Check if WebP is supported in the browser
 */
export function isWebPSupported(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Get recommended optimization settings based on use case
 */
export function getOptimizationPreset(useCase: 'cover' | 'thumbnail' | 'profile' | 'banner') {
  switch (useCase) {
    case 'cover':
      return {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
        format: 'jpeg' as const,
        maxFileSize: 400 * 1024 // 400KB
      };
    case 'thumbnail':
      return {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
        format: 'jpeg' as const,
        maxFileSize: 100 * 1024 // 100KB
      };
    case 'profile':
      return {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.8,
        format: 'jpeg' as const,
        maxFileSize: 150 * 1024 // 150KB
      };
    case 'banner':
      return {
        maxWidth: 1920,
        maxHeight: 600,
        quality: 0.8,
        format: 'jpeg' as const,
        maxFileSize: 300 * 1024 // 300KB
      };
    default:
      return {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
        format: 'jpeg' as const,
        maxFileSize: 200 * 1024 // 200KB
      };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
