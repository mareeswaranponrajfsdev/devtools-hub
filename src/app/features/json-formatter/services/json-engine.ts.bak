import { Injectable } from '@angular/core';

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
  format(input: string): string {

    const parsed = JSON.parse(input);

    return JSON.stringify(parsed, null, 2);

  }


  /* ================= MINIFY ================= */
  minify(input: string): string {

    const parsed = JSON.parse(input);

    return JSON.stringify(parsed);

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
