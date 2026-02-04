import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class JsonFormatterService {

  format(json: string): string {
    const parsed = JSON.parse(json);

    return JSON.stringify(parsed, null, 2);
  }

  minify(json: string): string {
    const parsed = JSON.parse(json);

    return JSON.stringify(parsed);
  }

  validate(json: string): boolean {
    JSON.parse(json);

    return true;
  }
}
