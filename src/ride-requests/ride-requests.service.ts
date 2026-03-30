import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class RideRequestsService {
  constructor(private supabase: SupabaseService) {}

  async create(userId: string, requestData: Record<string, unknown>) {
    const fromPoint = requestData.from_point as { lat: number; lng: number };
    const toPoint = requestData.to_point as { lat: number; lng: number };

    const { data, error } = await this.supabase.getAdminClient().rpc(
      'create_ride_request',
      {
        p_taker_id: userId,
        p_from_lng: fromPoint.lng,
        p_from_lat: fromPoint.lat,
        p_to_lng: toPoint.lng,
        p_to_lat: toPoint.lat,
        p_from_address: requestData.from_address || null,
        p_to_address: requestData.to_address || null,
        p_num_riders: requestData.num_riders || 1,
        p_preferred_time: requestData.preferred_time || null,
      },
    );

    if (error) throw new Error(`Failed to create request: ${error.message}`);
    return data;
  }

  async getByTaker(userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('ride_requests')
      .select('*')
      .eq('taker_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch requests: ${error.message}`);
    return data;
  }

  async findMatchingRides(requestId: string) {
    const { data: request } = await this.supabase
      .getAdminClient()
      .from('ride_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!request) throw new NotFoundException('Ride request not found');

    const { data, error } = await this.supabase.getAdminClient().rpc(
      'find_matching_rides_for_request',
      { p_request_id: requestId },
    );

    if (error) throw new Error(`Failed to find matches: ${error.message}`);
    return data;
  }
}
