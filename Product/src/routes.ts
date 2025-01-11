import { FastifyTypedIntance } from './types/fastify-types';
import { productRoutes } from './routes/productRoutes';
import { cartRoutes } from './routes/cartRoutes';

export async function routes(app: FastifyTypedIntance): Promise<void> {
  app.addHook('preValidation', app.authenticate);

  await productRoutes(app);
  await cartRoutes(app);
}