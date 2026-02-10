import { Injectable } from '@angular/core';

declare let gtag: Function;

@Injectable({ providedIn: 'root' })
export class AnalyticsService {

  track(eventName: string, params?: Record<string, any>): void {
    if (!eventName) return;

    if (typeof gtag === 'function') {
      gtag('event', eventName, params ?? {});
    }
  }

}
