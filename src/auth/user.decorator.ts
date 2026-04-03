import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface FirebaseUser {
  uid: string;
  email?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof FirebaseUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: FirebaseUser = request.user;
    return data ? user?.[data] : user;
  },
);
