import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/user.decorator';

@Controller('profile')
@UseGuards(SupabaseAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  getProfile(@CurrentUser('id') userId: string) {
    return this.profilesService.getProfile(userId);
  }

  @Put()
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateData: Record<string, unknown>,
  ) {
    return this.profilesService.updateProfile(userId, updateData);
  }
}
