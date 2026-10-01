export const COMMENT_STATUSES = ['pending', 'published', 'hidden'] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export const REACTION_TYPES = ['like', 'useful'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];
