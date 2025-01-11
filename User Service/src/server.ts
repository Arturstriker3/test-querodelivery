import "reflect-metadata";
import { fastify } from 'fastify';
import { fastifyCors } from '@fastify/cors';
import { validatorCompiler, serializerCompiler, ZodTypeProvider, jsonSchemaTransform } from 'fastify-type-provider-zod';
import { envConfig } from './helpers/envs';
import rootRoute from './helpers/rootRoute';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { routes } from './routes';
import { AppDataSource } from './database/data-source';
import fastifyJwt from '@fastify/jwt';
import { FastifyRequest, FastifyReply } from 'fastify';

const app = fastify().withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.register(fastifyCors, { origin: "*"});
app.register(rootRoute);

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: `${envConfig.getServerName()} - API Documentation`,
      version: `${envConfig.getServerVersion()}`,
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUi, {
  routePrefix: `/docs`,
});

const jwtSecret = envConfig.getServerJwtSecret();
app.register(fastifyJwt, {
  secret: jwtSecret,
});

app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      return reply.status(401).send({ message: 'Authorization header is missing' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return reply.status(401).send({ message: 'Token is missing' });
    }

    await request.jwtVerify();

  } catch (error) {
    console.error(error);
    return reply.status(401).send({ message: 'Invalid or expired token' });
  }
});

app.register(routes);

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connected successfully!");

    app.listen({ port: Number(envConfig.getPort()) }, (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      const docsUrl = `${address}/docs`;
      console.log(`Server listening at ${address}`);
      console.log(`API Documentation available at ${docsUrl}`);
    });
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  }
};

startServer();