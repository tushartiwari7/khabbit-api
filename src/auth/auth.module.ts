import { Module } from '@nestjs/common';
import { FirebaseModule } from './firebase.module';

@Module({
  imports: [FirebaseModule],
  exports: [FirebaseModule],
})
export class AuthModule {}
