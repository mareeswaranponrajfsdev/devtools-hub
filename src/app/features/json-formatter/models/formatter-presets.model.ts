import { FormatterOptions } from './formatter-options.model';

export type FormatterPreset = 'default' | 'compact' | 'pretty' | 'custom';

export interface PresetConfig {
  name: FormatterPreset;
  label: string;
  options: FormatterOptions;
}

export const FORMATTER_PRESETS: Record<FormatterPreset, PresetConfig> = {
  default: {
    name: 'default',
    label: 'Default',
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
    options: {
      indentation: '2spaces',
      sortKeys: false,
      removeTrailingCommas: true,
      compactArrays: 'inline'
    }
  },
  pretty: {
    name: 'pretty',
    label: 'Pretty Print',
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
    options: {
      indentation: '2spaces',
      sortKeys: false,
      removeTrailingCommas: true,
      compactArrays: 'multiline'
    }
  }
};
