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
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser, FirebaseUser } from '../auth/user.decorator';
import { ProfilesService } from '../profiles/profiles.service';

@Controller('vehicles')
@UseGuards(FirebaseAuthGuard)
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Get()
  async getMyVehicles(@CurrentUser() user: FirebaseUser) {
    const profile = await this.profilesService.getByFirebaseUid(user.uid);
    return this.vehiclesService.getByUser(profile.id);
  }

  @Post()
  async createVehicle(
    @CurrentUser() user: FirebaseUser,
    @Body() body: Record<string, unknown>,
  ) {
    const profile = await this.profilesService.getByFirebaseUid(user.uid);
    return this.vehiclesService.create(profile.id, body as any);
  }

  @Delete(':id')
  async deleteVehicle(
    @CurrentUser() user: FirebaseUser,
    @Param('id') vehicleId: string,
  ) {
    const profile = await this.profilesService.getByFirebaseUid(user.uid);
    return this.vehiclesService.delete(profile.id, vehicleId);
  }
}
