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

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Return the storage path (not a public URL)
    return filePath;
  } catch (error) {
    console.error('Upload error:', error);
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
