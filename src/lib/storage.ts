import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFile(
  file: File, 
  bucket: string,
  onProgress?: (progress: number) => void,
  pathPrefix?: string // optional, for producer/track association
): Promise<string> {
  console.log('=== UPLOAD DEBUG START ===');
  console.log('uploadFile called with:', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    bucket: bucket,
    pathPrefix: pathPrefix
  });
  
  try {
    // Generate unique file path
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = pathPrefix ? `${pathPrefix}/${fileName}` : `${fileName}`;
    
    console.log('Generated file path:', filePath);

    // Try to list buckets for debugging only (don't use for validation)
    console.log('Attempting to list buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.warn('Could not list buckets (this is expected on the client):', bucketError.message);
    } else if (buckets) {
      console.log('Successfully listed buckets:', buckets.map(b => b.name));
      const bucketExists = buckets.some(b => b.name === bucket);
      console.log(`Bucket '${bucket}' exists in list:`, bucketExists);
      
      // Debug: Log bucket details if found
      const bucketDetails = buckets.find(b => b.name === bucket);
      if (bucketDetails) {
        console.log('Bucket details:', {
          name: bucketDetails.name,
          public: bucketDetails.public,
          fileSizeLimit: bucketDetails.file_size_limit,
          allowedMimeTypes: bucketDetails.allowed_mime_types
        });
      }
    }

    // Upload file (don't check bucket existence - proceed with upload)
    console.log('Starting file upload to bucket:', bucket);
    console.log('Upload path:', filePath);
    
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
        console.log('File already exists, attempting to overwrite...');
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
        
        console.log('File overwritten successfully');
        
        // Generate signed URL for the overwritten file
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry
        
        if (signedUrlError) {
          console.error('Error generating signed URL:', signedUrlError);
          // Return the file path as fallback
          return filePath;
        }
        
        console.log('Signed URL generated for overwritten file:', signedUrlData.signedUrl);
        return signedUrlData.signedUrl;
      }
      throw error;
    }

    console.log('Upload successful!');
    console.log('Upload result:', data);
    
    // Generate signed URL for the uploaded file
    console.log('Generating signed URL for uploaded file...');
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry
    
    if (signedUrlError) {
      console.error('Error generating signed URL:', signedUrlError);
      // Return the file path as fallback
      console.log('=== UPLOAD DEBUG END ===');
      return filePath;
    }
    
    console.log('Signed URL generated successfully:', signedUrlData.signedUrl);
    console.log('=== UPLOAD DEBUG END ===');
    
    // Return the signed URL instead of just the file path
    return signedUrlData.signedUrl;
  } catch (error) {
    console.error('=== UPLOAD ERROR ===');
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

export async function validateSplitSheetFile(file: File): Promise<string | null> {
  console.log('validateSplitSheetFile called with:', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size
  });

  // Check file size (50MB limit for split sheets)
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return 'File size must be less than 50MB';
  }

  // Check file type
  if (file.type !== 'application/pdf') {
    console.log('Split sheet validation failed: not a PDF file');
    return 'Please upload a PDF file';
  }

  console.log('Split sheet validation passed');
  return null;
}

// Removed getPublicUrl function - we'll use signed URLs instead

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

  // Check file extension as primary validation (more reliable for archives)
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const supportedExtensions = [
    'zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz'
  ];
  
  if (fileExtension && supportedExtensions.includes(fileExtension)) {
    console.log('Valid file extension:', fileExtension);
    return null; // Valid file extension
  }

  // Fallback to MIME type check
  const supportedTypes = [
    // ZIP formats
    'application/zip',
    'application/x-zip-compressed',
    'application/x-zip',
    
    // RAR formats
    'application/x-rar-compressed',
    'application/vnd.rar',
    'application/rar',
    
    // 7-Zip formats
    'application/x-7z-compressed',
    'application/7z',
    
    // TAR formats
    'application/x-tar',
    'application/tar',
    
    // GZIP formats
    'application/gzip',
    'application/x-gzip',
    
    // Generic binary (fallback)
    'application/octet-stream',
    'application/x-binary'
  ];
  
  if (supportedTypes.includes(file.type)) {
    console.log('Valid MIME type:', file.type);
    return null; // Valid MIME type
  }

  // If neither extension nor MIME type match, check if it's a generic binary file with valid extension
  if (file.type === 'application/octet-stream' && fileExtension && supportedExtensions.includes(fileExtension)) {
    console.log('Valid generic binary with extension:', fileExtension);
    return null; // Generic binary with valid extension
  }

  console.log('File validation failed - no valid type or extension found');
  return 'Please upload a ZIP, RAR, 7Z, TAR, or GZ file';
}
