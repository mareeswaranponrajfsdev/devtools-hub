import { Injectable } from '@angular/core';

export type SupportedLanguage =
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

export interface CodeGenOptions {
  language: SupportedLanguage;
  className?: string;
  namespace?: string;
  useNullable?: boolean;
  useCamelCase?: boolean;
}

/**
 * JsonToCodeService
 * Shared service for JSON → Code generation.
 * All generator logic lives in the CodeGeneratorPage component itself;
 * this service is available for external consumers (e.g. other tools).
 */
@Injectable({ providedIn: 'root' })
export class JsonToCodeService {

  generateCode(jsonString: string, options: CodeGenOptions): string {
    try {
      const json = JSON.parse(jsonString);
      const className = options.className || 'RootObject';
      switch (options.language) {
        case 'csharp':     return this.generateCSharp(json, className);
        case 'typescript': return this.generateTypeScript(json, className);
        case 'java':       return this.generateJava(json, className);
        case 'python':     return this.generatePython(json, className);
        case 'go':         return this.generateGo(json, className);
        case 'kotlin':     return this.generateKotlin(json, className);
        case 'swift':      return this.generateSwift(json, className);
        case 'dart':       return this.generateDart(json, className);
        case 'php':        return this.generatePhp(json, className);
        case 'rust':       return this.generateRust(json, className);
        case 'javascript': return this.generateJavaScript(json, className);
        case 'cpp':        return this.generateCpp(json, className);
        case 'ruby':       return this.generateRuby(json, className);
        case 'scala':      return this.generateScala(json, className);
        case 'objc':       return this.generateObjC(json, className);
        default:           return '';
      }
    } catch (e) {
      throw new Error('Invalid JSON: ' + (e as Error).message);
    }
  }

  /* ── C# ── */
  private generateCSharp(obj: any, className: string): string {
    const classes: string[] = [];
    this.csharpClass(obj, className, classes);
    return classes.join('\n').trim();
  }
  private csharpClass(obj: any, name: string, out: string[]): void {
    let c = `public class ${name}\n{\n`;
    for (const [k, v] of Object.entries(obj)) {
      const p = this.pascal(k);
      c += `    public ${this.csharpType(v, p, out)} ${p} { get; set; }\n`;
    }
    c += '}\n'; out.unshift(c);
  }
  private csharpType(v: any, p: string, out: string[]): string {
    if (v === null) return 'object?';
    if (typeof v === 'string') return 'string';
    if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'double';
    if (typeof v === 'boolean') return 'bool';
    if (Array.isArray(v)) {
      if (!v.length) return 'List<object>';
      if (typeof v[0] === 'object' && v[0]) { const n = p + 'Item'; this.csharpClass(v[0], n, out); return `List<${n}>`; }
      return `List<${this.csharpType(v[0], p, out)}>`;
    }
    if (typeof v === 'object') { this.csharpClass(v, p, out); return p; }
    return 'object';
  }

  /* ── TypeScript ── */
  private generateTypeScript(obj: any, name: string): string {
    const ifaces: string[] = [];
    this.tsInterface(obj, name, ifaces);
    return ifaces.join('\n').trim();
  }
  private tsInterface(obj: any, name: string, out: string[]): void {
    let c = `export interface ${name} {\n`;
    for (const [k, v] of Object.entries(obj)) c += `  ${k}: ${this.tsType(v, this.pascal(k), out)};\n`;
    c += '}\n'; out.push(c);
  }
  private tsType(v: any, p: string, out: string[]): string {
    if (v === null) return 'any';
    if (typeof v === 'string') return 'string';
    if (typeof v === 'number') return 'number';
    if (typeof v === 'boolean') return 'boolean';
    if (Array.isArray(v)) {
      if (!v.length) return 'any[]';
      if (typeof v[0] === 'object' && v[0]) { const n = p + 'Item'; this.tsInterface(v[0], n, out); return `${n}[]`; }
      return `${this.tsType(v[0], p, out)}[]`;
    }
    if (typeof v === 'object') { this.tsInterface(v, p, out); return p; }
    return 'any';
  }

