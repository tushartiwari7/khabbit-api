import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { RideRequestsService } from './ride-requests.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/user.decorator';

@Controller('ride-requests')
@UseGuards(SupabaseAuthGuard)
export class RideRequestsController {
  constructor(private readonly service: RideRequestsService) {}

  @Post()
  createRequest(
    @CurrentUser('id') userId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.create(userId, body);
  }

  @Get('my')
  getMyRequests(@CurrentUser('id') userId: string) {
    return this.service.getByTaker(userId);
  }

  @Get(':id/matches')
  findMatchingRides(@Param('id') requestId: string) {
    return this.service.findMatchingRides(requestId);
  }
}
