import { Injectable } from '@angular/core';

export interface SessionData {
  content: string;
  timestamp: number;
  size: number;
}

/**
 * Session Storage Service
 * Manages localStorage-based session persistence with auto-save and debouncing
 */
@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {
  
  private readonly MAX_SIZE_MB = 5;
  private readonly EXPIRY_HOURS = 24;
  private readonly DEBOUNCE_MS = 2000;
  
  private debounceTimers: Map<string, any> = new Map();

  /**
   * Save data with debouncing (auto-save after 2 seconds)
   */
  saveDebounced(key: string, content: string): void {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    const timer = setTimeout(() => {
      this.save(key, content);
      this.debounceTimers.delete(key);
    }, this.DEBOUNCE_MS);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Save data immediately
   */
  save(key: string, content: string): boolean {
    try {
      const sizeInBytes = new Blob([content]).size;
      const sizeInMB = sizeInBytes / (1024 * 1024);

      // Don't save if too large
      if (sizeInMB > this.MAX_SIZE_MB) {
        console.warn(`Content too large (${sizeInMB.toFixed(2)}MB). Skipping save.`);
        return false;
      }

      const data: SessionData = {
        content,
        timestamp: Date.now(),
        size: sizeInBytes
      };

      localStorage.setItem(key, JSON.stringify(data));
      return true;

    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('LocalStorage quota exceeded');
        this.clearOldestSessions();
      } else {
        console.error('Error saving session:', error);
      }
      return false;
    }
  }

  /**
   * Load data
   */
  load(key: string): SessionData | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const data: SessionData = JSON.parse(stored);

      // Check if expired (24 hours)
      const ageInHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);
      if (ageInHours > this.EXPIRY_HOURS) {
        this.remove(key);
        return null;
      }

      return data;

    } catch (error) {
      console.error('Error loading session:', error);
      return null;
    }
  }

  /**
   * Check if session exists
   */
  hasSession(key: string): boolean {
    const data = this.load(key);
    return data !== null;
  }

  /**
   * Remove specific session
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing session:', error);
    }
  }

  /**
   * Clear all sessions
   */
  clearAll(): void {
    try {
      const keys = this.getAllSessionKeys();
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing sessions:', error);
    }
  }

  /**
   * Get all session keys (with prefix json-session-)
   */
  private getAllSessionKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('json-session-')) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Clear oldest sessions when quota exceeded
   */
  private clearOldestSessions(): void {
    try {
      const sessions = this.getAllSessionKeys().map(key => {
        const data = this.load(key);
        return { key, timestamp: data?.timestamp || 0 };
      });

      sessions.sort((a, b) => a.timestamp - b.timestamp);

      const toRemove = Math.ceil(sessions.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(sessions[i].key);
      }

    } catch (error) {
      console.error('Error clearing oldest sessions:', error);
    }
  }

  /**
   * Get formatted size
   */
  getFormattedSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}
