import { FastifyTypedIntance } from '../types/fastify-types';
import { z } from 'zod';
import { Cart } from '../entities/Cart';
import { Product } from '../entities/Product';
import { Purchase } from '../entities/Purchase';

export async function purchaseRoutes(app: FastifyTypedIntance): Promise<void> {
  app.post(
    '/purchase/:uid',
    {
      schema: {
        tags: ['purchase'],
        description: 'Register a purchase for a user',
        params: z.object({
          uid: z.string().uuid('Invalid user UID format'),
        }),
        response: {
          201: z.object({
            message: z.string(),
            uid: z.string(),
            owner: z.string(),
            products: z.array(
              z.object({
                productId: z.string(),
                name: z.string(),
                price: z.number(),
                quantity: z.number(),
                totalPrice: z.number(),
              })
            ),
            totalAmount: z.number(),
          }),
          400: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
          409: z.object({
            message: z.string(),
          }),
          500: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { uid } = request.params;

      try {
        const cart = await Cart.findOne({ owner: uid });

        if (!cart) {
          return reply.status(404).send({ message: 'Cart not found for this user' });
        }

        if (cart.products.length === 0) {
          return reply.status(400).send({ message: 'Cart is empty' });
        }

        for (const item of cart.products) {
          const product = await Product.findOne({ uid: item.productId });
          
          if (!product) {
            return reply.status(404).send({ message: `Product with ID ${item.productId} not found` });
          }

          if (product.quantity < item.quantity) {
            return reply.status(409).send({
              message: `Insufficient stock for product: ${item.name}. Available: ${product.quantity}, Required: ${item.quantity}`,
            });
          }
        }

        const newPurchase = new Purchase({
          owner: uid,
          products: cart.products.map((item) => ({
            ...item,
            totalPrice: item.price * item.quantity,
          })),
          totalAmount: cart.totalPrice,
        });

        const savedPurchase = await newPurchase.save();

        for (const item of cart.products) {
          const product = await Product.findOne({ uid: item.productId });
          if (product) {
            product.quantity -= item.quantity;
            await product.save();
          }
        }

        cart.set('products', []);
        cart.set('totalPrice', 0);
        await cart.save();

        return reply.status(201).send({
          message: 'Purchase successfully completed',
          uid: savedPurchase.uid,
          owner: savedPurchase.owner,
          products: savedPurchase.products,
          totalAmount: savedPurchase.totalAmount,
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
}