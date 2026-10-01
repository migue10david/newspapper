import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../auth/decorators/roles.decorator';
import { MediaService } from './media.service';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Roles('author', 'editor', 'admin')
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          callback(
            new BadRequestException('Only jpg, png or webp images allowed'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('alt') alt?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File exceeds 5MB');
    }
    return this.mediaService.saveFile(file, alt);
  }

  @Roles('editor', 'admin')
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.mediaService.remove(id);
  }
}
