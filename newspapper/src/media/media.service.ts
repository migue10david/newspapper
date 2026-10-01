import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { db } from '../database/database';
import { media } from '../database/schema';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class MediaService {
  async saveFile(
    file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    },
    alt?: string,
  ) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
    const extension = EXTENSIONS[file.mimetype] ?? extname(file.originalname);
    const filename = `${randomUUID()}${extension}`;
    writeFileSync(join(UPLOAD_DIR, filename), file.buffer);

    const [created] = await db
      .insert(media)
      .values({
        url: `/uploads/${filename}`,
        mime: file.mimetype,
        size: file.size,
        alt: alt ?? null,
      })
      .returning();
    return created;
  }

  async remove(id: string): Promise<void> {
    const deleted = await db.delete(media).where(eq(media.id, id)).returning();
    if (deleted.length === 0) {
      throw new NotFoundException('Media not found');
    }
    // FK onDelete: 'set null' clears referencing news.imageId automatically.
    try {
      unlinkSync(join(process.cwd(), deleted[0].url));
    } catch {
      // File may already be gone; removal stays tolerant.
    }
  }
}
