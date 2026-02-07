import { Component, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/* ✅ Define Language Type */
type Language = 'csharp' | 'typescript' | 'java';

@Component({
  selector: 'app-code-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './code-generator.html',
  styleUrl: './code-generator.scss'
})
export class CodeGeneratorPage {

  /* ✅ Signals */
  jsonInput: WritableSignal<string> = signal('');
  language: WritableSignal<Language> = signal('csharp');
  generatedCode: WritableSignal<string> = signal('');
  error: WritableSignal<string> = signal('');
  className: WritableSignal<string> = signal('RootObject');

  /* ✅ Properly Typed Languages Array */
  languages: {
    value: Language;
    label: string;
    icon: string;
  }[] = [
    { value: 'csharp', label: 'C#', icon: 'fa-brands fa-microsoft' },
    { value: 'typescript', label: 'TypeScript', icon: 'fa-brands fa-js' },
    { value: 'java', label: 'Java', icon: 'fa-brands fa-java' }
  ];

  /* ============================= */

  generateCode(): void {

    this.error.set('');
    this.generatedCode.set('');

    if (!this.jsonInput().trim()) {
      this.error.set('Please enter JSON data');
      return;
    }

    try {
      const json = JSON.parse(this.jsonInput());
      const code = this.convertToCode(
        json,
        this.className(),
        this.language()
      );

      this.generatedCode.set(code);

    } catch (err) {

      this.error.set('Invalid JSON: ' + (err as Error).message);
    }
  }

  /* ============================= */

  private convertToCode(
    obj: any,
    className: string,
    lang: Language
  ): string {

    switch (lang) {

      case 'csharp':
        return this.generateCSharp(obj, className);

      case 'typescript':
        return this.generateTypeScript(obj, className);

      case 'java':
        return this.generateJava(obj, className);
    }
  }

  /* ============================= */

  private generateCSharp(obj: any, className: string): string {

    let code = `public class ${className}\n{\n`;

    for (const [key, value] of Object.entries(obj)) {

      const propName = this.toPascalCase(key);
      const type = this.getCSharpType(value);

      code += `    public ${type} ${propName} { get; set; }\n`;
    }

    code += '}\n';

    return code;
  }

  /* ============================= */

  private generateTypeScript(obj: any, name: string): string {

    let code = `export interface ${name} {\n`;

    for (const [key, value] of Object.entries(obj)) {

      const type = this.getTypeScriptType(value);

      code += `  ${key}: ${type};\n`;
    }

    code += '}\n';

    return code;
  }

  /* ============================= */

  private generateJava(obj: any, className: string): string {

    let code = `public class ${className} {\n\n`;

    for (const [key, value] of Object.entries(obj)) {

      const field = this.toCamelCase(key);
      const type = this.getJavaType(value);

      code += `    private ${type} ${field};\n`;
    }

    code += '\n';

    // Getters / Setters
    for (const [key, value] of Object.entries(obj)) {

      const field = this.toCamelCase(key);
      const name = this.toPascalCase(key);
      const type = this.getJavaType(value);

      code += `    public ${type} get${name}() {\n`;
      code += `        return ${field};\n`;
      code += `    }\n\n`;

      code += `    public void set${name}(${type} ${field}) {\n`;
      code += `        this.${field} = ${field};\n`;
      code += `    }\n\n`;
    }

    code += '}\n';

    return code;
  }

  /* ============================= */

  private getCSharpType(value: any): string {

    if (value === null) return 'object';

    if (typeof value === 'string') return 'string';

    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'int' : 'double';
    }

    if (typeof value === 'boolean') return 'bool';

    if (Array.isArray(value)) return 'List<object>';

    if (typeof value === 'object') return 'object';

    return 'object';
  }

  /* ============================= */

  private getTypeScriptType(value: any): string {

    if (value === null) return 'any';

    if (typeof value === 'string') return 'string';

    if (typeof value === 'number') return 'number';

    if (typeof value === 'boolean') return 'boolean';

    if (Array.isArray(value)) return 'any[]';

    if (typeof value === 'object') return 'object';

    return 'any';
  }

  /* ============================= */

  private getJavaType(value: any): string {

    if (value === null) return 'Object';

    if (typeof value === 'string') return 'String';

    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'Integer' : 'Double';
    }

    if (typeof value === 'boolean') return 'Boolean';

    if (Array.isArray(value)) return 'List<Object>';

    if (typeof value === 'object') return 'Object';

    return 'Object';
  }

  /* ============================= */

  private toPascalCase(str: string): string {

    return str.replace(/(?:^|_)([a-z])/g, (_, c) => c.toUpperCase());
  }

  private toCamelCase(str: string): string {

    const pascal = this.toPascalCase(str);

    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  /* ============================= */

  copyCode(): void {

    navigator.clipboard.writeText(this.generatedCode());
  }

  /* ============================= */

  loadSample(): void {

    const sample = {
      userId: 1,
      name: 'John Doe',
      email: 'john@example.com',
      isActive: true,
      score: 95.5,
      tags: ['developer', 'typescript']
    };

    this.jsonInput.set(JSON.stringify(sample, null, 2));
  }
}
