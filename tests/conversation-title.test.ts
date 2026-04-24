import { describe, expect, it } from 'vitest';
import { buildAutoTitleFromFirstMessage } from '@/services/conversation.service';

describe('conversation auto title', () => {
  it('cuts chinese title by 20 chars', () => {
    const title = buildAutoTitleFromFirstMessage('这是一个用于测试自动命名的中文标题它应该被截断并加省略号');
    expect(title.endsWith('...')).toBe(true);
  });

  it('cuts mixed title by 40 chars', () => {
    const title = buildAutoTitleFromFirstMessage('this is a very long english title that should be truncated for ui readability');
    expect(title.length).toBeLessThanOrEqual(43);
  });
});
