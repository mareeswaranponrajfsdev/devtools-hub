import { Component, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../../../core/analytics/analytics.service';
import { ANALYTICS_EVENTS } from '../../../../core/analytics/analytics-events';

interface DiffResult {
  path: string;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  leftValue?: any;
  rightValue?: any;
}

@Component({
  selector: 'app-diff-tool',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diff-tool.html',
  styleUrl: './diff-tool.scss'
})
export class DiffToolPage {
  
  leftJson: WritableSignal<string> = signal('');
  rightJson: WritableSignal<string> = signal('');
  differences: WritableSignal<DiffResult[]> = signal([]);
  error: WritableSignal<string> = signal('');
  leftParsed: any = null;
  rightParsed: any = null;

  constructor(
    private analytics: AnalyticsService 
  ) {}
  
  compareLists() {
    this.error.set('');
    this.differences.set([]);
    
    if (!this.leftJson().trim() || !this.rightJson().trim()) {
      this.error.set('Please enter JSON in both editors');
      return;
    }
    
    try {
      this.leftParsed = JSON.parse(this.leftJson());
      this.rightParsed = JSON.parse(this.rightJson());
      
      const diffs = this.compareObjects(this.leftParsed, this.rightParsed, '');
      this.differences.set(diffs);

      this.analytics.track(ANALYTICS_EVENTS.JSON_DIFF);
      
    } catch (err) {
      this.error.set('Invalid JSON: ' + (err as Error).message);
    }
  }
  
  private compareObjects(left: any, right: any, path: string): DiffResult[] {
    const results: DiffResult[] = [];
    
    // Both are objects
    if (this.isObject(left) && this.isObject(right)) {
      const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
      
      allKeys.forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        const leftValue = left[key];
        const rightValue = right[key];
        
        if (!(key in left)) {
          results.push({
            path: newPath,
            type: 'added',
            rightValue: rightValue
          });
        } else if (!(key in right)) {
          results.push({
            path: newPath,
            type: 'removed',
            leftValue: leftValue
          });
        } else if (this.isObject(leftValue) && this.isObject(rightValue)) {
          results.push(...this.compareObjects(leftValue, rightValue, newPath));
        } else if (JSON.stringify(leftValue) !== JSON.stringify(rightValue)) {
          results.push({
            path: newPath,
            type: 'modified',
            leftValue: leftValue,
            rightValue: rightValue
          });
        } else {
          results.push({
            path: newPath,
            type: 'unchanged',
            leftValue: leftValue,
            rightValue: rightValue
          });
        }
      });
    } else if (JSON.stringify(left) !== JSON.stringify(right)) {
      results.push({
        path: path || 'root',
        type: 'modified',
        leftValue: left,
        rightValue: right
      });
    }
    
    return results;
  }
  
  private isObject(obj: any): boolean {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
  }
  
  formatValue(value: any): string {
    if (value === undefined) return '';
    if (value === null) return 'null';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }
  
  getDiffCount(type: 'added' | 'removed' | 'modified'): number {
    return this.differences().filter(d => d.type === type).length;
  }
  
  loadSample(): void {
    const left = {
      "name": "John Doe",
      "age": 30,
      "email": "john@example.com",
      "isActive": true,
      "address": {
        "city": "New York",
        "zip": "10001"
      }
    };
    
    const right = {
      "name": "John Doe",
      "age": 31,
      "email": "john.doe@example.com",
      "isActive": true,
      "phone": "+1234567890",
      "address": {
        "city": "Los Angeles",
        "zip": "90001"
      }
    };
    
    this.leftJson.set(JSON.stringify(left, null, 2));
    this.rightJson.set(JSON.stringify(right, null, 2));
  }
  
  clear(): void {
    this.leftJson.set('');
    this.rightJson.set('');
    this.differences.set([]);
    this.error.set('');
  }
}
