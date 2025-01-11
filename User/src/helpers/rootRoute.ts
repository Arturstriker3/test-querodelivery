import { FastifyPluginAsync } from 'fastify';

const rootRoute: FastifyPluginAsync = async (app) => {
  app.get('/', async (request, reply) => {
    return {
      environment: process.env.NODE_ENV,
      message: 'Hello, world!',
    };
  });
};

export default rootRoute;