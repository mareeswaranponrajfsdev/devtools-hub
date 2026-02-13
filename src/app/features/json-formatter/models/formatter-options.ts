export type IndentationType = '2' | '4' | 'tab';

export interface FormatterOptions {
  indentation: IndentationType;
  sortKeys: boolean;
  removeTrailingCommas: boolean;
  compactArrays: boolean;
}

export const DEFAULT_FORMATTER_OPTIONS: FormatterOptions = {
  indentation: '2',
  sortKeys: false,
  removeTrailingCommas: true,
  compactArrays: false
};