  /* ── Java ── */
  private generateJava(obj: any, className: string): string {
    const classes: string[] = [];
    this.javaClass(obj, className, classes);
    return ('import java.util.List;\n\n' + classes.join('\n')).trim();
  }
  private javaClass(obj: any, name: string, out: string[]): void {
    let c = `public class ${name} {\n\n`;
    for (const [k, v] of Object.entries(obj)) c += `    private ${this.javaType(v, this.pascal(k), out)} ${this.camel(k)};\n`;
    c += '\n';
    for (const [k, v] of Object.entries(obj)) {
      const f = this.camel(k), m = this.pascal(k), t = this.javaType(v, m, out);
      c += `    public ${t} get${m}() { return ${f}; }\n`;
      c += `    public void set${m}(${t} ${f}) { this.${f} = ${f}; }\n\n`;
    }
    c += '}\n'; out.push(c);
  }
  private javaType(v: any, p: string, out: string[]): string {
    if (v === null) return 'Object';
    if (typeof v === 'string') return 'String';
    if (typeof v === 'number') return Number.isInteger(v) ? 'Integer' : 'Double';
    if (typeof v === 'boolean') return 'Boolean';
    if (Array.isArray(v)) {
      if (!v.length) return 'List<Object>';
      if (typeof v[0] === 'object' && v[0]) { const n = p + 'Item'; this.javaClass(v[0], n, out); return `List<${n}>`; }
      return `List<${this.javaType(v[0], p, out)}>`;
    }
    if (typeof v === 'object') { this.javaClass(v, p, out); return p; }
    return 'Object';
  }

  /* ── Python ── */
  private generatePython(obj: any, className: string): string {
    const classes: string[] = [];
    this.pythonClass(obj, className, classes);
    return ('from dataclasses import dataclass\nfrom typing import Optional, List, Any\n\n' + classes.join('\n')).trim();
  }
  private pythonClass(obj: any, name: string, out: string[]): void {
    let c = `@dataclass\nclass ${name}:\n`;
    for (const [k, v] of Object.entries(obj)) c += `    ${this.snake(k)}: ${this.pyType(v, this.pascal(k), out)}\n`;
    c += '\n'; out.unshift(c);
  }
  private pyType(v: any, p: string, out: string[]): string {
    if (v === null) return 'Optional[Any]';
    if (typeof v === 'string') return 'str';
    if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'float';
    if (typeof v === 'boolean') return 'bool';
    if (Array.isArray(v)) {
      if (!v.length) return 'List[Any]';
      if (typeof v[0] === 'object' && v[0]) { const n = p + 'Item'; this.pythonClass(v[0], n, out); return `List[${n}]`; }
      return `List[${this.pyType(v[0], p, out)}]`;
    }
    if (typeof v === 'object') { this.pythonClass(v, p, out); return p; }
    return 'Any';
  }

  /* ── Go ── */
  private generateGo(obj: any, name: string): string {
    const structs: string[] = [];
    this.goStruct(obj, name, structs);
    return ('package main\n\n' + structs.join('\n')).trim();
  }
  private goStruct(obj: any, name: string, out: string[]): void {
    let c = `type ${name} struct {\n`;
    for (const [k, v] of Object.entries(obj)) c += `    ${this.pascal(k)} ${this.goType(v, this.pascal(k), out)} \`json:"${k}"\`\n`;
    c += '}\n'; out.unshift(c);
  }
  private goType(v: any, p: string, out: string[]): string {
    if (v === null) return 'interface{}';
    if (typeof v === 'string') return 'string';
    if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'float64';
    if (typeof v === 'boolean') return 'bool';
    if (Array.isArray(v)) {
      if (!v.length) return '[]interface{}';
      if (typeof v[0] === 'object' && v[0]) { const n = p + 'Item'; this.goStruct(v[0], n, out); return `[]${n}`; }
      return `[]${this.goType(v[0], p, out)}`;
    }
    if (typeof v === 'object') { this.goStruct(v, p, out); return p; }
    return 'interface{}';
  }

