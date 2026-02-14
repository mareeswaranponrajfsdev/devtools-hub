import { Component, signal, WritableSignal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../../../core/analytics/analytics.service';
import { ANALYTICS_EVENTS } from '../../../../core/analytics/analytics-events';

/* ── Language union type ── */
type Language =
  | 'csharp'
  | 'typescript'
  | 'java'
  | 'python'
  | 'go'
  | 'kotlin'
  | 'swift'
  | 'dart'
  | 'php'
  | 'rust'
  | 'javascript'
  | 'cpp'
  | 'ruby'
  | 'scala'
  | 'objc';

@Component({
  selector: 'app-code-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './code-generator.html',
  styleUrl: './code-generator.scss',
})
export class CodeGeneratorPage {

  /* ── Signals ── */
  jsonInput:     WritableSignal<string>   = signal('');
  language:      WritableSignal<Language> = signal('csharp');
  generatedCode: WritableSignal<string>   = signal('');
  error:         WritableSignal<string>   = signal('');
  className:     WritableSignal<string>   = signal('RootObject');
  copied:        WritableSignal<boolean>  = signal(false);

  /* ── Language definitions ── */
  languages: { value: Language; label: string; icon: string }[] = [
    { value: 'csharp',     label: 'C#',         icon: 'fa-brands fa-microsoft' },
    { value: 'typescript', label: 'TypeScript',  icon: 'fa-brands fa-js'       },
    { value: 'java',       label: 'Java',        icon: 'fa-brands fa-java'     },
    { value: 'python',     label: 'Python',      icon: 'fa-brands fa-python'   },
    { value: 'go',         label: 'Go',          icon: 'fa-solid fa-g'         },
    { value: 'kotlin',     label: 'Kotlin',      icon: 'fa-solid fa-k'         },
    { value: 'swift',      label: 'Swift',       icon: 'fa-brands fa-swift'    },
    { value: 'dart',       label: 'Dart',        icon: 'fa-solid fa-d'         },
    { value: 'php',        label: 'PHP',         icon: 'fa-brands fa-php'      },
    { value: 'rust',       label: 'Rust',        icon: 'fa-brands fa-rust'       },
    { value: 'javascript', label: 'JavaScript',  icon: 'fa-brands fa-square-js'  },
    { value: 'cpp',        label: 'C++',         icon: 'fa-solid fa-c'           },
    { value: 'ruby',       label: 'Ruby',        icon: 'fa-solid fa-gem'         },
    { value: 'scala',      label: 'Scala',       icon: 'fa-solid fa-s'           },
    { value: 'objc',       label: 'Objective-C', icon: 'fa-brands fa-apple'      },
  ];

  /* ── Computed label for output header ── */
  currentLanguageLabel = computed(() =>
    this.languages.find(l => l.value === this.language())?.label ?? this.language()
  );

  constructor(private analytics: AnalyticsService) {}

  /* ═══════════════════════════════════════════
     PUBLIC ACTIONS
  ═══════════════════════════════════════════ */

  generateCode(): void {
    this.error.set('');
    this.generatedCode.set('');
    this.copied.set(false);

    if (!this.jsonInput().trim()) {
      this.error.set('Please enter JSON data');
      return;
    }

    try {
      const json = JSON.parse(this.jsonInput());
      const code = this.convertToCode(json, this.className(), this.language());
      this.generatedCode.set(code);
      this.analytics.track(ANALYTICS_EVENTS.JSON_TO_CODE);
    } catch (err) {
      this.error.set('Invalid JSON: ' + (err as Error).message);
    }
  }

  copyCode(): void {
    if (!this.generatedCode()) return;
    navigator.clipboard.writeText(this.generatedCode()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  loadSample(): void {
    const sample = {
      userId:    1,
      name:      'John Doe',
      email:     'john@example.com',
      isActive:  true,
      score:     95.5,
      tags:      ['developer', 'typescript'],
      address: {
        street: '123 Main St',
        city:   'New York',
        zip:    '10001',
      },
    };
    this.jsonInput.set(JSON.stringify(sample, null, 2));
    this.generatedCode.set('');
    this.error.set('');
  }

  /* ═══════════════════════════════════════════
     ROUTER
  ═══════════════════════════════════════════ */

  private convertToCode(obj: any, className: string, lang: Language): string {
    switch (lang) {
      case 'csharp':     return this.generateCSharp(obj, className);
      case 'typescript': return this.generateTypeScript(obj, className);
      case 'java':       return this.generateJava(obj, className);
      case 'python':     return this.generatePython(obj, className);
      case 'go':         return this.generateGo(obj, className);
      case 'kotlin':     return this.generateKotlin(obj, className);
      case 'swift':      return this.generateSwift(obj, className);
      case 'dart':       return this.generateDart(obj, className);
      case 'php':        return this.generatePhp(obj, className);
      case 'rust':       return this.generateRust(obj, className);
      case 'javascript': return this.generateJavaScript(obj, className);
      case 'cpp':        return this.generateCpp(obj, className);
      case 'ruby':       return this.generateRuby(obj, className);
      case 'scala':      return this.generateScala(obj, className);
      case 'objc':       return this.generateObjC(obj, className);
    }
  }

  /* ═══════════════════════════════════════════
     1. C# — unchanged behaviour
  ═══════════════════════════════════════════ */

  private generateCSharp(obj: any, className: string): string {
    let output = '';
    const classes: string[] = [];
    this.collectCSharpClasses(obj, className, classes);
    output += classes.join('\n');
    return output.trim();
  }

  private collectCSharpClasses(obj: any, className: string, classes: string[]): void {
    let code = `public class ${className}\n{\n`;
    for (const [key, value] of Object.entries(obj)) {
      const propName = this.toPascalCase(key);
      const type = this.getCSharpType(value, propName, classes);
      code += `    public ${type} ${propName} { get; set; }\n`;
    }
    code += '}\n';
    classes.unshift(code);  // outer class first
  }

  private getCSharpType(value: any, propName: string, classes: string[]): string {
    if (value === null)             return 'object?';
    if (typeof value === 'string')  return 'string';
    if (typeof value === 'number')  return Number.isInteger(value) ? 'int' : 'double';
    if (typeof value === 'boolean') return 'bool';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'List<object>';
      const item = value[0];
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const nestedName = propName + 'Item';
        this.collectCSharpClasses(item, nestedName, classes);
        return `List<${nestedName}>`;
      }
      return `List<${this.getCSharpType(item, propName, classes)}>`;
    }
    if (typeof value === 'object') {
      this.collectCSharpClasses(value, propName, classes);
      return propName;
    }
    return 'object';
  }

  /* ═══════════════════════════════════════════
     2. TypeScript — unchanged behaviour
  ═══════════════════════════════════════════ */

  private generateTypeScript(obj: any, name: string): string {
    const interfaces: string[] = [];
    this.collectTsInterfaces(obj, name, interfaces);
    return interfaces.join('\n').trim();
  }

  private collectTsInterfaces(obj: any, name: string, interfaces: string[]): void {
    let code = `export interface ${name} {\n`;
    for (const [key, value] of Object.entries(obj)) {
      const type = this.getTsType(value, this.toPascalCase(key), interfaces);
      code += `  ${key}: ${type};\n`;
    }
    code += '}\n';
    interfaces.push(code);
  }

  private getTsType(value: any, propName: string, interfaces: string[]): string {
    if (value === null)             return 'any';
    if (typeof value === 'string')  return 'string';
    if (typeof value === 'number')  return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'any[]';
      const item = value[0];
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const nestedName = propName + 'Item';
        this.collectTsInterfaces(item, nestedName, interfaces);
        return `${nestedName}[]`;
      }
      return `${this.getTsType(item, propName, interfaces)}[]`;
    }
    if (typeof value === 'object') {
      this.collectTsInterfaces(value, propName, interfaces);
      return propName;
    }
    return 'any';
  }

  /* ═══════════════════════════════════════════
     3. Java — unchanged behaviour
  ═══════════════════════════════════════════ */

  private generateJava(obj: any, className: string): string {
    const classes: string[] = [];
    this.collectJavaClasses(obj, className, classes);
    const imports = 'import java.util.List;\n\n';
    return (imports + classes.join('\n')).trim();
  }

  private collectJavaClasses(obj: any, className: string, classes: string[]): void {
    let code = `public class ${className} {\n\n`;
    for (const [key, value] of Object.entries(obj)) {
      const field = this.toCamelCase(key);
      const type  = this.getJavaType(value, this.toPascalCase(key), classes);
      code += `    private ${type} ${field};\n`;
    }
    code += '\n';
    for (const [key, value] of Object.entries(obj)) {
      const field  = this.toCamelCase(key);
      const method = this.toPascalCase(key);
      const type   = this.getJavaType(value, this.toPascalCase(key), classes);
      code += `    public ${type} get${method}() {\n        return ${field};\n    }\n\n`;
      code += `    public void set${method}(${type} ${field}) {\n        this.${field} = ${field};\n    }\n\n`;
    }
    code += '}\n';
    classes.push(code);
  }

  private getJavaType(value: any, propName: string, classes: string[]): string {
    if (value === null)             return 'Object';
    if (typeof value === 'string')  return 'String';
    if (typeof value === 'number')  return Number.isInteger(value) ? 'Integer' : 'Double';
    if (typeof value === 'boolean') return 'Boolean';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'List<Object>';
      const item = value[0];
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const nestedName = propName + 'Item';
        this.collectJavaClasses(item, nestedName, classes);
        return `List<${nestedName}>`;
      }
      return `List<${this.getJavaType(item, propName, classes)}>`;
    }
    if (typeof value === 'object') {
      this.collectJavaClasses(value, propName, classes);
      return propName;
    }
    return 'Object';
  }

  /* ═══════════════════════════════════════════
     4. Python — dataclass with type hints
  ═══════════════════════════════════════════ */

  private generatePython(obj: any, className: string): string {
    const classes: string[] = [];
    this.collectPythonClasses(obj, className, classes);
    const header = 'from dataclasses import dataclass\nfrom typing import Optional, List, Any\n\n';
    return (header + classes.join('\n')).trim();
  }

  private collectPythonClasses(obj: any, className: string, classes: string[]): void {
    let code = `@dataclass\nclass ${className}:\n`;
    const entries = Object.entries(obj);
    if (entries.length === 0) { code += '    pass\n'; }
    for (const [key, value] of entries) {
      const pyName = this.toSnakeCase(key);
      const type   = this.getPythonType(value, this.toPascalCase(key), classes);
      code += `    ${pyName}: ${type}\n`;
    }
    classes.unshift(code + '\n');
  }

  private getPythonType(value: any, propName: string, classes: string[]): string {
    if (value === null)             return 'Optional[Any]';
    if (typeof value === 'string')  return 'str';
    if (typeof value === 'number')  return Number.isInteger(value) ? 'int' : 'float';
    if (typeof value === 'boolean') return 'bool';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'List[Any]';
      const item = value[0];
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const nestedName = propName + 'Item';
        this.collectPythonClasses(item, nestedName, classes);
        return `List[${nestedName}]`;
      }
      return `List[${this.getPythonType(item, propName, classes)}]`;
    }
    if (typeof value === 'object') {
      this.collectPythonClasses(value, propName, classes);
      return propName;
    }
    return 'Any';
  }

  /* ═══════════════════════════════════════════
     5. Go — struct with json tags
  ═══════════════════════════════════════════ */

  private generateGo(obj: any, className: string): string {
    const structs: string[] = [];
    this.collectGoStructs(obj, className, structs);
    return ('package main\n\n' + structs.join('\n')).trim();
  }

  private collectGoStructs(obj: any, name: string, structs: string[]): void {
    let code = `type ${name} struct {\n`;
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = this.toPascalCase(key);
      const tag       = `\`json:"${key}"\``;
      const type      = this.getGoType(value, this.toPascalCase(key), structs);
      code += `    ${fieldName} ${type} ${tag}\n`;
    }
    code += '}\n';
    structs.unshift(code);
  }

  private getGoType(value: any, propName: string, structs: string[]): string {
    if (value === null)             return 'interface{}';
    if (typeof value === 'string')  return 'string';
    if (typeof value === 'number')  return Number.isInteger(value) ? 'int' : 'float64';
    if (typeof value === 'boolean') return 'bool';
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]interface{}';
      const item = value[0];
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const nestedName = propName + 'Item';
        this.collectGoStructs(item, nestedName, structs);
        return `[]${nestedName}`;
      }
      return `[]${this.getGoType(item, propName, structs)}`;
    }
    if (typeof value === 'object') {
      this.collectGoStructs(value, propName, structs);
      return propName;
    }
    return 'interface{}';
  }

  /* ═══════════════════════════════════════════
     6. Kotlin — data class with nullable support
  ═══════════════════════════════════════════ */

  private generateKotlin(obj: any, className: string): string {
    const classes: string[] = [];
    this.collectKotlinClasses(obj, className, classes);
    return classes.join('\n').trim();
  }

  private collectKotlinClasses(obj: any, className: string, classes: string[]): void {
    const props: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const propName = this.toCamelCase(key);
      const type     = this.getKotlinType(value, this.toPascalCase(key), classes);
      const nullable = value === null ? '?' : '';
      const default_ = value === null ? ' = null' : '';
      props.push(`    val ${propName}: ${type}${nullable}${default_}`);
    }
    const code = `data class ${className}(\n${props.join(',\n')}\n)\n`;
    classes.unshift(code);
  }

  private getKotlinType(value: any, propName: string, classes: string[]): string {
    if (value === null)             return 'Any';
    if (typeof value === 'string')  return 'String';
    if (typeof value === 'number')  return Number.isInteger(value) ? 'Int' : 'Double';
    if (typeof value === 'boolean') return 'Boolean';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'List<Any>';
      const item = value[0];
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const nestedName = propName + 'Item';
        this.collectKotlinClasses(item, nestedName, classes);
        return `List<${nestedName}>`;
      }
      return `List<${this.getKotlinType(item, propName, classes)}>`;
    }
    if (typeof value === 'object') {
      this.collectKotlinClasses(value, propName, classes);
      return propName;
    }
    return 'Any';
  }

  /* ═══════════════════════════════════════════
     7. Swift — Codable struct
  ═══════════════════════════════════════════ */

  private generateSwift(obj: any, className: string): string {
    const structs: string[] = [];
    this.collectSwiftStructs(obj, className, structs);
    return ('import Foundation\n\n' + structs.join('\n')).trim();
  }

  private collectSwiftStructs(obj: any, name: string, structs: string[]): void {
    let code = `struct ${name}: Codable {\n`;
    for (const [key, value] of Object.entries(obj)) {
      const propName = this.toCamelCase(key);
      const type     = this.getSwiftType(value, this.toPascalCase(key), structs);
      const optional = value === null ? '?' : '';
      code += `    let ${propName}: ${type}${optional}\n`;
    }
    code += '}\n';
    structs.unshift(code);
  }

  private getSwiftType(value: any, propName: string, structs: string[]): string {
    if (value === null)             return 'Any';
    if (typeof value === 'string')  return 'String';
    if (typeof value === 'number')  return Number.isInteger(value) ? 'Int' : 'Double';
    if (typeof value === 'boolean') return 'Bool';
    if (Array.isArray(value)) {
      if (value.length === 0) return '[Any]';
      const item = value[0];
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const nestedName = propName + 'Item';
        this.collectSwiftStructs(item, nestedName, structs);
        return `[${nestedName}]`;
      }
      return `[${this.getSwiftType(item, propName, structs)}]`;
    }
    if (typeof value === 'object') {
      this.collectSwiftStructs(value, propName, structs);
      return propName;
    }
    return 'Any';
  }

  /* ═══════════════════════════════════════════
     8. Dart — typed model class with fromJson
  ═══════════════════════════════════════════ */

  private generateDart(obj: any, className: string): string {
    const classes: string[] = [];
    this.collectDartClasses(obj, className, classes);
    return classes.join('\n').trim();
  }

  private collectDartClasses(obj: any, className: string, classes: string[]): void {
    const entries = Object.entries(obj);
    let code = `class ${className} {\n`;

    // Fields
    for (const [key, value] of entries) {
      const fieldName = this.toCamelCase(key);
      const type      = this.getDartType(value, this.toPascalCase(key), classes);
      const nullable  = value === null ? '?' : '';
      code += `  final ${type}${nullable} ${fieldName};\n`;
    }
    code += '\n';

    // Constructor
    code += `  ${className}({\n`;
    for (const [key, value] of entries) {
      const fieldName = this.toCamelCase(key);
      const required  = value !== null ? 'required ' : '';
      code += `    ${required}this.${fieldName},\n`;
    }
    code += '  });\n\n';

    // fromJson factory
    code += `  factory ${className}.fromJson(Map<String, dynamic> json) {\n`;
    code += `    return ${className}(\n`;
    for (const [key, value] of entries) {
      const fieldName = this.toCamelCase(key);
      const type      = this.getDartType(value, this.toPascalCase(key), classes);
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        code += `      ${fieldName}: ${type}.fromJson(json['${key}']),\n`;
      } else {
        code += `      ${fieldName}: json['${key}'],\n`;
      }
    }
    code += '    );\n  }\n\n';

    // toJson
    code += `  Map<String, dynamic> toJson() => {\n`;
    for (const [key] of entries) {
      const fieldName = this.toCamelCase(key);
      code += `    '${key}': ${fieldName},\n`;
    }
    code += '  };\n}\n';
    classes.unshift(code);
  }

  private getDartType(value: any, propName: string, classes: string[]): string {
    if (value === null)             return 'dynamic';
    if (typeof value === 'string')  return 'String';
    if (typeof value === 'number')  return Number.isInteger(value) ? 'int' : 'double';
    if (typeof value === 'boolean') return 'bool';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'List<dynamic>';
      const item = value[0];
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const nestedName = propName + 'Item';
        this.collectDartClasses(item, nestedName, classes);
        return `List<${nestedName}>`;
      }
      return `List<${this.getDartType(item, propName, classes)}>`;
    }
    if (typeof value === 'object') {
      this.collectDartClasses(value, propName, classes);
      return propName;
    }
    return 'dynamic';
  }

  /* ═══════════════════════════════════════════
     9. PHP — class with typed properties
  ═══════════════════════════════════════════ */

  private generatePhp(obj: any, className: string): string {
    const classes: string[] = [];
    this.collectPhpClasses(obj, className, classes);
    return ('<?php\n\ndeclare(strict_types=1);\n\n' + classes.join('\n')).trim();
  }

  private collectPhpClasses(obj: any, className: string, classes: string[]): void {
    let code = `class ${className}\n{\n`;
    for (const [key, value] of Object.entries(obj)) {
      const propName = this.toCamelCase(key);
      const type     = this.getPhpType(value, this.toPascalCase(key), classes);
      const nullable = value === null ? '?' : '';
      code += `    public ${nullable}${type} $${propName};\n`;
    }

    // Constructor
    code += '\n    public function __construct(\n';
    const params: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const propName = this.toCamelCase(key);
      const type     = this.getPhpType(value, this.toPascalCase(key), classes);
      const nullable = value === null ? '?' : '';
      params.push(`        ${nullable}${type} $${propName} = null`);
    }
    code += params.join(',\n') + '\n    ) {\n';
    for (const [key] of Object.entries(obj)) {
      const propName = this.toCamelCase(key);
      code += `        $this->${propName} = $${propName};\n`;
    }
    code += '    }\n}\n';
    classes.unshift(code);
  }

  private getPhpType(value: any, propName: string, classes: string[]): string {
    if (value === null)             return 'mixed';
    if (typeof value === 'string')  return 'string';
    if (typeof value === 'number')  return Number.isInteger(value) ? 'int' : 'float';
    if (typeof value === 'boolean') return 'bool';
    if (Array.isArray(value)) {
      return 'array';
    }
    if (typeof value === 'object') {
      this.collectPhpClasses(value, propName, classes);
      return propName;
    }
    return 'mixed';
  }

  /* ═══════════════════════════════════════════
     10. Rust — struct with serde
  ═══════════════════════════════════════════ */

  private generateRust(obj: any, className: string): string {
    const structs: string[] = [];
    this.collectRustStructs(obj, className, structs);
    const header = 'use serde::{Deserialize, Serialize};\n\n';
    return (header + structs.join('\n')).trim();
  }

  private collectRustStructs(obj: any, name: string, structs: string[]): void {
    let code = `#[derive(Debug, Serialize, Deserialize)]\npub struct ${name} {\n`;
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = this.toSnakeCase(key);
      const type      = this.getRustType(value, this.toPascalCase(key), structs);
      // Add serde rename if the key differs from snake_case
      if (fieldName !== key) {
        code += `    #[serde(rename = "${key}")]\n`;
      }
      code += `    pub ${fieldName}: ${type},\n`;
    }
    code += '}\n';
    structs.unshift(code);
  }

  private getRustType(value: any, propName: string, structs: string[]): string {
    if (value === null)             return 'Option<serde_json::Value>';
    if (typeof value === 'string')  return 'String';
    if (typeof value === 'number')  return Number.isInteger(value) ? 'i64' : 'f64';
    if (typeof value === 'boolean') return 'bool';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'Vec<serde_json::Value>';
      const item = value[0];
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const nestedName = propName + 'Item';
        this.collectRustStructs(item, nestedName, structs);
        return `Vec<${nestedName}>`;
      }
      return `Vec<${this.getRustType(item, propName, structs)}>`;
    }
    if (typeof value === 'object') {
      this.collectRustStructs(value, propName, structs);
      return propName;
    }
    return 'serde_json::Value';
  }

  /* ═══════════════════════════════════════════
     11. JavaScript — ES6 class with constructor
  ═══════════════════════════════════════════ */

  private generateJavaScript(obj: any, className: string): string {
    const classes: string[] = [];
    this.collectJsClasses(obj, className, classes);
    return classes.join('\n').trim();
  }

  private collectJsClasses(obj: any, className: string, classes: string[]): void {
    const entries = Object.entries(obj);
    let code = `class ${className} {\n`;
    code += `  constructor({\n`;
    for (const [key] of entries) {
      code += `    ${this.toCamelCase(key)} = null,\n`;
    }
    code += `  } = {}) {\n`;
    for (const [key, value] of entries) {
      const field = this.toCamelCase(key);
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const nested = this.toPascalCase(key);
        this.collectJsClasses(value, nested, classes);
      }
      code += `    this.${field} = ${this.toCamelCase(key)};\n`;
    }
    code += `  }\n}\n`;
    classes.unshift(code);
  }

  /* ═══════════════════════════════════════════
     12. C++ — class with typed members
  ═══════════════════════════════════════════ */

  private generateCpp(obj: any, className: string): string {
    const classes: string[] = [];
    this.collectCppClasses(obj, className, classes);
    const header = '#include <string>\n#include <vector>\n#include <optional>\n\n';
    return (header + classes.join('\n')).trim();
  }

  private collectCppClasses(obj: any, className: string, classes: string[]): void {
    let code = `class ${className} {\npublic:\n`;
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = this.toCamelCase(key);
      const type = this.getCppType(value, this.toPascalCase(key), classes);
      code += `    ${type} ${fieldName};\n`;
    }
    code += `\n    ${className}() = default;\n};\n`;
    classes.unshift(code);
  }

  private getCppType(value: any, propName: string, classes: string[]): string {
    if (value === null)             return 'std::optional<std::string>';
    if (typeof value === 'string')  return 'std::string';
    if (typeof value === 'number')  return Number.isInteger(value) ? 'int' : 'double';
    if (typeof value === 'boolean') return 'bool';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'std::vector<std::string>';
      const item = value[0];
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const n = propName + 'Item';
        this.collectCppClasses(item, n, classes);
        return `std::vector<${n}>`;
      }
      return `std::vector<${this.getCppType(item, propName, classes)}>`;
    }
    if (typeof value === 'object') {
      this.collectCppClasses(value, propName, classes);
      return propName;
    }
    return 'std::string';
  }

  /* ═══════════════════════════════════════════
     13. Ruby — class with attr_accessor
  ═══════════════════════════════════════════ */

  private generateRuby(obj: any, className: string): string {
    const classes: string[] = [];
    this.collectRubyClasses(obj, className, classes);
    return classes.join('\n').trim();
  }

  private collectRubyClasses(obj: any, className: string, classes: string[]): void {
    const entries = Object.entries(obj);
    let code = `class ${className}\n`;

    // attr_accessor for all fields
    const attrs = entries.map(([k]) => `:${this.toSnakeCase(k)}`).join(', ');
    code += `  attr_accessor ${attrs}\n\n`;

    // initialize
    code += `  def initialize(\n`;
    const params = entries.map(([k]) => `    ${this.toSnakeCase(k)}: nil`);
    code += params.join(',\n') + '\n  )\n';
    for (const [key, value] of entries) {
      const field = this.toSnakeCase(key);
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.collectRubyClasses(value, this.toPascalCase(key), classes);
      }
      code += `    @${field} = ${field}\n`;
    }
    code += `  end\nend\n`;
    classes.unshift(code);
  }

  /* ═══════════════════════════════════════════
     14. Scala — case class
  ═══════════════════════════════════════════ */

  private generateScala(obj: any, className: string): string {
    const classes: string[] = [];
    this.collectScalaClasses(obj, className, classes);
    return classes.join('\n').trim();
  }

  private collectScalaClasses(obj: any, className: string, classes: string[]): void {
    const props: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const propName = this.toCamelCase(key);
      const type     = this.getScalaType(value, this.toPascalCase(key), classes);
      const nullable = value === null ? ' = None' : '';
      props.push(`  ${propName}: ${type}${nullable}`);
    }
    const code = `case class ${className}(\n${props.join(',\n')}\n)\n`;
    classes.unshift(code);
  }

  private getScalaType(value: any, propName: string, classes: string[]): string {
    if (value === null)             return 'Option[Any]';
    if (typeof value === 'string')  return 'String';
    if (typeof value === 'number')  return Number.isInteger(value) ? 'Int' : 'Double';
    if (typeof value === 'boolean') return 'Boolean';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'List[Any]';
      const item = value[0];
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const n = propName + 'Item';
        this.collectScalaClasses(item, n, classes);
        return `List[${n}]`;
      }
      return `List[${this.getScalaType(item, propName, classes)}]`;
    }
    if (typeof value === 'object') {
      this.collectScalaClasses(value, propName, classes);
      return propName;
    }
    return 'Any';
  }

  /* ═══════════════════════════════════════════
     15. Objective-C — NSObject model
  ═══════════════════════════════════════════ */

  private generateObjC(obj: any, className: string): string {
    const classes: string[] = [];
    this.collectObjCClasses(obj, className, classes);
    return classes.join('\n').trim();
  }

  private collectObjCClasses(obj: any, className: string, classes: string[]): void {
    // Header (.h)
    let header = `@interface ${className} : NSObject\n\n`;
    for (const [key, value] of Object.entries(obj)) {
      const propName = this.toCamelCase(key);
      const type     = this.getObjCType(value, this.toPascalCase(key), classes);
      const attrs    = typeof value === 'string' || typeof value === 'object'
        ? 'nonatomic, strong'
        : 'nonatomic, assign';
      header += `@property (${attrs}) ${type} ${propName};\n`;
    }
    header += `\n@end\n`;

    // Implementation (.m)
    let impl = `@implementation ${className}\n@end\n`;

    classes.unshift(header + '\n' + impl);
  }

  private getObjCType(value: any, propName: string, classes: string[]): string {
    if (value === null)             return 'id';
    if (typeof value === 'string')  return 'NSString *';
    if (typeof value === 'number')  return Number.isInteger(value) ? 'NSInteger' : 'CGFloat';
    if (typeof value === 'boolean') return 'BOOL';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'NSArray *';
      const item = value[0];
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        const n = propName + 'Item';
        this.collectObjCClasses(item, n, classes);
        return `NSArray<${n} *> *`;
      }
      return 'NSArray *';
    }
    if (typeof value === 'object') {
      this.collectObjCClasses(value, propName, classes);
      return `${propName} *`;
    }
    return 'id';
  }

  /* ═══════════════════════════════════════════
     UTILITIES
  ═══════════════════════════════════════════ */

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, c => c.toUpperCase());
  }

  private toCamelCase(str: string): string {
    const p = this.toPascalCase(str);
    return p.charAt(0).toLowerCase() + p.slice(1);
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .replace(/[-\s]+/g, '_')
      .replace(/^_/, '')
      .toLowerCase();
  }
}
