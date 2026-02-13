import { FormatterOptions } from './formatter-options.model';

export type FormatterPreset = 'default' | 'compact' | 'readable' | 'custom';

export interface PresetConfig {
  name: FormatterPreset;
  label: string;
  description: string;
  options: FormatterOptions;
}

export const FORMATTER_PRESETS: Record<FormatterPreset, PresetConfig> = {
  default: {
    name: 'default',
    label: 'Default',
    description: '2 spaces, no sorting',
    options: {
      indentation: '2spaces',
      sortKeys: false,
      removeTrailingCommas: true,
      compactArrays: 'multiline'
    }
  },
  compact: {
    name: 'compact',
    label: 'Compact',
    description: 'Minimal spacing',
    options: {
      indentation: '2spaces',
      sortKeys: false,
      removeTrailingCommas: true,
      compactArrays: 'inline'
    }
  },
  readable: {
    name: 'readable',
    label: 'Readable',
    description: '4 spaces, sorted keys',
    options: {
      indentation: '4spaces',
      sortKeys: true,
      removeTrailingCommas: true,
      compactArrays: 'multiline'
    }
  },
  custom: {
    name: 'custom',
    label: 'Custom',
    description: 'Your custom settings',
    options: {
      indentation: '2spaces',
      sortKeys: false,
      removeTrailingCommas: true,
      compactArrays: 'multiline'
    }
  }
};
