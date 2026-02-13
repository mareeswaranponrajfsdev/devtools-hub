import { Injectable } from '@angular/core';

export interface FilterOptions {
  keyFilter?: string;
  valueFilter?: string;
  caseSensitive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class JsonFilterService {
  filter(jsonString: string, options: FilterOptions): string {
    if (!jsonString || (!options.keyFilter && !options.valueFilter)) {
      return jsonString;
    }
    try {
      const parsed = JSON.parse(jsonString);
      const filtered = this.filterObject(parsed, options);
      return JSON.stringify(filtered, null, 2);
    } catch (error) {
      throw new Error('Invalid JSON for filtering');
    }
  }

  private filterObject(obj: any, options: FilterOptions): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.filterObject(item, options)).filter(item => item !== null);
    }
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    const result: any = {};
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      const matches = this.matchesFilter(key, options.keyFilter, options.caseSensitive || false);
      if (matches || typeof obj[key] === 'object') {
        result[key] = this.filterObject(obj[key], options);
      }
    }
    return result;
  }

  private matchesFilter(text: string, filter: string | undefined, caseSensitive: boolean): boolean {
    if (!filter) return false;
    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchFilter = caseSensitive ? filter : filter.toLowerCase();
    return searchText.includes(searchFilter);
  }
}
