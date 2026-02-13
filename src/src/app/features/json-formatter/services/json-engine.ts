import { Injectable } from '@angular/core';
import { FormatterOptions } from '../models/formatter-options.model';

export interface JsonValidationResult {
  valid: boolean;
  error?: string;
  line?: number;
  column?: number;
}

@Injectable({
  providedIn: 'root'
})
export class JsonEngine {


  /* ================= FORMAT ================= */
  format(input: string, options?: FormatterOptions): string {

    let cleaned = input;

    if (options?.removeTrailingCommas) {
      cleaned = this.removeTrailingCommas(cleaned);
    }

    const parsed = JSON.parse(cleaned);

    if (!options) {
      return JSON.stringify(parsed, null, 2);
    }

    const processedData = options.sortKeys ? this.sortKeys(parsed) : parsed;

    const indent = this.getIndent(options.indentation);

    const formatted = JSON.stringify(processedData, null, indent);

    if (options.compactArrays === 'inline') {
      return this.compactSmallArrays(formatted);
    }

    return formatted;
  }


  /* ================= MINIFY ================= */
  minify(input: string): string {

    const cleaned = this.removeTrailingCommas(input);

    const parsed = JSON.parse(cleaned);

    return JSON.stringify(parsed);

  }


  /* ================= REMOVE TRAILING COMMAS ================= */
  private removeTrailingCommas(json: string): string {
    return json
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/,(\s*,)/g, '$1');
  }


  /* ================= SORT KEYS ================= */
  private sortKeys(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortKeys(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const sorted: any = {};
      Object.keys(obj)
        .sort()
        .forEach(key => {
          sorted[key] = this.sortKeys(obj[key]);
        });
      return sorted;
    }

    return obj;
  }


  /* ================= GET INDENT ================= */
  private getIndent(type: string): string | number {
    switch (type) {
      case '2spaces': return 2;
      case '4spaces': return 4;
      case 'tab': return '\t';
      default: return 2;
    }
  }


  /* ================= COMPACT SMALL ARRAYS ================= */
  private compactSmallArrays(json: string): string {
    const lines = json.split('\n');
    const result: string[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed === '[') {
        const arrayLines: string[] = [line];
        let j = i + 1;
        let depth = 1;

        while (j < lines.length && depth > 0) {
          const currentLine = lines[j];
          const currentTrimmed = currentLine.trim();

          arrayLines.push(currentLine);

          if (currentTrimmed.startsWith('[')) depth++;
          if (currentTrimmed.startsWith(']')) depth--;

          j++;
        }

        const arrayContent = arrayLines.slice(1, -1);
        const isSimpleArray = arrayContent.every(l => {
          const t = l.trim();
          return !t.startsWith('{') && !t.startsWith('[');
        });

        if (isSimpleArray && arrayContent.length <= 3) {
          const indent = line.match(/^\s*/)?.[0] || '';
          const items = arrayContent
            .map(l => l.trim().replace(/,$/, ''))
            .join(', ');
          result.push(`${indent}[${items}]${trimmed.endsWith(',') ? ',' : ''}`);
          i = j;
        } else {
          result.push(...arrayLines);
          i = j;
        }
      } else {
        result.push(line);
        i++;
      }
    }

    return result.join('\n');
  }


  /* ================= VALIDATE ================= */
  validate(input: string): JsonValidationResult {

    try {

      JSON.parse(input);

      return { valid: true };

    }
    catch (err: any) {

      return this.parseError(err?.message || 'Invalid JSON');

    }

  }


  /* ================= STATS ================= */
  getStats(text: string) {

    const chars = text.length;

    const lines = text ? text.split('\n').length : 0;

    const sizeKB = (new Blob([text]).size / 1024).toFixed(2);

    return {
      chars,
      lines,
      sizeKB
    };

  }


  /* ================= ERROR PARSER ================= */
  private parseError(message: string): JsonValidationResult {

    let line: number | undefined;
    let column: number | undefined;


    // position
    const posMatch = message.match(/position\s+(\d+)/i);

    if (posMatch) {

      const pos = Number(posMatch[1]);

      line = Math.floor(pos / 80) + 1;
      column = (pos % 80) + 1;

    }


    // line
    const lineMatch = message.match(/line\s+(\d+)/i);

    if (lineMatch) {
      line = Number(lineMatch[1]);
    }


    // column
    const colMatch = message.match(/column\s+(\d+)/i);

    if (colMatch) {
      column = Number(colMatch[1]);
    }


    return {
      valid: false,
      error: message,
      line,
      column
    };

  }

}
