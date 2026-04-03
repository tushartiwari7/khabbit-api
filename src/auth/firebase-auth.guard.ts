import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(@Inject('FIREBASE_APP') private firebaseApp: admin.app.App) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed auth token');
    }

    const idToken = authHeader.substring(7);

    try {
      const decoded = await this.firebaseApp.auth().verifyIdToken(idToken);
      request.user = {
        uid: decoded.uid,
        email: decoded.email,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired Firebase token');
    }
  }
}
