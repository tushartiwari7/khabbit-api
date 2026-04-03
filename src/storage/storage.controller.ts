import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser, FirebaseUser } from '../auth/user.decorator';
import { ProfilesService } from '../profiles/profiles.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Controller('uploads')
@UseGuards(FirebaseAuthGuard)
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: FirebaseUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    const profile = await this.profilesService.getByFirebaseUid(user.uid);
    const url = await this.storageService.upload(
      `avatars/${profile.id}`,
      file,
    );

    await this.profilesService.update(profile.id, { avatarUrl: url });
    return { url };
  }

  @Post('vehicle-image/:vehicleId')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadVehicleImage(
    @CurrentUser() user: FirebaseUser,
    @UploadedFile() file: Express.Multer.File,
    @Param('vehicleId') vehicleId: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    const profile = await this.profilesService.getByFirebaseUid(user.uid);
    const url = await this.storageService.upload(
      `vehicle-images/${profile.id}/${vehicleId}`,
      file,
    );

    return { url };
  }
}
