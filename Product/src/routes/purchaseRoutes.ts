import { FastifyTypedIntance } from '../types/fastify-types';
import { z } from 'zod';
import { Cart } from '../entities/Cart';
import { Product } from '../entities/Product';
import { Purchase } from '../entities/Purchase';

export async function purchaseRoutes(app: FastifyTypedIntance): Promise<void> {
  app.post(
    '/purchase/:userUid',
    {
      schema: {
        tags: ['purchases'],
        description: 'Register a purchase for a user',
        params: z.object({
          userUid: z.string().uuid('Invalid user UID format'),
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
      const { userUid } = request.params;

      try {
        const cart = await Cart.findOne({ owner: userUid });

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
          owner: userUid,
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

  app.get(
    '/purchases/:userUid',
    {
      schema: {
        tags: ['purchases'],
        description: 'Get all purchases paginated for a specific user',
        params: z.object({
          userUid: z.string().uuid('Invalid user UID format'),
        }),
        querystring: z.object({
          page: z.coerce
            .number()
            .int()
            .min(1, 'Page must be a positive integer'),
          limit: z.coerce
            .number()
            .int()
            .min(1, 'Limit must be a positive integer'),
        }),
        response: {
          200: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            data: z.array(
              z.object({
                id: z.string(),
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
                createdAt: z.string(),
              })
            ),
          }),
          500: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { userUid } = request.params;
      const { page, limit } = request.query;
  
      try {
        const total = await Purchase.countDocuments({ owner: userUid });
        const purchases = await Purchase.find({ owner: userUid })
          .skip((page - 1) * limit)
          .limit(limit)
          .sort({ createdAt: -1 });
  
        const mappedPurchases = purchases.map((purchase) => ({
          id: (purchase._id as any).toString(),
          uid: purchase.uid,
          owner: purchase.owner,
          products: purchase.products.map((product) => ({
            productId: product.productId,
            name: product.name,
            price: product.price,
            quantity: product.quantity,
            totalPrice: product.price * product.quantity,
          })),
          totalAmount: purchase.totalAmount,
          createdAt: purchase.createdAt.toISOString(),
        }));
  
        return reply.status(200).send({
          page,
          limit,
          total,
          data: mappedPurchases,
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );

  app.get(
    '/purchase/:uid',
    {
      schema: {
        tags: ['purchases'],
        description: 'Get details of a specific purchase by its UID',
        params: z.object({
          uid: z.string().uuid('Invalid purchase UID format'),
        }),
        response: {
          200: z.object({
            id: z.string(),
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
            createdAt: z.string(),
          }),
          404: z.object({
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
        const purchase = await Purchase.findOne({ uid });
  
        if (!purchase) {
          return reply.status(404).send({ message: 'Purchase not found' });
        }
  
        const mappedPurchase = {
          id: (purchase._id as any).toString(),
          owner: purchase.owner,
          products: purchase.products.map((product) => ({
            productId: product.productId,
            name: product.name,
            price: product.price,
            quantity: product.quantity,
            totalPrice: product.price * product.quantity,
          })),
          totalAmount: purchase.totalAmount,
          createdAt: purchase.createdAt.toISOString(),
        };
  
        return reply.status(200).send(mappedPurchase);
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
}