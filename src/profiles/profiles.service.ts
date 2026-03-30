import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProfilesService {
  constructor(private supabase: SupabaseService) {}

  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Profile not found');
    return data;
  }

  async updateProfile(userId: string, updateData: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update profile: ${error.message}`);
    return data;
  }
}
