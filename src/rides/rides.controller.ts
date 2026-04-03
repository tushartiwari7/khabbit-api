import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RidesService } from './rides.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser, FirebaseUser } from '../auth/user.decorator';
import { ProfilesService } from '../profiles/profiles.service';

@Controller('rides')
@UseGuards(FirebaseAuthGuard)
export class RidesController {
  constructor(
    private readonly ridesService: RidesService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Post()
  async createRide(
    @CurrentUser() user: FirebaseUser,
    @Body() body: Record<string, unknown>,
  ) {
    const profile = await this.profilesService.getByFirebaseUid(user.uid);
    return this.ridesService.create(profile.id, body);
  }

  @Get('available')
  getAvailableRides(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 5000,
  ) {
    return this.ridesService.findAvailable(lat, lng, radius);
  }

  @Get('my')
  async getMyRides(@CurrentUser() user: FirebaseUser) {
    const profile = await this.profilesService.getByFirebaseUid(user.uid);
    return this.ridesService.getByGiver(profile.id);
  }

  @Post(':id/offer')
  async offerRide(
    @CurrentUser() user: FirebaseUser,
    @Param('id') rideId: string,
    @Body() body: { taker_id: string; ride_request_id?: string },
  ) {
    const profile = await this.profilesService.getByFirebaseUid(user.uid);
    return this.ridesService.offerToTaker(profile.id, rideId, body);
  }
}
