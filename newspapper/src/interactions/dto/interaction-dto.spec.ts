import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreateCommentDto } from './create-comment.dto';
import { ManageCommentsQueryDto } from './manage-comments-query.dto';
import { ModerateCommentDto } from './moderate-comment.dto';
import { ReactionDto } from './reaction.dto';
import { UpdateCommentDto } from './update-comment.dto';

describe('interaction DTOs', () => {
  it('accepts valid comment, reaction, moderation and query values', async () => {
    const create = new CreateCommentDto();
    create.body = 'Comentario válido';
    const update = new UpdateCommentDto();
    update.body = 'Comentario actualizado';
    update.version = 1;
    const reaction = new ReactionDto();
    reaction.type = 'like';
    const moderation = new ModerateCommentDto();
    moderation.status = 'published';
    moderation.version = 1;
    const query = new ManageCommentsQueryDto();
    query.status = 'pending';

    await expect(validate(create)).resolves.toHaveLength(0);
    await expect(validate(update)).resolves.toHaveLength(0);
    await expect(validate(reaction)).resolves.toHaveLength(0);
    await expect(validate(moderation)).resolves.toHaveLength(0);
    await expect(validate(query)).resolves.toHaveLength(0);
  });

  it('rejects invalid comment, reaction, moderation and pagination values', async () => {
    const create = new CreateCommentDto();
    create.body = '';
    const reaction = new ReactionDto();
    reaction.type = 'love' as ReactionDto['type'];
    const moderation = new ModerateCommentDto();
    moderation.status = 'deleted' as ModerateCommentDto['status'];
    moderation.version = 0;
    const query = new ManageCommentsQueryDto();
    query.page = 0;
    query.size = 51;

    expect((await validate(create)).length).toBeGreaterThan(0);
    expect((await validate(reaction)).length).toBeGreaterThan(0);
    expect((await validate(moderation)).length).toBeGreaterThan(0);
    expect((await validate(query)).length).toBeGreaterThan(0);
  });
});
