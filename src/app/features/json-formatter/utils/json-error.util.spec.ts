import { JsonError } from './json-errorutil';

describe('JsonError', () => {
  it('should create an instance', () => {
    expect(new JsonError()).toBeTruthy();
  });
});
