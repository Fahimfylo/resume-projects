import pino from 'pino';
import { env } from './env';

const redactPaths = [
  'password',
  'passwordConfirm',
  'currentPassword',
  'newPassword',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'req.headers.cookie',
  'req.headers.authorization',
  'body.password',
  'body.newPassword',
  'body.currentPassword',
  'body.token',
];

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      ip: req.ip,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
  ...(env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino/file',
      options: { destination: 1 },
    },
  }),
});
