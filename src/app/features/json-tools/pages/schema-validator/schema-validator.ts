import { Component, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ValidationError {
  path: string;
  message: string;
  value?: any;
}

@Component({
  selector: 'app-schema-validator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schema-validator.html',
  styleUrl: './schema-validator.scss'
})
export class SchemaValidatorPage {
  
  jsonInput: WritableSignal<string> = signal('');
  schemaInput: WritableSignal<string> = signal('');
  validationResult: WritableSignal<'valid' | 'invalid' | null> = signal(null);
  errors: WritableSignal<ValidationError[]> = signal([]);
  errorMessage: WritableSignal<string> = signal('');
  
  validate(): void {
    this.errorMessage.set('');
    this.errors.set([]);
    this.validationResult.set(null);
    
    if (!this.jsonInput().trim()) {
      this.errorMessage.set('Please enter JSON data');
      return;
    }
    
    if (!this.schemaInput().trim()) {
      this.errorMessage.set('Please enter JSON Schema');
      return;
    }
    
    try {
      const json = JSON.parse(this.jsonInput());
      const schema = JSON.parse(this.schemaInput());
      
      const validationErrors = this.validateAgainstSchema(json, schema, '');
      
      if (validationErrors.length === 0) {
        this.validationResult.set('valid');
      } else {
        this.validationResult.set('invalid');
        this.errors.set(validationErrors);
      }
      
    } catch (err) {
      this.errorMessage.set('Invalid JSON or Schema: ' + (err as Error).message);
    }
  }
  
  private validateAgainstSchema(data: any, schema: any, path: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Type validation
    if (schema.type) {
      const actualType = Array.isArray(data) ? 'array' : typeof data;
      const expectedType = schema.type;
      
      if (actualType !== expectedType && !(actualType === 'object' && expectedType === 'object')) {
        errors.push({
          path: path || 'root',
          message: `Expected type "${expectedType}" but got "${actualType}"`,
          value: data
        });
        return errors;
      }
    }
    
    // Required fields
    if (schema.required && typeof data === 'object' && !Array.isArray(data)) {
      schema.required.forEach((field: string) => {
        if (!(field in data)) {
          errors.push({
            path: path ? `${path}.${field}` : field,
            message: `Required field "${field}" is missing`
          });
        }
      });
    }
    
    // Properties validation
    if (schema.properties && typeof data === 'object' && !Array.isArray(data)) {
      Object.keys(schema.properties).forEach(key => {
        if (key in data) {
          const newPath = path ? `${path}.${key}` : key;
          const propErrors = this.validateAgainstSchema(
            data[key],
            schema.properties[key],
            newPath
          );
          errors.push(...propErrors);
        }
      });
    }
    
    // String validations
    if (schema.type === 'string' && typeof data === 'string') {
      if (schema.minLength && data.length < schema.minLength) {
        errors.push({
          path: path || 'root',
          message: `String length ${data.length} is less than minimum ${schema.minLength}`,
          value: data
        });
      }
      
      if (schema.maxLength && data.length > schema.maxLength) {
        errors.push({
          path: path || 'root',
          message: `String length ${data.length} exceeds maximum ${schema.maxLength}`,
          value: data
        });
      }
      
      if (schema.pattern) {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(data)) {
          errors.push({
            path: path || 'root',
            message: `String does not match pattern "${schema.pattern}"`,
            value: data
          });
        }
      }
    }
    
    // Number validations
    if (schema.type === 'number' && typeof data === 'number') {
      if (schema.minimum !== undefined && data < schema.minimum) {
        errors.push({
          path: path || 'root',
          message: `Value ${data} is less than minimum ${schema.minimum}`,
          value: data
        });
      }
      
      if (schema.maximum !== undefined && data > schema.maximum) {
        errors.push({
          path: path || 'root',
          message: `Value ${data} exceeds maximum ${schema.maximum}`,
          value: data
        });
      }
    }
    
    // Array validations
    if (schema.type === 'array' && Array.isArray(data)) {
      if (schema.minItems && data.length < schema.minItems) {
        errors.push({
          path: path || 'root',
          message: `Array length ${data.length} is less than minimum ${schema.minItems}`,
          value: data
        });
      }
      
      if (schema.maxItems && data.length > schema.maxItems) {
        errors.push({
          path: path || 'root',
          message: `Array length ${data.length} exceeds maximum ${schema.maxItems}`,
          value: data
        });
      }
      
      if (schema.items) {
        data.forEach((item, index) => {
          const newPath = `${path}[${index}]`;
          const itemErrors = this.validateAgainstSchema(item, schema.items, newPath);
          errors.push(...itemErrors);
        });
      }
    }
    
    return errors;
  }
  
  generateSchema(): void {
    this.errorMessage.set('');
    
    if (!this.jsonInput().trim()) {
      this.errorMessage.set('Please enter JSON data to generate schema');
      return;
    }
    
    try {
      const json = JSON.parse(this.jsonInput());
      const schema = this.inferSchema(json);
      this.schemaInput.set(JSON.stringify(schema, null, 2));
    } catch (err) {
      this.errorMessage.set('Invalid JSON: ' + (err as Error).message);
    }
  }
  
  private inferSchema(data: any): any {
    if (data === null) {
      return { type: 'null' };
    }
    
    if (Array.isArray(data)) {
      return {
        type: 'array',
        items: data.length > 0 ? this.inferSchema(data[0]) : {}
      };
    }
    
    if (typeof data === 'object') {
      const properties: any = {};
      const required: string[] = [];
      
      Object.keys(data).forEach(key => {
        properties[key] = this.inferSchema(data[key]);
        required.push(key);
      });
      
      return {
        type: 'object',
        properties,
        required
      };
    }
    
    return { type: typeof data };
  }
  
  loadSample(): void {
    const sampleJson = {
      "name": "John Doe",
      "age": 30,
      "email": "john@example.com",
      "isActive": true
    };
    
    const sampleSchema = {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1
        },
        "age": {
          "type": "number",
          "minimum": 0,
          "maximum": 150
        },
        "email": {
          "type": "string",
          "pattern": "^[^@]+@[^@]+\\.[^@]+$"
        },
        "isActive": {
          "type": "boolean"
        }
      },
      "required": ["name", "email"]
    };
    
    this.jsonInput.set(JSON.stringify(sampleJson, null, 2));
    this.schemaInput.set(JSON.stringify(sampleSchema, null, 2));
  }
  
  clear(): void {
    this.jsonInput.set('');
    this.schemaInput.set('');
    this.validationResult.set(null);
    this.errors.set([]);
    this.errorMessage.set('');
  }
}
