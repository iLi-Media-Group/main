import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFile(
  file: File, 
  bucket: string,
  onProgress?: (progress: number) => void,
  pathPrefix?: string // optional, for producer/track association
): Promise<string> {
  try {
    // Generate unique file path
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = pathPrefix ? `${pathPrefix}/${fileName}` : `${fileName}`;

    // Check if bucket exists first
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.error('Error checking buckets:', bucketError);
      throw new Error('Unable to verify storage buckets');
    }

    const bucketExists = buckets?.some(b => b.name === bucket);
    if (!bucketExists) {
      throw new Error(`Storage bucket '${bucket}' not found. Please contact support.`);
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
  // Check file size (50MB limit)
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return 'File size must be less than 50MB';
  }

  // Check file type
  if (!file.type.startsWith('audio/')) {
    return 'Please upload an audio file';
  }

  // Check supported formats
  const supportedFormats = ['audio/mpeg', 'audio/mp3', 'audio/wav'];
  if (!supportedFormats.includes(file.type)) {
    return 'Please upload an MP3 or WAV file';
  }

  return null;
}
