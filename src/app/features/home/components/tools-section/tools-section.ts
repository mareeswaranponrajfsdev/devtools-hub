import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tools-section',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './tools-section.html',
  styleUrl: './tools-section.scss',
})
export class ToolsSection {

  tools = [
    {
      title: 'JSON to Code Generator',
      description: 'Convert JSON to C#, TypeScript, or Java classes instantly',
      icon: 'fa-code',
      route: '/json-to-code',
      color: '#3b82f6'
    },
    {
      title: 'JSON Diff & Compare',
      description: 'Compare two JSON files side-by-side and highlight differences',
      icon: 'fa-code-compare',
      route: '/json-diff',
      color: '#8b5cf6'
    },
    {
      title: 'JSON Schema Validator',
      description: 'Validate JSON against schemas and auto-generate schemas',
      icon: 'fa-shield-check',
      route: '/json-schema-validator',
      color: '#10b981'
    }
  ];

}
