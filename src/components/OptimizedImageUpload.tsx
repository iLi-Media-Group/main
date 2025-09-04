import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { 
  optimizeImage, 
  getOptimizationPreset, 
  formatFileSize, 
  type OptimizedImage,
  type ImageOptimizationOptions 
} from '../utils/imageOptimizer';

interface OptimizedImageUploadProps {
  onImageSelect: (file: File, previewUrl: string) => void;
  useCase?: 'cover' | 'thumbnail' | 'profile' | 'banner';
  customOptions?: ImageOptimizationOptions;
  maxFileSize?: number; // in bytes
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function OptimizedImageUpload({
  onImageSelect,
  useCase = 'cover',
  customOptions,
  maxFileSize = 2 * 1024 * 1024, // 2MB default
  className = '',
  disabled = false,
  placeholder = 'Click to upload image'
}: OptimizedImageUploadProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preset = getOptimizationPreset(useCase);
  const options = customOptions || preset;

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > maxFileSize) {
      setError(`File size must be less than ${formatFileSize(maxFileSize)}`);
      return;
    }

    setError(null);
    setIsOptimizing(true);

    try {
      const result = await optimizeImage(file, options);
      setOptimizationResult(result);
      
      // Call the parent callback with optimized file and preview
      onImageSelect(result.file, result.dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize image');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const resetSelection = () => {
    setOptimizationResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getCompressionColor = (ratio: number) => {
    if (ratio <= 0.5) return 'text-green-500';
    if (ratio <= 0.8) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {isOptimizing ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Optimizing image...</p>
          </div>
        ) : optimizationResult ? (
          <div className="space-y-2">
            <div className="relative inline-block">
              <img
                src={optimizationResult.dataUrl}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-lg mx-auto"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetSelection();
                }}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Image optimized!</p>
          </div>
        ) : (
          <div className="space-y-2">
            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{placeholder}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Drag & drop or click to select
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center space-x-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Optimization Results */}
      {optimizationResult && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">Image Optimized Successfully</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Original Size</p>
              <p className="font-medium">{formatFileSize(optimizationResult.originalSize)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Optimized Size</p>
              <p className="font-medium">{formatFileSize(optimizationResult.optimizedSize)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Compression</p>
              <p className={`font-medium ${getCompressionColor(optimizationResult.compressionRatio)}`}>
                {Math.round((1 - optimizationResult.compressionRatio) * 100)}% smaller
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Dimensions</p>
              <p className="font-medium">
                {Math.round(optimizationResult.file.size / 1024)}KB
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Format: {options.format?.toUpperCase()}</p>
            <p>Max dimensions: {options.maxWidth} × {options.maxHeight}px</p>
            <p>Quality: {Math.round((options.quality || 0.8) * 100)}%</p>
          </div>
        </div>
      )}

      {/* File Size Warning */}
      {!optimizationResult && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <p>Maximum file size: {formatFileSize(maxFileSize)}</p>
          <p>Recommended: {formatFileSize(options.maxFileSize || 500 * 1024)}</p>
        </div>
      )}
    </div>
  );
}
