export type IndentationType = '2spaces' | '4spaces' | 'tab';
export type ArrayFormatting = 'inline' | 'multiline';

export interface FormatterOptions {
  indentation: IndentationType;
  sortKeys: boolean;
  removeTrailingCommas: boolean;
  compactArrays: ArrayFormatting;
}

export const DEFAULT_FORMATTER_OPTIONS: FormatterOptions = {
  indentation: '2spaces',
  sortKeys: false,
  removeTrailingCommas: true,
  compactArrays: 'multiline'
};
