import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [ProfilesModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
