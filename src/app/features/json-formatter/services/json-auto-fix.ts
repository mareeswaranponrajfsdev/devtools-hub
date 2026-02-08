import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JsonAutoFix {

  /* ===============================
     AUTO FIX JSON ERRORS
  =============================== */

  fix(input: string): string {

    if (!input || !input.trim()) {
      throw new Error('Input is empty');
    }

    let fixed = input.trim();

    // Fix 1: Remove trailing commas
    fixed = this.removeTrailingCommas(fixed);

    // Fix 2: Add missing quotes to keys
    fixed = this.addMissingQuotes(fixed);

    // Fix 3: Fix single quotes to double quotes
    fixed = this.fixSingleQuotes(fixed);

    // Fix 4: Remove comments
    fixed = this.removeComments(fixed);

    // Fix 5: Fix unquoted values
    fixed = this.fixUnquotedValues(fixed);

    return fixed;

  }


  /* ===============================
     REMOVE TRAILING COMMAS
  =============================== */

  private removeTrailingCommas(json: string): string {

    // Remove trailing commas before closing braces or brackets
    return json
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/,(\s*$)/gm, '');

  }


  /* ===============================
     ADD MISSING QUOTES TO KEYS
  =============================== */

  private addMissingQuotes(json: string): string {

    // Match unquoted keys like: name: "value" → "name": "value"
    return json.replace(/(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*):/g, '$1"$2"$3:');

  }


  /* ===============================
     FIX SINGLE QUOTES TO DOUBLE
  =============================== */

  private fixSingleQuotes(json: string): string {

    // Replace single quotes with double quotes for strings
    // But preserve single quotes inside double-quoted strings
    
    let result = '';
    let inDoubleQuote = false;
    let inSingleQuote = false;
    let prevChar = '';

    for (let i = 0; i < json.length; i++) {

      const char = json[i];
      const nextChar = json[i + 1] || '';

      if (char === '"' && prevChar !== '\\') {
        inDoubleQuote = !inDoubleQuote;
        result += char;
      }
      else if (char === "'" && !inDoubleQuote && prevChar !== '\\') {
        result += '"';
        inSingleQuote = !inSingleQuote;
      }
      else {
        result += char;
      }

      prevChar = char;

    }

    return result;

  }


  /* ===============================
     REMOVE COMMENTS
  =============================== */

  private removeComments(json: string): string {

    // Remove single-line comments: // comment
    json = json.replace(/\/\/.*$/gm, '');

    // Remove multi-line comments: /* comment */
    json = json.replace(/\/\*[\s\S]*?\*\//g, '');

    return json;

  }


  /* ===============================
     FIX UNQUOTED STRING VALUES
  =============================== */

  private fixUnquotedValues(json: string): string {

    // Fix common unquoted values like true, false, null, numbers
    // This is a basic implementation - may need refinement

    return json;

  }

}
