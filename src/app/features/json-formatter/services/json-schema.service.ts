import { Injectable } from '@angular/core';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  summary: string;
}

export interface ValidationError {
  path: string;
  message: string;
  expectedType?: string;
  actualType?: string;
}

export interface SchemaProperty {
  path: string;
  type: string;
  required: boolean;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JsonSchemaService {

  /**
   * Validate JSON against a schema
   */
  validate(jsonString: string, schemaString: string): ValidationResult {
    try {
      const json = JSON.parse(jsonString);
      const schema = JSON.parse(schemaString);
      
      const result: ValidationResult = {
        valid: true,
        errors: [],
        summary: ''
      };
      
      this.validateObject(json, schema, '', result);
      
      result.valid = result.errors.length === 0;
      result.summary = result.valid 
        ? '✅ JSON is valid according to schema'
        : `❌ Found ${result.errors.length} validation error(s)`;
      
      return result;
    } catch (error) {
      return {
        valid: false,
        errors: [{
          path: 'root',
          message: 'Invalid JSON or Schema: ' + (error as Error).message
        }],
        summary: '❌ Invalid JSON or Schema'
      };
    }
  }

  /**
   * Recursively validate object against schema
   */
  private validateObject(obj: any, schema: any, path: string, result: ValidationResult): void {
    // Check type
    if (schema.type) {
      const actualType = this.getType(obj);
      const expectedType = schema.type;
      
      if (actualType !== expectedType) {
        result.errors.push({
          path: path || 'root',
          message: `Type mismatch`,
          expectedType,
          actualType
        });
        return;
      }
    }
    
    // Check required properties
    if (schema.required && Array.isArray(schema.required)) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in obj)) {
          result.errors.push({
            path: `${path}.${requiredProp}`,
            message: `Required property is missing`
          });
        }
      }
    }
    
    // Check properties
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          const currentPath = path ? `${path}.${key}` : key;
          this.validateObject(obj[key], propSchema, currentPath, result);
        }
      }
    }
    
    // Check array items
    if (schema.type === 'array' && schema.items && Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const currentPath = `${path}[${index}]`;
        this.validateObject(item, schema.items, currentPath, result);
      });
    }
  }

  /**
   * Get JSON type
   */
  private getType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  /**
   * Generate schema from JSON (infer schema)
   */
  generateSchema(jsonString: string): string {
    try {
      const json = JSON.parse(jsonString);
      const schema = this.inferSchema(json);
      return JSON.stringify(schema, null, 2);
    } catch (error) {
      throw new Error('Invalid JSON: ' + (error as Error).message);
    }
  }

  /**
   * Infer schema from JSON object
   */
  private inferSchema(obj: any): any {
    const type = this.getType(obj);
    
    if (type === 'object') {
      const properties: any = {};
      const required: string[] = [];
      
      for (const [key, value] of Object.entries(obj)) {
        properties[key] = this.inferSchema(value);
        required.push(key);
      }
      
      return {
        type: 'object',
        properties,
        required
      };
    } else if (type === 'array') {
      if (obj.length > 0) {
        return {
          type: 'array',
          items: this.inferSchema(obj[0])
        };
      } else {
        return {
          type: 'array',
          items: {}
        };
      }
    } else {
      return { type };
    }
  }

  /**
   * Get autocomplete suggestions for schema
   */
  getAutocompleteSuggestions(schema: any, currentPath: string = ''): SchemaProperty[] {
    const suggestions: SchemaProperty[] = [];
    
    if (!schema || !schema.properties) {
      return suggestions;
    }
    
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const path = currentPath ? `${currentPath}.${key}` : key;
      const prop: any = propSchema;
      
      suggestions.push({
        path,
        type: prop.type || 'any',
        required: schema.required?.includes(key) || false,
        description: prop.description
      });
      
      // Recursively get nested properties
      if (prop.type === 'object' && prop.properties) {
        suggestions.push(...this.getAutocompleteSuggestions(prop, path));
      }
    }
    
    return suggestions;
  }

  /**
   * Get Monaco editor completion items
   */
  getMonacoCompletionItems(schema: any): any[] {
    const suggestions = this.getAutocompleteSuggestions(schema);
    
    return suggestions.map(sug => ({
      label: sug.path,
      kind: 10, // Property
      documentation: `${sug.type}${sug.required ? ' (required)' : ''}${sug.description ? ': ' + sug.description : ''}`,
      insertText: sug.path.split('.').pop()
    }));
  }
}