  /* ── Kotlin ── */
  private generateKotlin(obj: any, name: string): string {
    const classes: string[] = [];
    this.kotlinClass(obj, name, classes);
    return classes.join('\n').trim();
  }
  private kotlinClass(obj: any, name: string, out: string[]): void {
    const props = Object.entries(obj).map(([k, v]) => {
      const t = this.kotlinType(v, this.pascal(k), out);
      return `    val ${this.camel(k)}: ${t}${v === null ? '? = null' : ''}`;
    });
    out.unshift(`data class ${name}(\n${props.join(',\n')}\n)\n`);
  }
  private kotlinType(v: any, p: string, out: string[]): string {
    if (v === null) return 'Any';
    if (typeof v === 'string') return 'String';
    if (typeof v === 'number') return Number.isInteger(v) ? 'Int' : 'Double';
    if (typeof v === 'boolean') return 'Boolean';
    if (Array.isArray(v)) {
      if (!v.length) return 'List<Any>';
      if (typeof v[0] === 'object' && v[0]) { const n = p + 'Item'; this.kotlinClass(v[0], n, out); return `List<${n}>`; }
      return `List<${this.kotlinType(v[0], p, out)}>`;
    }
    if (typeof v === 'object') { this.kotlinClass(v, p, out); return p; }
    return 'Any';
  }

  /* ── Swift ── */
  private generateSwift(obj: any, name: string): string {
    const structs: string[] = [];
    this.swiftStruct(obj, name, structs);
    return ('import Foundation\n\n' + structs.join('\n')).trim();
  }
  private swiftStruct(obj: any, name: string, out: string[]): void {
    let c = `struct ${name}: Codable {\n`;
    for (const [k, v] of Object.entries(obj)) c += `    let ${this.camel(k)}: ${this.swiftType(v, this.pascal(k), out)}${v === null ? '?' : ''}\n`;
    c += '}\n'; out.unshift(c);
  }
  private swiftType(v: any, p: string, out: string[]): string {
    if (v === null) return 'Any';
    if (typeof v === 'string') return 'String';
    if (typeof v === 'number') return Number.isInteger(v) ? 'Int' : 'Double';
    if (typeof v === 'boolean') return 'Bool';
    if (Array.isArray(v)) {
      if (!v.length) return '[Any]';
      if (typeof v[0] === 'object' && v[0]) { const n = p + 'Item'; this.swiftStruct(v[0], n, out); return `[${n}]`; }
      return `[${this.swiftType(v[0], p, out)}]`;
    }
    if (typeof v === 'object') { this.swiftStruct(v, p, out); return p; }
    return 'Any';
  }

  /* ── Dart ── */
  private generateDart(obj: any, name: string): string {
    const classes: string[] = [];
    this.dartClass(obj, name, classes);
    return classes.join('\n').trim();
  }
  private dartClass(obj: any, name: string, out: string[]): void {
    const entries = Object.entries(obj);
    let c = `class ${name} {\n`;
    for (const [k, v] of entries) c += `  final ${this.dartType(v, this.pascal(k), out)}${v === null ? '?' : ''} ${this.camel(k)};\n`;
    c += `\n  ${name}({${entries.map(([k, v]) => `${v !== null ? 'required ' : ''}this.${this.camel(k)}`).join(', ')}});\n`;
    c += `\n  factory ${name}.fromJson(Map<String, dynamic> json) => ${name}(${entries.map(([k]) => `${this.camel(k)}: json['${k}']`).join(', ')});\n`;
    c += `\n  Map<String, dynamic> toJson() => {${entries.map(([k]) => `'${k}': ${this.camel(k)}`).join(', ')}};\n}\n`;
    out.unshift(c);
  }
  private dartType(v: any, p: string, out: string[]): string {
    if (v === null) return 'dynamic';
    if (typeof v === 'string') return 'String';
    if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'double';
    if (typeof v === 'boolean') return 'bool';
    if (Array.isArray(v)) {
      if (!v.length) return 'List<dynamic>';
      if (typeof v[0] === 'object' && v[0]) { const n = p + 'Item'; this.dartClass(v[0], n, out); return `List<${n}>`; }
      return `List<${this.dartType(v[0], p, out)}>`;
    }
    if (typeof v === 'object') { this.dartClass(v, p, out); return p; }
    return 'dynamic';
  }

