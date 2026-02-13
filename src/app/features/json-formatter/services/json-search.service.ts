import { Injectable } from '@angular/core';

export interface SearchMatch {
  line: number;
  column: number;
  length: number;
  text: string;
}

export interface SearchResult {
  matches: SearchMatch[];
  currentIndex: number;
  totalMatches: number;
}

@Injectable({
  providedIn: 'root'
})
export class JsonSearchService {
  search(content: string, query: string, caseSensitive = false): SearchResult {
    if (!query || !content) {
      return { matches: [], currentIndex: -1, totalMatches: 0 };
    }
    const matches: SearchMatch[] = [];
    const lines = content.split('\n');
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    lines.forEach((line, lineIndex) => {
      const searchLine = caseSensitive ? line : line.toLowerCase();
      let columnIndex = 0;
      while (true) {
        const foundIndex = searchLine.indexOf(searchQuery, columnIndex);
        if (foundIndex === -1) break;
        matches.push({
          line: lineIndex + 1,
          column: foundIndex + 1,
          length: query.length,
          text: line.substring(foundIndex, foundIndex + query.length)
        });
        columnIndex = foundIndex + query.length;
      }
    });
    return {
      matches,
      currentIndex: matches.length > 0 ? 0 : -1,
      totalMatches: matches.length
    };
  }
}
