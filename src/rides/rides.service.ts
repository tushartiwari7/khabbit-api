import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RidesService {
  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
    private notifications: NotificationsService,
  ) {}

  async create(userId: string, rideData: Record<string, unknown>) {
    const fromPoint = rideData.from_point as { lat: number; lng: number };
    const toPoint = rideData.to_point as { lat: number; lng: number };

    if (!fromPoint?.lat || !toPoint?.lat) {
      throw new BadRequestException('from_point and to_point are required');
    }

    // TODO: fetch route polyline from Google Maps Directions API

    const { data, error } = await this.supabase.getAdminClient().rpc(
      'create_ride',
      {
        p_giver_id: userId,
        p_from_lng: fromPoint.lng,
        p_from_lat: fromPoint.lat,
        p_to_lng: toPoint.lng,
        p_to_lat: toPoint.lat,
        p_from_address: rideData.from_address || null,
        p_to_address: rideData.to_address || null,
        p_route_polyline: rideData.route_polyline || null,
        p_departure_time: rideData.departure_time,
        p_available_seats: rideData.available_seats || 1,
        p_vehicle_id: rideData.vehicle_id || null,
      },
    );

    if (error) throw new Error(`Failed to create ride: ${error.message}`);
    return data;
  }

  async findAvailable(lat: number, lng: number, radiusMeters: number) {
    const { data, error } = await this.supabase.getAdminClient().rpc(
      'find_available_rides',
      {
        p_lat: lat,
        p_lng: lng,
        p_radius: radiusMeters,
      },
    );

    if (error)
      throw new Error(`Failed to find available rides: ${error.message}`);
    return data;
  }

  async getByGiver(userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('rides')
      .select('*, vehicles(*)')
      .eq('giver_id', userId)
      .order('departure_time', { ascending: false });

    if (error) throw new Error(`Failed to fetch rides: ${error.message}`);
    return data;
  }

  async offerToTaker(
    giverId: string,
    rideId: string,
    body: { taker_id: string; ride_request_id?: string },
  ) {
    const { data: ride } = await this.supabase
      .getAdminClient()
      .from('rides')
      .select('giver_id')
      .eq('id', rideId)
      .single();

    if (ride?.giver_id !== giverId) {
      throw new ForbiddenException('You can only offer your own rides');
    }

    const { data: match, error } = await this.supabase
      .getAdminClient()
      .from('ride_matches')
      .insert({
        ride_id: rideId,
        taker_id: body.taker_id,
        ride_request_id: body.ride_request_id || null,
        status: 'offered',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create match: ${error.message}`);

    await this.supabase
      .getAdminClient()
      .from('chatrooms')
      .insert({ ride_match_id: match.id });

    const { data: taker } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .select('push_token')
      .eq('id', body.taker_id)
      .single();

    if (taker?.push_token) {
      await this.notifications.sendPush(
        taker.push_token,
        'Ride Offered!',
        'Someone offered you a ride. Tap to view details.',
      );
    }

    return match;
  }
}
