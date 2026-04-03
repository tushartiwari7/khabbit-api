import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { RideMatchesService } from './ride-matches.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser, FirebaseUser } from '../auth/user.decorator';
import { ProfilesService } from '../profiles/profiles.service';

@Controller('ride-matches')
@UseGuards(FirebaseAuthGuard)
export class RideMatchesController {
  constructor(
    private readonly service: RideMatchesService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Post(':id/accept')
  async acceptMatch(
    @CurrentUser() user: FirebaseUser,
    @Param('id') matchId: string,
  ) {
    const profile = await this.profilesService.getByFirebaseUid(user.uid);
    return this.service.accept(profile.id, matchId);
  }

  @Post(':id/payment')
  async confirmPayment(
    @CurrentUser() user: FirebaseUser,
    @Param('id') matchId: string,
    @Body() body: { status: 'paid' | 'received'; method?: string },
  ) {
    const profile = await this.profilesService.getByFirebaseUid(user.uid);
    return this.service.confirmPayment(profile.id, matchId, body);
  }
}
