# Form Persistence Feature

## Overview

The track upload forms now include automatic persistence that saves your progress as you work. This means you can navigate away from the form and return without losing your data.

## How It Works

### Track Upload Form
- **Form Data**: All text fields, checkboxes, and selections are automatically saved to localStorage
- **File Uploads**: Selected files are saved locally (up to 1MB per file) and restored when you return
- **Auto-save**: Changes are saved automatically as you type or make selections
- **Clear Form**: Use the "Clear Form" button to reset all data and start fresh

### Custom Sync Upload Form
- **File Persistence**: Selected files are saved and restored when you return
- **Clear All**: Use the "Clear All" button to remove all selected files

## Features

### What Gets Saved
- Track title, BPM, key, and other text fields
- Genre and mood selections
- Checkbox states (has vocals, sync only, etc.)
- File selections (audio, image, trackouts, stems, split sheet)
- Form progress and selections

### What Doesn't Get Saved
- Large files (>1MB) - you'll need to re-select these
- Upload progress - starts fresh each time
- Temporary form states

## User Experience

### Visual Indicators
- A blue notification banner informs users about the persistence feature
- File names are displayed when files are selected
- Clear buttons allow users to reset the form when needed

### Automatic Cleanup
- Form data is automatically cleared after successful submission
- Files are cleared from localStorage after upload completion

## Technical Implementation

### Files Created/Modified
- `src/hooks/useFormPersistence.ts` - Custom hook for form persistence
- `src/utils/filePersistence.ts` - File persistence utility
- `src/components/TrackUploadForm.tsx` - Updated with persistence
- `src/components/CustomSyncTrackUploadForm.tsx` - Updated with persistence

### Storage Keys
- Track upload form: `trackUploadFormData`
- Custom sync form: `customSyncUpload`
- File persistence: `file_persistence_*` and `file_metadata_*`

## Benefits for Producers

1. **No Lost Work**: Navigate away and return without losing progress
2. **Better UX**: No need to re-enter information multiple times
3. **File Safety**: Selected files are preserved across sessions
4. **Flexibility**: Work on forms in multiple browser tabs/windows
5. **Clear Control**: Easy way to reset forms when needed

## Browser Compatibility

- Works in all modern browsers that support localStorage
- File persistence uses base64 encoding (limited to ~1MB per file)
- Graceful degradation if localStorage is not available 