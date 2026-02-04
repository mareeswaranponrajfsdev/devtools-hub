export interface JsonFormatterState {

  readonly input: string;

  readonly output: string;

  readonly error: string | null;

  readonly isValid: boolean;
}
