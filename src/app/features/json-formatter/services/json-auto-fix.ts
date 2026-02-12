import { Injectable } from '@angular/core';

export interface AutoFixResult {
  fixed: string;
  changes: string[];
  success: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JsonAutoFix {

  fix(input: string): AutoFixResult {
    if (!input || !input.trim()) {
      return {
        fixed: '',
        changes: [],
        success: false,
        error: 'Input is empty'
      };
    }

    const changes: string[] = [];
    let fixed = input.trim();
    const original = fixed;

    try {
      // 1. Remove comments
      const withoutComments = this.removeComments(fixed);
      if (withoutComments !== fixed) {
        changes.push('Removed comments');
        fixed = withoutComments;
      }

      // 2. Fix smart quotes
      const withNormalQuotes = this.fixSmartQuotes(fixed);
      if (withNormalQuotes !== fixed) {
        changes.push('Fixed smart quotes');
        fixed = withNormalQuotes;
      }

      // 3. Fix single quotes to double quotes
      const withDoubleQuotes = this.fixSingleQuotes(fixed);
      if (withDoubleQuotes !== fixed) {
        changes.push('Converted single quotes to double quotes');
        fixed = withDoubleQuotes;
      }

      // 4. Add missing quotes to keys
      const withQuotedKeys = this.addMissingQuotes(fixed);
      if (withQuotedKeys !== fixed) {
        changes.push('Added quotes to unquoted keys');
        fixed = withQuotedKeys;
      }

      // 5. Remove trailing commas
      const withoutTrailingCommas = this.removeTrailingCommas(fixed);
      if (withoutTrailingCommas !== fixed) {
        changes.push('Removed trailing commas');
        fixed = withoutTrailingCommas;
      }

      // 6. Fix missing commas
      const withCommas = this.addMissingCommas(fixed);
      if (withCommas !== fixed) {
        changes.push('Added missing commas');
        fixed = withCommas;
      }

      // 7. Fix invalid escapes
      const withValidEscapes = this.fixInvalidEscapes(fixed);
      if (withValidEscapes !== fixed) {
        changes.push('Fixed invalid escape sequences');
        fixed = withValidEscapes;
      }

      // 8. Clean extra whitespace
      const cleaned = this.cleanWhitespace(fixed);
      if (cleaned !== fixed) {
        changes.push('Cleaned whitespace');
        fixed = cleaned;
      }

      // Validate the result
      JSON.parse(fixed);

      return {
        fixed,
        changes: changes.length > 0 ? changes : ['No fixes needed'],
        success: true
      };

    } catch (error: any) {
      // If still invalid, try one more aggressive fix
      try {
        fixed = this.aggressiveFix(original);
        JSON.parse(fixed);
        
        return {
          fixed,
          changes: ['Applied aggressive fixes'],
          success: true
        };
      } catch {
        return {
          fixed: original,
          changes: [],
          success: false,
          error: error.message || 'Unable to auto-fix JSON'
        };
      }
    }
  }

  private removeComments(json: string): string {
    // Remove single-line comments
    json = json.replace(/\/\/.*$/gm, '');
    
    // Remove multi-line comments
    json = json.replace(/\/\*[\s\S]*?\*\//g, '');
    
    return json;
  }

  private fixSmartQuotes(json: string): string {
    return json
      .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes
      .replace(/[\u2018\u2019]/g, "'"); // Smart single quotes
  }

  private fixSingleQuotes(json: string): string {
    let result = '';
    let inString = false;
    let stringChar = '';
    let escaped = false;

    for (let i = 0; i < json.length; i++) {
      const char = json[i];
      const prevChar = i > 0 ? json[i - 1] : '';

      if (escaped) {
        result += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        result += char;
        continue;
      }

      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
        result += '"';
      } else if (inString && char === stringChar) {
        inString = false;
        result += '"';
      } else {
        result += char;
      }
    }

    return result;
  }

  private addMissingQuotes(json: string): string {
    // Match unquoted keys: name: value → "name": value
    return json.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*):/g, '$1"$2"$3:');
  }

  private removeTrailingCommas(json: string): string {
    return json
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/,(\s*$)/gm, '');
  }

  private addMissingCommas(json: string): string {
    // Add missing commas between object properties
    let result = json.replace(/("\s*:\s*(?:"[^"]*"|[^,}\s]+))(\s+")([^"]+")(\s*:)/g, '$1,$2$3$4');
    
    // Add missing commas between array elements
    result = result.replace(/("\s*|\d+\s*|true\s*|false\s*|null\s*)(\s+["\d\[{])/g, '$1,$2');
    
    return result;
  }

  private fixInvalidEscapes(json: string): string {
    let result = '';
    let inString = false;
    let i = 0;

    while (i < json.length) {
      const char = json[i];

      if (char === '"' && (i === 0 || json[i - 1] !== '\\')) {
        inString = !inString;
        result += char;
        i++;
        continue;
      }

      if (inString && char === '\\') {
        const nextChar = json[i + 1];
        const validEscapes = ['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'];
        
        if (nextChar && validEscapes.includes(nextChar)) {
          result += char + nextChar;
          i += 2;
        } else {
          // Invalid escape - remove backslash
          result += nextChar || '';
          i += nextChar ? 2 : 1;
        }
      } else {
        result += char;
        i++;
      }
    }

    return result;
  }

  private cleanWhitespace(json: string): string {
    const lines = json.split('\n');
    const cleaned = lines
      .map(line => line.trimEnd())
      .filter((line, index, arr) => {
        // Remove consecutive empty lines
        if (line.trim() === '' && index > 0 && arr[index - 1].trim() === '') {
          return false;
        }
        return true;
      });
    
    return cleaned.join('\n').trim();
  }

  private aggressiveFix(json: string): string {
    // Last resort - try to salvage what we can
    let fixed = json;

    // Wrap in braces if not already
    if (!fixed.trim().startsWith('{') && !fixed.trim().startsWith('[')) {
      fixed = `{${fixed}}`;
    }

    // Remove all comments aggressively
    fixed = fixed.replace(/\/\/.*/g, '');
    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');

    // Fix quotes
    fixed = this.fixSmartQuotes(fixed);
    fixed = this.fixSingleQuotes(fixed);
    fixed = this.addMissingQuotes(fixed);

    // Clean commas
    fixed = this.removeTrailingCommas(fixed);

    // Remove invalid characters
    fixed = fixed.replace(/[\x00-\x1F\x7F]/g, '');

    return fixed;
  }
}
