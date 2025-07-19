import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFile(
  file: File, 
  bucket: string,
  onProgress?: (progress: number) => void,
  pathPrefix?: string // optional, for producer/track association
): Promise<string> {
  console.log('uploadFile called with:', {
    fileName: file.name,
    fileType: file.type,
    bucket: bucket,
    pathPrefix: pathPrefix
  });
  try {
    // Generate unique file path
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = pathPrefix ? `${pathPrefix}/${fileName}` : `${fileName}`;

    // Try to list buckets for debugging, but don't treat failure as fatal
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.warn('Could not list buckets (this is expected on the client):', bucketError.message);
      // Proceed to upload anyway - client doesn't have permission to list buckets
    } else {
      const bucketExists = buckets?.some(b => b.name === bucket);
      if (!bucketExists) {
        console.error('Bucket not found in list:', bucket);
        console.log('Available buckets:', buckets?.map(b => b.name));
        throw new Error(`Storage bucket '${bucket}' not found. Please contact support.`);
      }

      // Debug: Log bucket details
      const bucketDetails = buckets?.find(b => b.name === bucket);
      console.log('Bucket details:', {
        name: bucketDetails?.name,
        public: bucketDetails?.public,
        fileSizeLimit: bucketDetails?.file_size_limit,
        allowedMimeTypes: bucketDetails?.allowed_mime_types
      });
    }

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Allow overwriting if file already exists
      });

    if (error) {
      console.error('Upload error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name
      });
      
      if (error.message.includes('Bucket not found')) {
        throw new Error(`Storage bucket '${bucket}' not found. Please contact support.`);
      }
      if (error.message.includes('already exists')) {
        // File already exists, try to overwrite
        const { data: overwriteData, error: overwriteError } = await supabase.storage
          .from(bucket)
          .update(filePath, file, {
            cacheControl: '3600'
          });
        
        if (overwriteError) {
          console.error('Overwrite error:', overwriteError);
          throw new Error(`Failed to upload file: ${overwriteError.message}`);
        }
        
        return filePath;
      }
      throw error;
    }

    // Return the storage path (not a public URL)
    return filePath;
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof Error && error.message.includes('Bucket not found')) {
      throw error;
    }
    throw new Error(`Failed to upload file: ${(error as Error).message}`);
  }
}

export async function validateAudioFile(file: File): Promise<string | null> {
  console.log('validateAudioFile called with:', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size
  });

  // Check file size (50MB limit for audio files)
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return 'File size must be less than 50MB';
  }

  // Check file type
  if (!file.type.startsWith('audio/')) {
    console.log('Audio validation failed: not an audio file');
    return 'Please upload an audio file';
  }

  // Check supported formats
  const supportedFormats = ['audio/mpeg', 'audio/mp3', 'audio/wav'];
  if (!supportedFormats.includes(file.type)) {
    console.log('Audio validation failed: unsupported format');
    return 'Please upload an MP3 or WAV file';
  }

  console.log('Audio validation passed');
  return null;
}

export async function validateArchiveFile(file: File): Promise<string | null> {
  // Check file size (500MB limit for archive files)
  const MAX_SIZE = 500 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return 'File size must be less than 500MB';
  }

  // Debug logging
  console.log('File validation debug:', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    extension: file.name.split('.').pop()?.toLowerCase()
  });

  // Check file extension as primary validation (more reliable for ZIP/RAR)
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const supportedExtensions = ['zip', 'rar'];
  
  if (fileExtension && supportedExtensions.includes(fileExtension)) {
    console.log('Valid file extension:', fileExtension);
    return null; // Valid file extension
  }

  // Fallback to MIME type check
  const supportedTypes = ['application/zip', 'application/x-rar-compressed', 'application/vnd.rar'];
  if (supportedTypes.includes(file.type)) {
    console.log('Valid MIME type:', file.type);
    return null; // Valid MIME type
  }

  // If neither extension nor MIME type match, check if it's a generic binary file
  if (file.type === 'application/octet-stream' && fileExtension && supportedExtensions.includes(fileExtension)) {
    console.log('Valid generic binary with extension:', fileExtension);
    return null; // Generic binary with valid extension
  }

  console.log('File validation failed - no valid type or extension found');
  return 'Please upload a ZIP or RAR file';
}
