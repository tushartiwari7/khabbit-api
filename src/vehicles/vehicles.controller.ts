import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/user.decorator';

@Controller('vehicles')
@UseGuards(SupabaseAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  getMyVehicles(@CurrentUser('id') userId: string) {
    return this.vehiclesService.getByUser(userId);
  }

  @Post()
  createVehicle(
    @CurrentUser('id') userId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.vehiclesService.create(userId, body);
  }

  @Delete(':id')
  deleteVehicle(
    @CurrentUser('id') userId: string,
    @Param('id') vehicleId: string,
  ) {
    return this.vehiclesService.delete(userId, vehicleId);
  }
}
