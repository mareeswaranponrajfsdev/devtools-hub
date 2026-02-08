import { Injectable } from '@angular/core';

export interface DiffResult {
  added: DiffItem[];
  removed: DiffItem[];
  modified: DiffItem[];
  unchanged: DiffItem[];
  summary: string;
}

export interface DiffItem {
  path: string;
  oldValue?: any;
  newValue?: any;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
}

@Injectable({
  providedIn: 'root'
})
export class JsonDiffService {

  /**
   * Compare two JSON strings
   */
  compare(json1: string, json2: string): DiffResult {
    try {
      const obj1 = JSON.parse(json1);
      const obj2 = JSON.parse(json2);
      
      const result: DiffResult = {
        added: [],
        removed: [],
        modified: [],
        unchanged: [],
        summary: ''
      };
      
      this.compareObjects(obj1, obj2, '', result);
      
      result.summary = this.generateSummary(result);
      
      return result;
    } catch (error) {
      throw new Error('Invalid JSON: ' + (error as Error).message);
    }
  }

  /**
   * Recursively compare two objects
   */
  private compareObjects(obj1: any, obj2: any, path: string, result: DiffResult): void {
    const keys1 = obj1 ? Object.keys(obj1) : [];
    const keys2 = obj2 ? Object.keys(obj2) : [];
    const allKeys = new Set([...keys1, ...keys2]);
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const hasKey1 = keys1.includes(key);
      const hasKey2 = keys2.includes(key);
      
      if (!hasKey1 && hasKey2) {
        // Added in obj2
        result.added.push({
          path: currentPath,
          newValue: obj2[key],
          type: 'added'
        });
      } else if (hasKey1 && !hasKey2) {
        // Removed from obj2
        result.removed.push({
          path: currentPath,
          oldValue: obj1[key],
          type: 'removed'
        });
      } else {
        // Both have the key
        const val1 = obj1[key];
        const val2 = obj2[key];
        
        if (this.isObject(val1) && this.isObject(val2)) {
          // Recursively compare nested objects
          this.compareObjects(val1, val2, currentPath, result);
        } else if (Array.isArray(val1) && Array.isArray(val2)) {
          // Compare arrays
          if (JSON.stringify(val1) !== JSON.stringify(val2)) {
            result.modified.push({
              path: currentPath,
              oldValue: val1,
              newValue: val2,
              type: 'modified'
            });
          } else {
            result.unchanged.push({
              path: currentPath,
              oldValue: val1,
              newValue: val2,
              type: 'unchanged'
            });
          }
        } else {
          // Compare primitives
          if (val1 !== val2) {
            result.modified.push({
              path: currentPath,
              oldValue: val1,
              newValue: val2,
              type: 'modified'
            });
          } else {
            result.unchanged.push({
              path: currentPath,
              oldValue: val1,
              newValue: val2,
              type: 'unchanged'
            });
          }
        }
      }
    }
  }

  /**
   * Check if value is an object (not array or null)
   */
  private isObject(val: any): boolean {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(result: DiffResult): string {
    const total = result.added.length + result.removed.length + result.modified.length + result.unchanged.length;
    
    if (total === 0) {
      return 'Both JSON objects are empty or identical';
    }
    
    const parts: string[] = [];
    
    if (result.added.length > 0) {
      parts.push(`${result.added.length} added`);
    }
    if (result.removed.length > 0) {
      parts.push(`${result.removed.length} removed`);
    }
    if (result.modified.length > 0) {
      parts.push(`${result.modified.length} modified`);
    }
    if (result.unchanged.length > 0) {
      parts.push(`${result.unchanged.length} unchanged`);
    }
    
    return parts.join(', ');
  }

  /**
   * Generate HTML diff view
   */
  generateDiffHtml(result: DiffResult): string {
    let html = '<div class="json-diff-viewer">';
    
    html += '<div class="diff-summary">';
    html += `<strong>Summary:</strong> ${result.summary}`;
    html += '</div>';
    
    if (result.added.length > 0) {
      html += '<div class="diff-section added">';
      html += '<h4>➕ Added</h4>';
      result.added.forEach(item => {
        html += `<div class="diff-item">`;
        html += `<code>${item.path}</code>: <span class="value">${JSON.stringify(item.newValue)}</span>`;
        html += `</div>`;
      });
      html += '</div>';
    }
    
    if (result.removed.length > 0) {
      html += '<div class="diff-section removed">';
      html += '<h4>➖ Removed</h4>';
      result.removed.forEach(item => {
        html += `<div class="diff-item">`;
        html += `<code>${item.path}</code>: <span class="value">${JSON.stringify(item.oldValue)}</span>`;
        html += `</div>`;
      });
      html += '</div>';
    }
    
    if (result.modified.length > 0) {
      html += '<div class="diff-section modified">';
      html += '<h4>🔄 Modified</h4>';
      result.modified.forEach(item => {
        html += `<div class="diff-item">`;
        html += `<code>${item.path}</code>:<br>`;
        html += `<span class="old-value">- ${JSON.stringify(item.oldValue)}</span><br>`;
        html += `<span class="new-value">+ ${JSON.stringify(item.newValue)}</span>`;
        html += `</div>`;
      });
      html += '</div>';
    }
    
    html += '</div>';
    return html;
  }
}
