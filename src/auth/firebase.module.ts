import { Module, Global, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseAuthGuard } from './firebase-auth.guard';

const logger = new Logger('FirebaseModule');

const firebaseProvider = {
  provide: 'FIREBASE_APP',
  useFactory: (config: ConfigService) => {
    if (admin.apps.length) return admin.apps[0]!;

    try {
      const app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.getOrThrow('FIREBASE_PROJECT_ID'),
          clientEmail: config.getOrThrow('FIREBASE_CLIENT_EMAIL'),
          privateKey: config
            .getOrThrow<string>('FIREBASE_PRIVATE_KEY')
            .replace(/\\n/g, '\n'),
        }),
      });
      logger.log('Firebase Admin initialized');
      return app;
    } catch (error) {
      logger.warn(
        'Firebase Admin failed to initialize — auth-protected routes will not work. ' +
          'Set valid FIREBASE_* env vars to enable auth.',
      );
      return null;
    }
  },
  inject: [ConfigService],
};

@Global()
@Module({
  providers: [firebaseProvider, FirebaseAuthGuard],
  exports: [firebaseProvider, FirebaseAuthGuard],
})
export class FirebaseModule {}
