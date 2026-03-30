import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class VehiclesService {
  constructor(private supabase: SupabaseService) {}

  async getByUser(userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch vehicles: ${error.message}`);
    return data;
  }

  async create(userId: string, vehicleData: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('vehicles')
      .insert({ ...vehicleData, user_id: userId })
      .select()
      .single();

    if (error) throw new Error(`Failed to create vehicle: ${error.message}`);
    return data;
  }

  async delete(userId: string, vehicleId: string) {
    const { data: existing } = await this.supabase
      .getAdminClient()
      .from('vehicles')
      .select('user_id')
      .eq('id', vehicleId)
      .single();

    if (!existing) throw new NotFoundException('Vehicle not found');
    if (existing.user_id !== userId)
      throw new ForbiddenException('Not your vehicle');

    const { error } = await this.supabase
      .getAdminClient()
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);

    if (error) throw new Error(`Failed to delete vehicle: ${error.message}`);
    return { deleted: true };
  }
}
