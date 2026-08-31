import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  // Broad pattern covering Webpack ("Loading chunk") and Vite ("Failed to fetch dynamically imported module")
  private readonly chunkFailedPattern = /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i;

  handleError(error: any): void {
    const errorMessage = error?.message || error?.toString() || '';

    if (this.chunkFailedPattern.test(errorMessage)) {
      this.handleChunkError(error);
    } else {
      console.error(error);
    }
  }

  private handleChunkError(error: any): void {
    const storageKey = 'chunk_reload_timestamp';
    let lastReload: string | null = null;
    
    try {
      lastReload = sessionStorage.getItem(storageKey);
    } catch (e) {
      console.warn('sessionStorage is inaccessible (possibly blocked by browser privacy settings):', e);
    }
    
    const now = Date.now();
    const cooldownMs = 10000; // 10-second guard window

    if (!lastReload || now - parseInt(lastReload, 10) > cooldownMs) {
      try {
        sessionStorage.setItem(storageKey, now.toString());
      } catch (e) {
        // Fallback if writing is blocked
      }
      console.warn('New app version detected or chunk load failed. Reloading...');
      
      // Forces page reload from server
      window.location.reload();
    } else {
      // Prevents infinite loop if user is offline or chunk is truly missing
      console.error('Chunk loading failed repeatedly. Aborting auto-reload to prevent infinite loop.', error);
    }
  }
}
