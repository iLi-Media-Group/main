# Development Guide - Preventing Authentication State Loss

## The Problem
During development, Vite's hot module replacement (HMR) can cause authentication state to be lost, requiring you to clear browser cache and re-authenticate frequently.

## Solutions Implemented

### 1. Enhanced Vite Configuration
- Added cache control headers to prevent unnecessary reloads
- Configured HMR to be less aggressive with auth-related files
- Added `--force` flag option for stable development

### 2. Improved Supabase Client
- Enhanced session persistence with custom storage handlers
- Added error handling for localStorage operations
- Implemented backup/restore mechanisms for auth state

### 3. Session Utilities
- Created `src/lib/sessionUtils.ts` for managing session state
- Added automatic auth state backup/restore during development
- Implemented cross-storage persistence (sessionStorage + localStorage)

## Development Workflow

### Option 1: Use Stable Development Server
```bash
npm run dev:stable
```
This uses the `--force` flag to prevent HMR from clearing auth state.

### Option 2: Use Regular Development Server
```bash
npm run dev
```
The enhanced configuration should now preserve auth state better.

### Option 3: If You Still Experience Issues
1. **Don't clear cache manually** - the system now handles this automatically
2. **Use the backup/restore system** - auth state is automatically backed up
3. **Check browser console** - look for "Restored auth state from backup" messages

## Browser Settings (Optional)

### Chrome/Edge
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable cache" while DevTools is open
4. This prevents browser caching during development

### Firefox
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable Cache" option

## Troubleshooting

### If Authentication Still Gets Lost
1. Check browser console for error messages
2. Look for "Failed to save/load session state" warnings
3. Verify localStorage is enabled in your browser
4. Try using `npm run dev:stable` instead

### If Pages Still Need Cache Clearing
1. The new system should prevent this automatically
2. If it still happens, check if you're using an old version of the app
3. Try hard refresh (Ctrl+Shift+R) once, then normal refresh should work

## Production vs Development
- These changes only affect development mode
- Production builds are unaffected
- Session persistence is still secure and follows best practices

## Key Files Modified
- `vite.config.ts` - Enhanced development server configuration
- `src/lib/supabase.ts` - Improved session persistence
- `src/lib/sessionUtils.ts` - New session management utilities
- `src/App.tsx` - Integrated session protection
- `package.json` - Added stable development script
