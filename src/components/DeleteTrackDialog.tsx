import React, { useState } from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';

interface DeleteTrackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
  onConfirm: () => Promise<void>;
  isRestore?: boolean;
}

export function DeleteTrackDialog({ isOpen, onClose, trackTitle, onConfirm, isRestore = false }: DeleteTrackDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAction = async () => {
    try {
      setLoading(true);
      setError('');
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(`Error ${isRestore ? 'restoring' : 'deleting'} track:`, err);
      setError(`Failed to ${isRestore ? 'restore' : 'delete'} track`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-purple-500/20 w-full max-w-md">
        <h3 className="text-xl font-bold text-white mb-4">
          {isRestore ? 'Restore Track' : 'Delete Track'}
        </h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            {isRestore 
              ? `Are you sure you want to restore "${trackTitle}"? This will make it available in your catalog again.`
              : `Are you sure you want to delete "${trackTitle}"? This action cannot be undone.`
            }
          </p>
          
          <div className={`p-4 ${isRestore ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'} border rounded-lg`}>
            <div className="flex items-start space-x-2">
              <AlertTriangle className={`w-5 h-5 ${isRestore ? 'text-green-400' : 'text-yellow-400'} flex-shrink-0 mt-0.5`} />
              <p className={`${isRestore ? 'text-green-400' : 'text-yellow-400'} text-sm`}>
                {isRestore 
                  ? 'Restoring this track will make it available for licensing again and it will appear in your active tracks.'
                  : 'Deleting this track will remove it from your catalog and make it unavailable for future licensing. Any existing licenses will remain valid until their expiration date.'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleAction}
            className={`px-6 py-2 ${isRestore ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-lg transition-colors flex items-center`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                {isRestore ? 'Restoring...' : 'Deleting...'}
              </span>
            ) : (
              <span>{isRestore ? 'Restore Track' : 'Delete Track'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
