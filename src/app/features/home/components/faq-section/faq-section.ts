import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq-section',
  imports: [CommonModule],
  templateUrl: './faq-section.html',
  styleUrl: './faq-section.scss',
})
export class FaqSection {
  
  activeIndex: number | null = null;

  faqs: FaqItem[] = [

    {
      question: 'What is a JSON Formatter?',
      answer: `
  A JSON Formatter is a tool that takes raw, unformatted JSON data and converts it into a well-structured,
  readable format with proper indentation and line breaks. This makes it easier to read, debug, and
  understand complex JSON structures commonly used in APIs and configuration files.
      `
    },

    {
      question: 'Is this JSON formatter free to use?',
      answer: `
  Yes, Dev JSON Tools JSON Formatter is completely free with no usage limits. You don't need to create an
  account or sign up. The tool is supported by non-intrusive ads to keep it free for all developers.
      `
    },

    {
      question: 'Is my data secure when using this tool?',
      answer: `
  Absolutely. All JSON processing happens entirely in your browser using JavaScript. Your data never
  leaves your computer or gets sent to any server. This ensures complete privacy and security for
  sensitive data like API keys, tokens, tokens, or proprietary configurations.
      `
    },

    {
      question: "What's the difference between Format and Minify?",
      answer: `
  Format (or Beautify) adds indentation and line breaks to make JSON readable. Minify does the opposite —
  it removes all unnecessary whitespace to create the smallest possible file size, which is useful for
  production deployments and API responses.
      `
    },

    {
      question: 'Can I validate JSON without formatting it?',
      answer: `
  Yes, use the Validate button to check if your JSON is syntactically correct without modifying it.
  The tool will show you exactly where any errors occur, including the line and column number.
      `
    },

    {
      question: 'Does this tool work offline?',
      answer: `
  Once the page is loaded, the JSON formatter works without an internet connection since all processing
  is done locally in your browser. However, you'll need to be online initially to load the page.
      `
    },

    {
      question: 'What file formats can I upload?',
      answer: `
  You can drag and drop .json or .txt files directly into the input area. The tool will automatically
  read the file contents and display them in the editor for formatting or validation.
      `
    },

    {
      question: 'How do I save my formatted JSON?',
      answer: `
  You have several options: Click 'Copy' to copy to clipboard, 'Download .json' to save as a JSON file,
  'Download .txt' for a text file, or 'Save' to store it in your browser's local storage for later access.
      `
    }

  ];



  toggle(index: number): void {
    this.activeIndex =
      this.activeIndex === index ? null : index;
  }
}
