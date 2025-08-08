import React from 'react';

// Utility to prevent unwanted page refreshes and provide better UX for form data entry

export interface RefreshPreventionOptions {
  enabled?: boolean;
  showWarning?: boolean;
  warningMessage?: string;
  excludePaths?: string[];
}

class RefreshPreventionManager {
  private isEnabled: boolean = true;
  private hasUnsavedChanges: boolean = false;
  private excludePaths: string[] = [];
  private warningMessage: string = 'You have unsaved changes. Are you sure you want to leave?';

  constructor(options: RefreshPreventionOptions = {}) {
    this.isEnabled = options.enabled ?? true;
    this.excludePaths = options.excludePaths ?? [];
    this.warningMessage = options.warningMessage ?? this.warningMessage;
    
    if (this.isEnabled) {
      this.initialize();
    }
  }

  private initialize() {
    // Prevent page refresh on F5/Ctrl+R
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Prevent page refresh on beforeunload
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // Prevent navigation away from forms
    window.addEventListener('popstate', this.handlePopState.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Prevent F5 and Ctrl+R refresh
    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
      if (this.hasUnsavedChanges && this.shouldPreventRefresh()) {
        event.preventDefault();
        this.showRefreshWarning();
        return false;
      }
    }
  }

  private handleBeforeUnload(event: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges && this.shouldPreventRefresh()) {
      event.preventDefault();
      event.returnValue = this.warningMessage;
      return this.warningMessage;
    }
  }

  private handlePopState(event: PopStateEvent) {
    if (this.hasUnsavedChanges && this.shouldPreventRefresh()) {
      event.preventDefault();
      this.showNavigationWarning();
      return false;
    }
  }

  private shouldPreventRefresh(): boolean {
    // Don't prevent refresh on excluded paths
    const currentPath = window.location.pathname;
    if (this.excludePaths.some(path => currentPath.startsWith(path))) {
      return false;
    }
    
    // Don't prevent refresh on success pages or checkout pages
    if (currentPath.includes('/success') || 
        currentPath.includes('/checkout') || 
        currentPath.includes('/payment')) {
      return false;
    }
    
    return true;
  }

  private showRefreshWarning() {
    if (confirm(this.warningMessage)) {
      this.clearUnsavedChanges();
      window.location.reload();
    }
  }

  private showNavigationWarning() {
    if (confirm(this.warningMessage)) {
      this.clearUnsavedChanges();
      // Allow navigation to continue
    } else {
      // Prevent navigation
      window.history.pushState(null, '', window.location.href);
    }
  }

  public setUnsavedChanges(hasChanges: boolean) {
    this.hasUnsavedChanges = hasChanges;
  }

  public clearUnsavedChanges() {
    this.hasUnsavedChanges = false;
  }

  public enable() {
    this.isEnabled = true;
  }

  public disable() {
    this.isEnabled = false;
  }

  public destroy() {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    window.removeEventListener('popstate', this.handlePopState.bind(this));
  }
}

// Global instance
let refreshPreventionManager: RefreshPreventionManager | null = null;

export const initializeRefreshPrevention = (options?: RefreshPreventionOptions) => {
  if (refreshPreventionManager) {
    refreshPreventionManager.destroy();
  }
  
  refreshPreventionManager = new RefreshPreventionManager(options);
  return refreshPreventionManager;
};

export const setUnsavedChanges = (hasChanges: boolean) => {
  if (refreshPreventionManager) {
    refreshPreventionManager.setUnsavedChanges(hasChanges);
  }
};

export const clearUnsavedChanges = () => {
  if (refreshPreventionManager) {
    refreshPreventionManager.clearUnsavedChanges();
  }
};

export const enableRefreshPrevention = () => {
  if (refreshPreventionManager) {
    refreshPreventionManager.enable();
  }
};

export const disableRefreshPrevention = () => {
  if (refreshPreventionManager) {
    refreshPreventionManager.disable();
  }
};

// React hook for form components
export const useRefreshPrevention = (hasUnsavedChanges: boolean = false) => {
  React.useEffect(() => {
    setUnsavedChanges(hasUnsavedChanges);
    
    return () => {
      if (!hasUnsavedChanges) {
        clearUnsavedChanges();
      }
    };
  }, [hasUnsavedChanges]);
};

// Safe navigation function that doesn't trigger refresh prevention
export const safeNavigate = (url: string, replace: boolean = false) => {
  clearUnsavedChanges();
  if (replace) {
    window.location.replace(url);
  } else {
    window.location.href = url;
  }
};

// Safe reload function that bypasses refresh prevention
export const safeReload = () => {
  clearUnsavedChanges();
  window.location.reload();
};
