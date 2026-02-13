import { Injectable, Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  
  private readonly defaultConfig: SEOConfig = {
    title: 'JSON Formatter & Validator - Free Online JSON Tools',
    description: 'Free online JSON formatter, validator, minifier, and beautifier. Format, validate, and fix JSON instantly. Convert JSON to C#, TypeScript, Java. Compare JSON files.',
    keywords: 'json formatter, json validator, json beautifier, json minifier, json to code, json diff, json schema',
    image: '/assets/og-image.png',
    type: 'website',
    author: 'JSON Tools'
  };

  constructor(
    private meta: Meta,
    private title: Title,
    private router: Router,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.initRouteListener();
  }

  /**
   * Initialize route change listener for automatic SEO updates
   */
  private initRouteListener(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateSEOForCurrentRoute();
    });
  }

  /**
   * Update SEO based on current route
   */
  private updateSEOForCurrentRoute(): void {
    const url = this.router.url;
    const config = this.getConfigForRoute(url);
    this.updateTags(config);
  }

  /**
   * Get SEO config for specific route
   */
  private getConfigForRoute(url: string): SEOConfig {
    const routeConfigs: { [key: string]: SEOConfig } = {
      '/': this.defaultConfig,
      '/formatter': {
        title: 'JSON Formatter & Beautifier - Format JSON Online Free',
        description: 'Free online JSON formatter and beautifier. Instantly format, validate, and beautify your JSON data. Fix syntax errors automatically.',
        keywords: 'json formatter, json beautifier, format json, beautify json online'
      },
      '/json-to-csharp': {
        title: 'JSON to C# Converter - Generate C# Classes from JSON',
        description: 'Convert JSON to C# classes instantly. Free online tool to generate C# POCO classes, properties, and data models from JSON.',
        keywords: 'json to c#, json to csharp, generate c# from json, json converter'
      },
      '/json-to-typescript': {
        title: 'JSON to TypeScript Converter - Generate TS Interfaces',
        description: 'Convert JSON to TypeScript interfaces automatically. Free tool to generate TypeScript types and interfaces from JSON data.',
        keywords: 'json to typescript, json to ts, generate typescript, json converter'
      },
      '/json-to-java': {
        title: 'JSON to Java Converter - Generate Java Classes',
        description: 'Convert JSON to Java classes instantly. Generate Java POJOs, getters, setters from JSON data online.',
        keywords: 'json to java, generate java classes, json converter, java pojo'
      },
      '/json-diff': {
        title: 'JSON Diff Tool - Compare JSON Files Online',
        description: 'Compare two JSON files and see differences highlighted. Free online JSON comparison tool with visual diff viewer.',
        keywords: 'json diff, json compare, compare json, json difference'
      },
      '/json-schema-validator': {
        title: 'JSON Schema Validator - Validate JSON Against Schema',
        description: 'Validate JSON against JSON Schema. Free online validator with detailed error messages and schema generation.',
        keywords: 'json schema, json validator, schema validation, validate json'
      },
      '/fix-invalid-json': {
        title: 'Fix Invalid JSON - Auto-Fix JSON Syntax Errors',
        description: 'Automatically fix common JSON syntax errors. Repair broken JSON, fix missing quotes, commas, and brackets.',
        keywords: 'fix json, repair json, json syntax error, invalid json'
      },
      '/contact': {
        title: 'Contact Us - JSON Tools',
        description: 'Get in touch with us. Report bugs, suggest features, or ask questions about our JSON tools.',
        keywords: 'contact, support, feedback'
      }
    };

    return { ...this.defaultConfig, ...(routeConfigs[url] || {}) };
  }

  /**
   * Update all meta tags
   */
  updateTags(config: Partial<SEOConfig>): void {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Basic meta tags
    this.title.setTitle(finalConfig.title);
    this.meta.updateTag({ name: 'description', content: finalConfig.description });
    
    if (finalConfig.keywords) {
      this.meta.updateTag({ name: 'keywords', content: finalConfig.keywords });
    }
    
    if (finalConfig.author) {
      this.meta.updateTag({ name: 'author', content: finalConfig.author });
    }

    // Robots
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: finalConfig.title });
    this.meta.updateTag({ property: 'og:description', content: finalConfig.description });
    this.meta.updateTag({ property: 'og:type', content: finalConfig.type || 'website' });
    this.meta.updateTag({ property: 'og:url', content: finalConfig.url || this.document.location.href });
    
    if (finalConfig.image) {
      this.meta.updateTag({ property: 'og:image', content: finalConfig.image });
      this.meta.updateTag({ property: 'og:image:width', content: '1200' });
      this.meta.updateTag({ property: 'og:image:height', content: '630' });
    }

    // Twitter Cards
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: finalConfig.title });
    this.meta.updateTag({ name: 'twitter:description', content: finalConfig.description });
    
    if (finalConfig.image) {
      this.meta.updateTag({ name: 'twitter:image', content: finalConfig.image });
    }

    // Article specific
    if (finalConfig.publishedTime) {
      this.meta.updateTag({ property: 'article:published_time', content: finalConfig.publishedTime });
    }
    
    if (finalConfig.modifiedTime) {
      this.meta.updateTag({ property: 'article:modified_time', content: finalConfig.modifiedTime });
    }

    // Canonical URL
    this.updateCanonicalUrl(finalConfig.url);
    
    // JSON-LD Structured Data
    this.updateStructuredData(finalConfig);
  }

  /**
   * Update canonical URL
   */
  private updateCanonicalUrl(url?: string): void {
    const canonical = url || this.document.location.href;
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    
    link.setAttribute('href', canonical);
  }

  /**
   * Add JSON-LD structured data
   */
  private updateStructuredData(config: SEOConfig): void {
    // Remove existing structured data
    const existingScripts = this.document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // WebApplication schema
    const webAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'JSON Formatter & Tools',
      'url': this.document.location.origin,
      'description': config.description,
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'Any',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'ratingCount': '1250'
      }
    };

    this.addStructuredDataScript(webAppSchema);

    // Add route-specific schemas
    const url = this.router.url;
    if (url.includes('formatter') || url === '/') {
      this.addHowToSchema();
    }
    
    this.addFAQSchema();
    this.addOrganizationSchema();
  }

  /**
   * Add HowTo schema
   */
  private addHowToSchema(): void {
    const howToSchema = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      'name': 'How to Format JSON Online',
      'description': 'Learn how to format and validate JSON using our free online tool',
      'step': [
        {
          '@type': 'HowToStep',
          'name': 'Paste JSON',
          'text': 'Copy your JSON data and paste it into the input editor'
        },
        {
          '@type': 'HowToStep',
          'name': 'Click Format',
          'text': 'Click the Format button to beautify your JSON'
        },
        {
          '@type': 'HowToStep',
          'name': 'Copy Result',
          'text': 'Copy the formatted JSON from the output editor'
        }
      ]
    };

    this.addStructuredDataScript(howToSchema);
  }

  /**
   * Add FAQ schema
   */
  private addFAQSchema(): void {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'What is JSON?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'JSON (JavaScript Object Notation) is a lightweight data interchange format that is easy for humans to read and write, and easy for machines to parse and generate.'
          }
        },
        {
          '@type': 'Question',
          'name': 'How do I format JSON online?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Paste your JSON into our formatter, click the Format button, and get beautifully formatted JSON instantly. Our tool also validates and highlights any syntax errors.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Is this JSON formatter free?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes, our JSON formatter is completely free to use with no registration required. You can format unlimited JSON files.'
          }
        }
      ]
    };

    this.addStructuredDataScript(faqSchema);
  }

  /**
   * Add Organization schema
   */
  private addOrganizationSchema(): void {
    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'JSON Tools',
      'url': this.document.location.origin,
      'logo': this.document.location.origin + '/assets/logo.png',
      'sameAs': []
    };

    this.addStructuredDataScript(orgSchema);
  }

  /**
   * Add structured data script to document
   */
  private addStructuredDataScript(schema: any): void {
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }

  /**
   * Generate sitemap (call this from a service or component)
   */
  generateSitemap(): string {
    const baseUrl = this.document.location.origin;
    const routes = [
      '/',
      '/formatter',
      '/json-to-csharp',
      '/json-to-typescript',
      '/json-to-java',
      '/json-diff',
      '/json-schema-validator',
      '/fix-invalid-json',
      '/contact',
      '/privacy',
      '/terms'
    ];

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    routes.forEach(route => {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${baseUrl}${route}</loc>\n`;
      sitemap += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
      sitemap += '    <changefreq>weekly</changefreq>\n';
      sitemap += '    <priority>0.8</priority>\n';
      sitemap += '  </url>\n';
    });

    sitemap += '</urlset>';
    return sitemap;
  }
}
