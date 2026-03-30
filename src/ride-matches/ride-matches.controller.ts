import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { RideMatchesService } from './ride-matches.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/user.decorator';

@Controller('ride-matches')
@UseGuards(SupabaseAuthGuard)
export class RideMatchesController {
  constructor(private readonly service: RideMatchesService) {}

  @Post(':id/accept')
  acceptMatch(
    @CurrentUser('id') userId: string,
    @Param('id') matchId: string,
  ) {
    return this.service.accept(userId, matchId);
  }

  @Post(':id/payment')
  confirmPayment(
    @CurrentUser('id') userId: string,
    @Param('id') matchId: string,
    @Body() body: { status: 'paid' | 'received'; method?: string },
  ) {
    return this.service.confirmPayment(userId, matchId, body);
  }
}
