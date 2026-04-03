import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { RideRequestsService } from './ride-requests.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser, FirebaseUser } from '../auth/user.decorator';
import { ProfilesService } from '../profiles/profiles.service';

@Controller('ride-requests')
@UseGuards(FirebaseAuthGuard)
export class RideRequestsController {
  constructor(
    private readonly service: RideRequestsService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Post()
  async createRequest(
    @CurrentUser() user: FirebaseUser,
    @Body() body: Record<string, unknown>,
  ) {
    const profile = await this.profilesService.getByFirebaseUid(user.uid);
    return this.service.create(profile.id, body);
  }

  @Get('my')
  async getMyRequests(@CurrentUser() user: FirebaseUser) {
    const profile = await this.profilesService.getByFirebaseUid(user.uid);
    return this.service.getByTaker(profile.id);
  }

  @Get(':id/matches')
  findMatchingRides(@Param('id') requestId: string) {
    return this.service.findMatchingRides(requestId);
  }
}
