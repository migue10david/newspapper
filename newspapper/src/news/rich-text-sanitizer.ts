import { RichTextBlockDto } from './dto/rich-text-block.dto';

function stripMarkup(value: string): string {
  return Array.from(value.replace(/<[^>]*>/gu, ''))
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0;
      return !(
        (code >= 0 && code <= 8) ||
        code === 11 ||
        code === 12 ||
        (code >= 14 && code <= 31)
      );
    })
    .join('');
}

function sanitizeUrl(value: string): string {
  const trimmed = value.trim();
  if (/^(?:https?:\/\/|\/)/iu.test(trimmed)) {
    return trimmed;
  }
  return '';
}

export function sanitizeRichTextBlocks(
  blocks: RichTextBlockDto[],
): RichTextBlockDto[] {
  return blocks.map((block) => ({
    type: block.type,
    ...(block.text !== undefined ? { text: stripMarkup(block.text) } : {}),
    ...(block.items !== undefined
      ? { items: block.items.map((item) => stripMarkup(item)) }
      : {}),
    ...(block.url !== undefined ? { url: sanitizeUrl(block.url) } : {}),
    ...(block.alt !== undefined ? { alt: stripMarkup(block.alt) } : {}),
  }));
}
