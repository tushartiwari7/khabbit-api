import { Module } from '@nestjs/common';
import { RideRequestsController } from './ride-requests.controller';
import { RideRequestsService } from './ride-requests.service';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [ProfilesModule],
  controllers: [RideRequestsController],
  providers: [RideRequestsService],
  exports: [RideRequestsService],
})
export class RideRequestsModule {}
