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
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/user.decorator';

@Controller('rides')
@UseGuards(SupabaseAuthGuard)
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  createRide(
    @CurrentUser('id') userId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.ridesService.create(userId, body);
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
  getMyRides(@CurrentUser('id') userId: string) {
    return this.ridesService.getByGiver(userId);
  }

  @Post(':id/offer')
  offerRide(
    @CurrentUser('id') userId: string,
    @Param('id') rideId: string,
    @Body() body: { taker_id: string; ride_request_id?: string },
  ) {
    return this.ridesService.offerToTaker(userId, rideId, body);
  }
}
