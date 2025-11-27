import { describe, it, expect } from 'vitest';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

describe('slugify', () => {
  it('normalizza nomi in slug url-safe', () => {
    expect(slugify('Support Bot')).toBe('support-bot');
    expect(slugify('Bob')).toBe('bob');
    expect(slugify('Bot 123!')).toBe('bot-123');
  });
});
