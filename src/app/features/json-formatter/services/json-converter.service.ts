import { Injectable } from '@angular/core';

export type ConversionFormat = 'xml' | 'csv' | 'yaml';

@Injectable({
  providedIn: 'root'
})
export class JsonConverterService {

  /* ===============================
     JSON → XML
  =============================== */

  toXml(jsonString: string): string {

    const obj = JSON.parse(jsonString);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += this.objectToXml(obj, 'root');

    return xml;

  }

  private objectToXml(obj: any, nodeName: string, level = 0): string {

    const indent = '  '.repeat(level);
    let xml = '';

    if (Array.isArray(obj)) {

      obj.forEach((item, index) => {
        xml += `${indent}<${nodeName}>\n`;
        xml += this.objectToXml(item, 'item', level + 1);
        xml += `${indent}</${nodeName}>\n`;
      });

    } else if (typeof obj === 'object' && obj !== null) {

      xml += `${indent}<${nodeName}>\n`;

      Object.keys(obj).forEach(key => {
        xml += this.objectToXml(obj[key], key, level + 1);
      });

      xml += `${indent}</${nodeName}>\n`;

    } else {

      const value = this.escapeXml(String(obj));
      xml += `${indent}<${nodeName}>${value}</${nodeName}>\n`;

    }

    return xml;

  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }


  /* ===============================
     JSON → CSV
  =============================== */

  toCsv(jsonString: string): string {

    const obj = JSON.parse(jsonString);

    if (Array.isArray(obj) && obj.length > 0) {
      return this.arrayToCsv(obj);
    }

    if (typeof obj === 'object' && obj !== null) {
      return this.objectToCsv(obj);
    }

    throw new Error('JSON must be an array or object for CSV conversion');

  }

  private arrayToCsv(arr: any[]): string {

    if (arr.length === 0) return '';

    // Get all unique keys
    const keys = new Set<string>();
    arr.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(k => keys.add(k));
      }
    });

    const headers = Array.from(keys);

    // Header row
    let csv = headers.map(h => this.escapeCsv(h)).join(',') + '\n';

    // Data rows
    arr.forEach(item => {
      const row = headers.map(header => {
        const value = item?.[header];
        return this.escapeCsv(this.stringifyValue(value));
      });
      csv += row.join(',') + '\n';
    });

    return csv;

  }

  private objectToCsv(obj: any): string {

    const keys = Object.keys(obj);

    let csv = 'Key,Value\n';

    keys.forEach(key => {
      const value = this.stringifyValue(obj[key]);
      csv += `${this.escapeCsv(key)},${this.escapeCsv(value)}\n`;
    });

    return csv;

  }

  private escapeCsv(str: string): string {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private stringifyValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }


  /* ===============================
     JSON → YAML
  =============================== */

  toYaml(jsonString: string): string {

    const obj = JSON.parse(jsonString);

    return this.objectToYaml(obj, 0);

  }

  private objectToYaml(obj: any, level: number): string {

    const indent = '  '.repeat(level);
    let yaml = '';

    if (Array.isArray(obj)) {

      obj.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          yaml += `${indent}- \n`;
          yaml += this.objectToYaml(item, level + 1);
        } else {
          yaml += `${indent}- ${this.yamlValue(item)}\n`;
        }
      });

    } else if (typeof obj === 'object' && obj !== null) {

      Object.keys(obj).forEach(key => {
        const value = obj[key];

        if (typeof value === 'object' && value !== null) {
          yaml += `${indent}${key}:\n`;
          yaml += this.objectToYaml(value, level + 1);
        } else {
          yaml += `${indent}${key}: ${this.yamlValue(value)}\n`;
        }
      });

    } else {

      yaml += `${indent}${this.yamlValue(obj)}\n`;

    }

    return yaml;

  }

  private yamlValue(value: any): string {
    if (value === null) return 'null';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') {
      // Quote strings with special characters
      if (value.includes(':') || value.includes('#') || value.includes('\n')) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    return String(value);
  }

}
