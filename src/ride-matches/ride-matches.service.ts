import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class RideMatchesService {
  constructor(private supabase: SupabaseService) {}

  async accept(userId: string, matchId: string) {
    const { data: match } = await this.supabase
      .getAdminClient()
      .from('ride_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (!match) throw new NotFoundException('Match not found');
    if (match.taker_id !== userId)
      throw new ForbiddenException('Only the taker can accept');

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('ride_matches')
      .update({ status: 'accepted' })
      .eq('id', matchId)
      .select()
      .single();

    if (error) throw new Error(`Failed to accept match: ${error.message}`);
    return data;
  }

  async confirmPayment(
    userId: string,
    matchId: string,
    body: { status: 'paid' | 'received'; method?: string },
  ) {
    const { data: match } = await this.supabase
      .getAdminClient()
      .from('ride_matches')
      .select('*, rides(giver_id)')
      .eq('id', matchId)
      .single();

    if (!match) throw new NotFoundException('Match not found');

    const isGiver = match.rides?.giver_id === userId;
    const isTaker = match.taker_id === userId;

    if (body.status === 'paid' && !isTaker)
      throw new ForbiddenException('Only taker can mark as paid');
    if (body.status === 'received' && !isGiver)
      throw new ForbiddenException('Only giver can mark as received');

    const updateData: Record<string, unknown> = {
      payment_status: body.status,
    };
    if (body.method) updateData.payment_method = body.method;

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('ride_matches')
      .update(updateData)
      .eq('id', matchId)
      .select()
      .single();

    if (error)
      throw new Error(`Failed to update payment: ${error.message}`);
    return data;
  }
}
