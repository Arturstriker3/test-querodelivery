import "reflect-metadata";
import { fastify } from 'fastify';
import { fastifyCors } from '@fastify/cors';
import { corsOptions } from './middlewares/cors';
import { validatorCompiler, serializerCompiler, ZodTypeProvider, jsonSchemaTransform } from 'fastify-type-provider-zod';
import { envConfig } from './helpers/envs';
import rootRoute from './helpers/rootRoute';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { routes } from './routes';
import { AppDataSource } from './database/data-source';

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
  },
  transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUi, {
  routePrefix: `/docs`,
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