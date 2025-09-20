// Session utilities to prevent authentication state loss during development

export const saveSessionState = (key: string, data: any) => {
  try {
    const serialized = JSON.stringify(data);
    sessionStorage.setItem(key, serialized);
    // Also save to localStorage for persistence across browser sessions
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.warn('Failed to save session state:', error);
  }
};

export const loadSessionState = (key: string) => {
  try {
    // Try sessionStorage first (for current session)
    const sessionData = sessionStorage.getItem(key);
    if (sessionData) {
      return JSON.parse(sessionData);
    }
    
    // Fallback to localStorage (for persistence across sessions)
    const localData = localStorage.getItem(key);
    if (localData) {
      return JSON.parse(localData);
    }
  } catch (error) {
    console.warn('Failed to load session state:', error);
  }
  return null;
};

export const clearSessionState = (key: string) => {
  try {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear session state:', error);
  }
};

// Prevent page unload from clearing auth state during development
export const preventAuthLoss = () => {
  if (import.meta.env.DEV) {
    window.addEventListener('beforeunload', (event) => {
      // Don't prevent unload, but ensure auth state is preserved
      const authState = localStorage.getItem('mybeatfi-auth');
      if (authState) {
        sessionStorage.setItem('mybeatfi-auth-backup', authState);
      }
    });
  }
};

// Restore auth state if needed
export const restoreAuthState = () => {
  if (import.meta.env.DEV) {
    const backup = sessionStorage.getItem('mybeatfi-auth-backup');
    if (backup && !localStorage.getItem('mybeatfi-auth')) {
      localStorage.setItem('mybeatfi-auth', backup);
      console.log('Restored auth state from backup');
    }
  }
};
