import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { COMMENT_STATUSES, REACTION_TYPES } from '../interactions/constants';

export const userRole = pgEnum('user_role', ['author', 'editor', 'admin']);

export const newsStatus = pgEnum('news_status', [
  'draft',
  'inReview',
  'scheduled',
  'published',
  'archived',
]);

export const commentStatus = pgEnum('comment_status', COMMENT_STATUSES);
export const reactionType = pgEnum('reaction_type', REACTION_TYPES);

export const authors = pgTable(
  'authors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    bio: text('bio'),
    photoUrl: text('photo_url'),
    userId: uuid('user_id').unique(),
  },
  (t) => [uniqueIndex('authors_name_unique').on(t.name)],
);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRole('role').notNull(),
  authorId: uuid('author_id').references(() => authors.id),
});

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('refresh_tokens_token_hash_unique').on(t.tokenHash),
    index('refresh_tokens_expires_at_idx').on(t.expiresAt),
  ],
);

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
  },
  (t) => [uniqueIndex('categories_slug_unique').on(t.slug)],
);

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
  },
  (t) => [uniqueIndex('tags_slug_unique').on(t.slug)],
);

export const media = pgTable('media', {
  id: uuid('id').defaultRandom().primaryKey(),
  url: text('url').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  alt: text('alt'),
});

export const siteSettings = pgTable('site_settings', {
  id: integer('id').primaryKey().default(1),
  siteName: text('site_name').notNull(),
  description: text('description').notNull(),
  logoUrl: text('logo_url'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const news = pgTable(
  'news',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    summary: text('summary').notNull(),
    body: jsonb('body').notNull(),
    imageId: uuid('image_id').references(() => media.id, {
      onDelete: 'set null',
    }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    authorId: uuid('author_id')
      .notNull()
      .references(() => authors.id),
    status: newsStatus('status').notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('news_slug_unique').on(t.slug),
    index('news_status_published_at_idx').on(t.status, t.publishedAt),
  ],
);

export const newsTags = pgTable(
  'news_tags',
  {
    newsId: uuid('news_id')
      .notNull()
      .references(() => news.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id),
  },
  (t) => [primaryKey({ columns: [t.newsId, t.tagId] })],
);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    newsId: uuid('news_id')
      .notNull()
      .references(() => news.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    status: commentStatus('status').notNull().default('pending'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('comments_news_status_created_at_idx').on(
      t.newsId,
      t.status,
      t.createdAt,
    ),
    index('comments_user_id_idx').on(t.userId),
  ],
);

export const newsReactions = pgTable(
  'news_reactions',
  {
    newsId: uuid('news_id')
      .notNull()
      .references(() => news.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: reactionType('type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.newsId, t.userId] }),
    index('news_reactions_news_id_idx').on(t.newsId),
    index('news_reactions_user_id_idx').on(t.userId),
  ],
);
