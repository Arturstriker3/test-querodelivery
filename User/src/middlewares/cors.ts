import { FastifyCorsOptions } from '@fastify/cors';

export const corsOptions: FastifyCorsOptions = {
    origin: (origin, callback) => {
      const allowedOrigins = ['*'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  };