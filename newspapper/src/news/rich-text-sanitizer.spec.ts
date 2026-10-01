import { sanitizeRichTextBlocks } from './rich-text-sanitizer';

describe('sanitizeRichTextBlocks', () => {
  it('removes markup and control characters from text content', () => {
    expect(
      sanitizeRichTextBlocks([
        {
          type: 'paragraph',
          text: '<script>alert(1)</script>Texto\u0000 seguro',
          items: ['<b>Elemento</b>'],
          alt: '<img>Descripción',
        },
      ]),
    ).toEqual([
      {
        type: 'paragraph',
        text: 'alert(1)Texto seguro',
        items: ['Elemento'],
        alt: 'Descripción',
      },
    ]);
  });

  it('keeps only relative and http(s) URLs', () => {
    expect(
      sanitizeRichTextBlocks([
        { type: 'image', url: 'javascript:alert(1)' },
        { type: 'image', url: 'https://example.com/image.jpg' },
        { type: 'image', url: '/uploads/image.jpg' },
      ]),
    ).toEqual([
      { type: 'image', url: '' },
      { type: 'image', url: 'https://example.com/image.jpg' },
      { type: 'image', url: '/uploads/image.jpg' },
    ]);
  });
});
