import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  
  private readonly STORAGE_KEY = 'app-theme';
  private currentTheme$ = new BehaviorSubject<Theme>('light');
  
  public theme$ = this.currentTheme$.asObservable();

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.initializeTheme();
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  private initializeTheme(): void {
    const savedTheme = this.getStoredTheme();
    const systemTheme = this.getSystemTheme();
    const theme = savedTheme || systemTheme;
    
    this.setTheme(theme);
  }

  /**
   * Get stored theme from localStorage
   */
  private getStoredTheme(): Theme | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return (stored === 'dark' || stored === 'light') ? stored : null;
  }

  /**
   * Get system theme preference
   */
  private getSystemTheme(): Theme {
    if (typeof window === 'undefined') {
      return 'light';
    }
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  /**
   * Set theme
   */
  setTheme(theme: Theme): void {
    this.currentTheme$.next(theme);
    this.document.documentElement.setAttribute('data-theme', theme);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, theme);
    }
    
    // Update Monaco editor theme if present
    this.updateMonacoTheme(theme);
  }

  /**
   * Toggle theme
   */
  toggleTheme(): void {
    const current = this.currentTheme$.value;
    const newTheme: Theme = current === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.currentTheme$.value;
  }

  /**
   * Check if dark mode
   */
  isDarkMode(): boolean {
    return this.currentTheme$.value === 'dark';
  }

  /**
   * Update Monaco editor theme
   */
  private updateMonacoTheme(theme: Theme): void {
    // This will be called by Monaco editor components
    const event = new CustomEvent('theme-change', { 
      detail: { theme } 
    });
    window.dispatchEvent(event);
  }
}
