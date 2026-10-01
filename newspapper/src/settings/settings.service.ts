import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../database/database';
import { siteSettings } from '../database/schema';
import { UpdateSettingsDto } from './dto/update-settings.dto';

export interface PublicSettings {
  siteName: string;
  description: string;
  logoUrl: string | null;
}

const DEFAULT_SETTINGS = {
  id: 1,
  siteName: 'Periódico',
  description: 'Periódico digital de noticias',
  logoUrl: null,
};

@Injectable()
export class SettingsService {
  async ensureDefault(): Promise<void> {
    await db
      .insert(siteSettings)
      .values(DEFAULT_SETTINGS)
      .onConflictDoNothing({ target: siteSettings.id });
  }

  async getPublic(): Promise<PublicSettings> {
    await this.ensureDefault();
    const [settings] = await db
      .select({
        siteName: siteSettings.siteName,
        description: siteSettings.description,
        logoUrl: siteSettings.logoUrl,
      })
      .from(siteSettings)
      .where(eq(siteSettings.id, 1))
      .limit(1);
    return settings ?? DEFAULT_SETTINGS;
  }

  async update(dto: UpdateSettingsDto): Promise<PublicSettings> {
    await this.ensureDefault();
    const [updated] = await db
      .update(siteSettings)
      .set({
        siteName: dto.siteName,
        description: dto.description,
        logoUrl: dto.logoUrl ?? null,
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.id, 1))
      .returning({
        siteName: siteSettings.siteName,
        description: siteSettings.description,
        logoUrl: siteSettings.logoUrl,
      });
    return updated ?? this.getPublic();
  }
}