  /* ── PHP ── */
  private generatePhp(obj: any, name: string): string {
    const classes: string[] = [];
    this.phpClass(obj, name, classes);
    return ('<?php\n\ndeclare(strict_types=1);\n\n' + classes.join('\n')).trim();
  }
  private phpClass(obj: any, name: string, out: string[]): void {
    let c = `class ${name}\n{\n`;
    for (const [k, v] of Object.entries(obj)) c += `    public ${v === null ? '?' : ''}${this.phpType(v, this.pascal(k), out)} $${this.camel(k)};\n`;
    c += '}\n'; out.unshift(c);
  }
  private phpType(v: any, p: string, out: string[]): string {
    if (v === null) return 'mixed';
    if (typeof v === 'string') return 'string';
    if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'float';
    if (typeof v === 'boolean') return 'bool';
    if (Array.isArray(v)) return 'array';
    if (typeof v === 'object') { this.phpClass(v, p, out); return p; }
    return 'mixed';
  }

  /* ── Rust ── */
  private generateRust(obj: any, name: string): string {
    const structs: string[] = [];
    this.rustStruct(obj, name, structs);
    return ('use serde::{Deserialize, Serialize};\n\n' + structs.join('\n')).trim();
  }
  private rustStruct(obj: any, name: string, out: string[]): void {
    let c = `#[derive(Debug, Serialize, Deserialize)]\npub struct ${name} {\n`;
    for (const [k, v] of Object.entries(obj)) {
      const sn = this.snake(k);
      if (sn !== k) c += `    #[serde(rename = "${k}")]\n`;
      c += `    pub ${sn}: ${this.rustType(v, this.pascal(k), out)},\n`;
    }
    c += '}\n'; out.unshift(c);
  }
  private rustType(v: any, p: string, out: string[]): string {
    if (v === null) return 'Option<serde_json::Value>';
    if (typeof v === 'string') return 'String';
    if (typeof v === 'number') return Number.isInteger(v) ? 'i64' : 'f64';
    if (typeof v === 'boolean') return 'bool';
    if (Array.isArray(v)) {
      if (!v.length) return 'Vec<serde_json::Value>';
      if (typeof v[0] === 'object' && v[0]) { const n = p + 'Item'; this.rustStruct(v[0], n, out); return `Vec<${n}>`; }
      return `Vec<${this.rustType(v[0], p, out)}>`;
    }
    if (typeof v === 'object') { this.rustStruct(v, p, out); return p; }
    return 'serde_json::Value';
  }

