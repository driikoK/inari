import { Injectable, NestMiddleware } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Fastify runs Nest middleware through @fastify/middie, which hands over the raw Node request
type LoggedRequest = IncomingMessage & { body?: unknown; originalUrl?: string };

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: LoggedRequest, _res: ServerResponse, next: () => void) {
    console.log(`req:`, {
      body: req.body,
      originalUrl: req.originalUrl,
    });
    if (next) {
      next();
    }
  }
}
