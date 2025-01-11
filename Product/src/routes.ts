import { FastifyTypedIntance } from './types/fastify-types';
import { productRoutes } from './routes/productRoutes';
import { cartRoutes } from './routes/cartRoutes';
import { purchaseRoutes } from './routes/purchaseRoutes';

export async function routes(app: FastifyTypedIntance): Promise<void> {
  app.addHook('preValidation', app.authenticate);

  await productRoutes(app);
  await cartRoutes(app);
  await purchaseRoutes(app);
}