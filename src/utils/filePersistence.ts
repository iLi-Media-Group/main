interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

interface SavedFileInfo {
  metadata: FileMetadata;
  storageKey: string;
}

export class FilePersistenceManager {
  private static readonly FILE_STORAGE_PREFIX = 'file_persistence_';
  private static readonly METADATA_STORAGE_PREFIX = 'file_metadata_';

  static saveFileMetadata(file: File, formKey: string, fieldKey: string): SavedFileInfo {
    const metadata: FileMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };

    const storageKey = `${this.FILE_STORAGE_PREFIX}${formKey}_${fieldKey}`;
    const metadataKey = `${this.METADATA_STORAGE_PREFIX}${formKey}_${fieldKey}`;

    // Store file in localStorage as base64 (for small files)
    if (file.size <= 1024 * 1024) { // 1MB limit for localStorage
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        localStorage.setItem(storageKey, base64);
      };
      reader.readAsDataURL(file);
    }

    // Store metadata
    localStorage.setItem(metadataKey, JSON.stringify(metadata));

    return { metadata, storageKey };
  }

  static getFileMetadata(formKey: string, fieldKey: string): FileMetadata | null {
    try {
      const metadataKey = `${this.METADATA_STORAGE_PREFIX}${formKey}_${fieldKey}`;
      const metadata = localStorage.getItem(metadataKey);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      console.warn('Failed to get file metadata:', error);
      return null;
    }
  }

  static restoreFile(formKey: string, fieldKey: string): File | null {
    try {
      const storageKey = `${this.FILE_STORAGE_PREFIX}${formKey}_${fieldKey}`;
      const metadata = this.getFileMetadata(formKey, fieldKey);
      
      if (!metadata) return null;

      const base64Data = localStorage.getItem(storageKey);
      if (!base64Data) return null;

      // Convert base64 back to File object
      const byteString = atob(base64Data.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([ab], { type: metadata.type });
      return new File([blob], metadata.name, { 
        type: metadata.type,
        lastModified: metadata.lastModified 
      });
    } catch (error) {
      console.warn('Failed to restore file:', error);
      return null;
    }
  }

  static clearFile(formKey: string, fieldKey: string): void {
    const storageKey = `${this.FILE_STORAGE_PREFIX}${formKey}_${fieldKey}`;
    const metadataKey = `${this.METADATA_STORAGE_PREFIX}${formKey}_${fieldKey}`;
    
    localStorage.removeItem(storageKey);
    localStorage.removeItem(metadataKey);
  }

  static clearAllFiles(formKey: string): void {
    const keys = Object.keys(localStorage);
    const fileKeys = keys.filter(key => 
      key.startsWith(this.FILE_STORAGE_PREFIX + formKey) ||
      key.startsWith(this.METADATA_STORAGE_PREFIX + formKey)
    );
    
    fileKeys.forEach(key => localStorage.removeItem(key));
  }

  static hasSavedFile(formKey: string, fieldKey: string): boolean {
    const metadata = this.getFileMetadata(formKey, fieldKey);
    const storageKey = `${this.FILE_STORAGE_PREFIX}${formKey}_${fieldKey}`;
    return !!(metadata && localStorage.getItem(storageKey));
  }
} 