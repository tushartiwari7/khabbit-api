import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser, FirebaseUser } from '../auth/user.decorator';

@Controller('profile')
@UseGuards(FirebaseAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  async getProfile(@CurrentUser() user: FirebaseUser) {
    return this.profilesService.getByFirebaseUid(user.uid);
  }

  @Put()
  async updateProfile(
    @CurrentUser() user: FirebaseUser,
    @Body() updateData: Record<string, unknown>,
  ) {
    const profile = await this.profilesService.getByFirebaseUid(user.uid);
    return this.profilesService.update(profile.id, updateData);
  }

  @Post('signup')
  async signup(
    @CurrentUser() user: FirebaseUser,
    @Body() body: { invite_code?: string },
  ) {
    return this.profilesService.createOnSignup(
      user.uid,
      user.email!,
      body.invite_code,
    );
  }
}
