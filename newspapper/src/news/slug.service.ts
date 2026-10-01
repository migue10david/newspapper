import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class SlugService {
  normalize(input: string): string {
    const slug = input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
    if (!slug) {
      throw new BadRequestException('Slug cannot be derived from title');
    }
    return slug;
  }

  async assertAvailable(
    slug: string,
    exists: (slug: string) => Promise<boolean>,
  ): Promise<void> {
    if (await exists(slug)) {
      throw new BadRequestException('Slug already in use');
    }
  }
}