  /* ── JavaScript ── */
  private generateJavaScript(obj: any, name: string): string {
    const classes: string[] = [];
    this.jsClass(obj, name, classes);
    return classes.join('\n').trim();
  }
  private jsClass(obj: any, name: string, out: string[]): void {
    const entries = Object.entries(obj);
    let c = `class ${name} {\n  constructor({\n`;
    for (const [k] of entries) c += `    ${this.camel(k)} = null,\n`;
    c += `  } = {}) {\n`;
    for (const [k, v] of entries) {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) this.jsClass(v, this.pascal(k), out);
      c += `    this.${this.camel(k)} = ${this.camel(k)};\n`;
    }
    c += `  }\n}\n`;
    out.unshift(c);
  }

  /* ── C++ ── */
  private generateCpp(obj: any, name: string): string {
    const classes: string[] = [];
    this.cppClass(obj, name, classes);
    return ('#include <string>\n#include <vector>\n#include <optional>\n\n' + classes.join('\n')).trim();
  }
  private cppClass(obj: any, name: string, out: string[]): void {
    let c = `class ${name} {\npublic:\n`;
    for (const [k, v] of Object.entries(obj)) c += `    ${this.cppType(v, this.pascal(k), out)} ${this.camel(k)};\n`;
    c += `\n    ${name}() = default;\n};\n`;
    out.unshift(c);
  }
  private cppType(v: any, p: string, out: string[]): string {
    if (v === null) return 'std::optional<std::string>';
    if (typeof v === 'string') return 'std::string';
    if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'double';
    if (typeof v === 'boolean') return 'bool';
    if (Array.isArray(v)) {
      if (!v.length) return 'std::vector<std::string>';
      if (typeof v[0] === 'object' && v[0]) { const n = p + 'Item'; this.cppClass(v[0], n, out); return `std::vector<${n}>`; }
      return `std::vector<${this.cppType(v[0], p, out)}>`;
    }
    if (typeof v === 'object') { this.cppClass(v, p, out); return p; }
    return 'std::string';
  }

  /* ── Ruby ── */
  private generateRuby(obj: any, name: string): string {
    const classes: string[] = [];
    this.rubyClass(obj, name, classes);
    return classes.join('\n').trim();
  }
  private rubyClass(obj: any, name: string, out: string[]): void {
    const entries = Object.entries(obj);
    let c = `class ${name}\n  attr_accessor ${entries.map(([k]) => `:${this.snake(k)}`).join(', ')}\n\n`;
    c += `  def initialize(\n${entries.map(([k]) => `    ${this.snake(k)}: nil`).join(',\n')}\n  )\n`;
    for (const [k, v] of entries) {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) this.rubyClass(v, this.pascal(k), out);
      c += `    @${this.snake(k)} = ${this.snake(k)}\n`;
    }
    c += `  end\nend\n`;
    out.unshift(c);
  }

  /* ── Scala ── */
  private generateScala(obj: any, name: string): string {
    const classes: string[] = [];
    this.scalaClass(obj, name, classes);
    return classes.join('\n').trim();
  }
  private scalaClass(obj: any, name: string, out: string[]): void {
    const props = Object.entries(obj).map(([k, v]) => {
      const t = this.scalaType(v, this.pascal(k), out);
      return `  ${this.camel(k)}: ${t}${v === null ? ' = None' : ''}`;
    });
    out.unshift(`case class ${name}(\n${props.join(',\n')}\n)\n`);
  }
  private scalaType(v: any, p: string, out: string[]): string {
    if (v === null) return 'Option[Any]';
    if (typeof v === 'string') return 'String';
    if (typeof v === 'number') return Number.isInteger(v) ? 'Int' : 'Double';
    if (typeof v === 'boolean') return 'Boolean';
    if (Array.isArray(v)) {
      if (!v.length) return 'List[Any]';
      if (typeof v[0] === 'object' && v[0]) { const n = p + 'Item'; this.scalaClass(v[0], n, out); return `List[${n}]`; }
      return `List[${this.scalaType(v[0], p, out)}]`;
    }
    if (typeof v === 'object') { this.scalaClass(v, p, out); return p; }
    return 'Any';
  }

  /* ── Objective-C ── */
  private generateObjC(obj: any, name: string): string {
    const classes: string[] = [];
    this.objcClass(obj, name, classes);
    return classes.join('\n').trim();
  }
  private objcClass(obj: any, name: string, out: string[]): void {
    let h = `@interface ${name} : NSObject\n\n`;
    for (const [k, v] of Object.entries(obj)) {
      const t = this.objcType(v, this.pascal(k), out);
      const attrs = typeof v === 'string' || (typeof v === 'object' && v !== null) ? 'nonatomic, strong' : 'nonatomic, assign';
      h += `@property (${attrs}) ${t} ${this.camel(k)};\n`;
    }
    h += `\n@end\n\n@implementation ${name}\n@end\n`;
    out.unshift(h);
  }
  private objcType(v: any, p: string, out: string[]): string {
    if (v === null) return 'id';
    if (typeof v === 'string') return 'NSString *';
    if (typeof v === 'number') return Number.isInteger(v) ? 'NSInteger' : 'CGFloat';
    if (typeof v === 'boolean') return 'BOOL';
    if (Array.isArray(v)) {
      if (!v.length) return 'NSArray *';
      if (typeof v[0] === 'object' && v[0]) { const n = p + 'Item'; this.objcClass(v[0], n, out); return `NSArray<${n} *> *`; }
      return 'NSArray *';
    }
    if (typeof v === 'object') { this.objcClass(v, p, out); return `${p} *`; }
    return 'id';
  }

  /* ── Utilities ── */
  private pascal(s: string): string {
    return s.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '').replace(/^(.)/, c => c.toUpperCase());
  }
  private camel(s: string): string { const p = this.pascal(s); return p[0].toLowerCase() + p.slice(1); }
  private snake(s: string): string {
    return s.replace(/([A-Z])/g, '_$1').replace(/[-\s]+/g, '_').replace(/^_/, '').toLowerCase();
  }
}
