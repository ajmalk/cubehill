import { describe, it, expect } from 'vitest';

describe('smoke test', () => {
  it('should pass a trivial assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify TypeScript works', () => {
    const message: string = 'CubeHill';
    expect(message).toBe('CubeHill');
  });
});
