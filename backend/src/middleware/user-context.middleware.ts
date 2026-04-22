import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
      userRole: string;
    }
  }
}

@Injectable()
export class UserContextMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const externalId = (req.headers['x-user-id'] as string) || 'default-user';
    const role = (req.headers['x-user-role'] as string) || 'USER';

    let user = await this.prisma.user.findUnique({ where: { externalId } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          externalId,
          name: externalId === 'default-user' ? 'Standardnutzer' : externalId,
          role: role === 'ADMIN' ? 'ADMIN' : 'USER',
        },
      });
    }

    req.userId = user.id;
    req.userRole = user.role;
    next();
  }
}
