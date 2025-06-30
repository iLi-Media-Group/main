import React, { useState, useEffect } from 'react';
import { SignupForm } from './SignupForm';
import { useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent } from './ui/dialog';

interface ClientSignupDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClientSignupDialog({ isOpen, onClose }: ClientSignupDialogProps) {
  const [searchParams] = useSearchParams();
  const [shouldOpen, setShouldOpen] = useState(isOpen);
  
  // Check if we have email and redirect params that should trigger opening the dialog
  useEffect(() => {
    const email = searchParams.get('email');
    const redirect = searchParams.get('redirect');
    
    if (email && redirect === 'pricing') {
      setShouldOpen(true);
    } else {
      setShouldOpen(isOpen);
    }
  }, [searchParams, isOpen]);

  return (
    <Dialog open={shouldOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[100dvh] overflow-y-auto flex flex-col justify-center">
        <SignupForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
