import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseAuthGuard } from './firebase-auth.guard';

const firebaseProvider = {
  provide: 'FIREBASE_APP',
  useFactory: (config: ConfigService) => {
    if (admin.apps.length) return admin.apps[0]!;

    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.getOrThrow('FIREBASE_PROJECT_ID'),
        clientEmail: config.getOrThrow('FIREBASE_CLIENT_EMAIL'),
        privateKey: config
          .getOrThrow<string>('FIREBASE_PRIVATE_KEY')
          .replace(/\\n/g, '\n'),
      }),
    });
  },
  inject: [ConfigService],
};

@Global()
@Module({
  providers: [firebaseProvider, FirebaseAuthGuard],
  exports: [firebaseProvider, FirebaseAuthGuard],
})
export class FirebaseModule {}
