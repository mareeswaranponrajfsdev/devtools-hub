import { Injectable } from '@angular/core';

export interface CodeGenOptions {
  language: 'csharp' | 'typescript' | 'java';
  className?: string;
  namespace?: string;
  useNullable?: boolean;
  useCamelCase?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class JsonToCodeService {

  /**
   * Generate code from JSON
   */
  generateCode(jsonString: string, options: CodeGenOptions): string {
    try {
      const json = JSON.parse(jsonString);
      
      switch (options.language) {
        case 'csharp':
          return this.generateCSharp(json, options);
        case 'typescript':
          return this.generateTypeScript(json, options);
        case 'java':
          return this.generateJava(json, options);
        default:
          return '';
      }
    } catch (error) {
      throw new Error('Invalid JSON: ' + (error as Error).message);
    }
  }

  /**
   * Generate C# code
   */
  private generateCSharp(obj: any, options: CodeGenOptions): string {
    const className = options.className || 'RootObject';
    const namespace = options.namespace || 'Generated';
    const useNullable = options.useNullable ?? true;
    
    let code = `using System;\nusing System.Collections.Generic;\n\n`;
    code += `namespace ${namespace}\n{\n`;
    code += this.generateCSharpClass(obj, className, 1, useNullable);
    code += `}\n`;
    
    return code;
  }

  private generateCSharpClass(obj: any, className: string, indent: number, useNullable: boolean): string {
    const indentStr = '    '.repeat(indent);
    let code = `${indentStr}public class ${className}\n${indentStr}{\n`;
    
    for (const [key, value] of Object.entries(obj)) {
      const propName = this.toPascalCase(key);
      const type = this.getCSharpType(value, propName, indent + 1, useNullable);
      const nullMark = useNullable && type !== 'string' && !type.includes('List') ? '?' : '';
      code += `${indentStr}    public ${type}${nullMark} ${propName} { get; set; }\n`;
    }
    
    code += `${indentStr}}\n\n`;
    return code;
  }

  private getCSharpType(value: any, propName: string, indent: number, useNullable: boolean): string {
    if (value === null) return 'object';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'double';
    if (typeof value === 'boolean') return 'bool';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'List<object>';
      const itemType = this.getCSharpType(value[0], propName, indent, useNullable);
      return `List<${itemType}>`;
    }
    if (typeof value === 'object') {
      // Nested object - generate nested class
      return propName + 'Class';
    }
    return 'object';
  }

  /**
   * Generate TypeScript code
   */
  private generateTypeScript(obj: any, options: CodeGenOptions): string {
    const interfaceName = options.className || 'RootObject';
    let code = this.generateTypeScriptInterface(obj, interfaceName, 0, options);
    return code;
  }

  private generateTypeScriptInterface(obj: any, interfaceName: string, indent: number, options: CodeGenOptions): string {
    const indentStr = '  '.repeat(indent);
    let code = `${indentStr}export interface ${interfaceName} {\n`;
    
    for (const [key, value] of Object.entries(obj)) {
      const propName = options.useCamelCase ? this.toCamelCase(key) : key;
      const type = this.getTypeScriptType(value, this.toPascalCase(key));
      code += `${indentStr}  ${propName}: ${type};\n`;
    }
    
    code += `${indentStr}}\n\n`;
    return code;
  }

  private getTypeScriptType(value: any, propName: string): string {
    if (value === null) return 'any';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'any[]';
      const itemType = this.getTypeScriptType(value[0], propName);
      return `${itemType}[]`;
    }
    if (typeof value === 'object') {
      return propName;
    }
    return 'any';
  }

  /**
   * Generate Java code
   */
  private generateJava(obj: any, options: CodeGenOptions): string {
    const className = options.className || 'RootObject';
    const packageName = options.namespace || 'com.generated';
    
    let code = `package ${packageName};\n\n`;
    code += `import java.util.List;\n\n`;
    code += this.generateJavaClass(obj, className, 0);
    
    return code;
  }

  private generateJavaClass(obj: any, className: string, indent: number): string {
    const indentStr = '    '.repeat(indent);
    let code = `${indentStr}public class ${className} {\n\n`;
    
    // Fields
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = this.toCamelCase(key);
      const type = this.getJavaType(value, this.toPascalCase(key));
      code += `${indentStr}    private ${type} ${fieldName};\n`;
    }
    
    code += `\n`;
    
    // Getters and Setters
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = this.toCamelCase(key);
      const methodName = this.toPascalCase(key);
      const type = this.getJavaType(value, this.toPascalCase(key));
      
      code += `${indentStr}    public ${type} get${methodName}() {\n`;
      code += `${indentStr}        return ${fieldName};\n`;
      code += `${indentStr}    }\n\n`;
      
      code += `${indentStr}    public void set${methodName}(${type} ${fieldName}) {\n`;
      code += `${indentStr}        this.${fieldName} = ${fieldName};\n`;
      code += `${indentStr}    }\n\n`;
    }
    
    code += `${indentStr}}\n`;
    return code;
  }

  private getJavaType(value: any, propName: string): string {
    if (value === null) return 'Object';
    if (typeof value === 'string') return 'String';
    if (typeof value === 'number') return Number.isInteger(value) ? 'Integer' : 'Double';
    if (typeof value === 'boolean') return 'Boolean';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'List<Object>';
      const itemType = this.getJavaType(value[0], propName);
      return `List<${itemType}>`;
    }
    if (typeof value === 'object') {
      return propName;
    }
    return 'Object';
  }

  /**
   * Utility: Convert to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
      .replace(/^(.)/, (c) => c.toUpperCase());
  }

  /**
   * Utility: Convert to camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
      .replace(/^(.)/, (c) => c.toLowerCase());
  }
}