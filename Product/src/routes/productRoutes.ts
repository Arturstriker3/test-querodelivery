import { FastifyTypedIntance } from '../types/fastify-types';
import { z } from 'zod';
import { Product } from '../entities/Product';
import { ObjectId } from 'mongoose';

export async function productRoutes(app: FastifyTypedIntance): Promise<void> {
  app.post(
    '/products',
    {
      schema: {
        tags: ['products'],
        description: 'Create a new product',
        body: z.object({
          name: z.string().min(1, 'Product name is required'),
          description: z.string().min(1, 'Product description is required'),
          price: z.number().min(0, 'Price must be greater than 0'),
          quantity: z.number().min(1, 'Quantity must be at least 1'),
        }),
        response: {
          201: z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            price: z.number(),
            quantity: z.number(),
          }),
          400: z.object({
            message: z.string(),
          }),
          500: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, description, price, quantity } = request.body;

      try {
        const newProduct = new Product({
          name,
          description,
          price,
          quantity,
        });

        const savedProduct = await newProduct.save();

        return reply.status(201).send({
          id: savedProduct.id,
          name: savedProduct.name,
          description: savedProduct.description,
          price: savedProduct.price,
          quantity: savedProduct.quantity,
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );

  app.get(
    '/products',
    {
      schema: {
        tags: ['products'],
        description: 'Get all products paginated',
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
                name: z.string(),
                description: z.string(),
                price: z.number(),
                quantity: z.number(),
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
      const { page, limit } = request.query;

      try {
        const total = await Product.countDocuments({ deletedAt: null });
        const products = await Product.find({ deletedAt: null })
          .skip((page - 1) * limit)
          .limit(limit);

        const mappedProducts = products.map((product) => ({
          id: (product._id as ObjectId).toString(),
          uid: product.uid,
          name: product.name,
          description: product.description,
          price: product.price,
          quantity: product.quantity,
        }));

        return reply.status(200).send({
          page,
          limit,
          total,
          data: mappedProducts,
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );

  app.get(
    '/products/:uid',
    {
      schema: {
        tags: ['products'],
        description: 'Get a product by UID',
        params: z.object({
          uid: z.string().uuid('Invalid product UID format'),
        }),
        response: {
          200: z.object({
            id: z.string(),
            uid: z.string(),
            name: z.string(),
            description: z.string(),
            price: z.number(),
            quantity: z.number(),
            createdAt: z.string(),
            updatedAt: z.string(),
            deletedAt: z.string().optional(),
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
        const product = await Product.findOne({ uid });

        if (!product) {
          return reply.status(404).send({ message: 'Product not found' });
        }

        const mappedProduct = {
          id: (product._id as ObjectId).toString(),
          uid: product.uid,
          name: product.name,
          description: product.description,
          price: product.price,
          quantity: product.quantity,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
          deletedAt: product.deletedAt
            ? product.deletedAt.toISOString()
            : undefined,
        };

        return reply.status(200).send(mappedProduct);
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );

  app.put(
    '/products/:uid',
    {
      schema: {
        tags: ['products'],
        description: 'Update a product by UID',
        params: z.object({
          uid: z.string().uuid('Invalid product UID format'),
        }),
        body: z.object({
          name: z.string().min(1, 'Product name is required').optional(),
          description: z.string().optional(),
          price: z.number().min(0, 'Price must be greater than 0').optional(),
          quantity: z.number().min(1, 'Quantity must be at least 1').optional(),
        }),
        response: {
          200: z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            price: z.number(),
            quantity: z.number(),
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
      const { name, description, price, quantity } = request.body;

      try {
        const product = await Product.findOne({ uid });

        if (!product) {
          return reply.status(404).send({ message: 'Product not found' });
        }

        if (product.deletedAt) {
          return reply
            .status(400)
            .send({ message: 'Cannot edit a deleted product' });
        }

        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.quantity = quantity || product.quantity;

        const updatedProduct = await product.save();

        const mappedProduct = {
          id: updatedProduct.uid,
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: updatedProduct.price,
          quantity: updatedProduct.quantity,
        };

        return reply.status(200).send(mappedProduct);
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );

  app.delete(
    '/products/:uid',
    {
      schema: {
        tags: ['products'],
        description: 'Soft delete a product by UID',
        params: z.object({
          uid: z.string().uuid('Invalid product UID format'),
        }),
        response: {
          200: z.object({
            message: z.string(),
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
        const product = await Product.findOne({ uid });

        if (!product) {
          return reply.status(404).send({ message: 'Product not found' });
        }

        if (product.deletedAt) {
          return reply
            .status(400)
            .send({ message: 'Cannot delete a deleted product' });
        }

        product.deletedAt = new Date();
        await product.save();

        return reply
          .status(200)
          .send({ message: 'Product soft deleted successfully' });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );

  app.patch(
    '/products/:uid/increment',
    {
      schema: {
        tags: ['products'],
        description: 'Increment the quantity of a product by UID',
        params: z.object({
          uid: z.string().uuid('Invalid product UID format'),
        }),
        body: z.object({
          quantity: z.number().min(1, 'Increment quantity must be at least 1'),
        }),
        response: {
          200: z.object({
            message: z.string(),
            product: z.object({
              id: z.string(),
              name: z.string(),
              description: z.string(),
              price: z.number(),
              quantity: z.number(),
            }),
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
      const { quantity } = request.body;

      try {
        const product = await Product.findOne({ uid });

        if (!product) {
          return reply.status(404).send({ message: 'Product not found' });
        }

        if (product.deletedAt) {
          return reply
            .status(400)
            .send({
              message: 'Cannot increment quantity of a deleted product',
            });
        }

        product.quantity += quantity;
        await product.save();

        const mappedProduct = {
          id: product.uid,
          name: product.name,
          description: product.description,
          price: product.price,
          quantity: product.quantity,
        };

        return reply.status(200).send({
          message: 'Product quantity incremented successfully',
          product: mappedProduct,
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );

  app.patch(
    '/products/:uid/decrement',
    {
      schema: {
        tags: ['products'],
        description: 'Decrement the quantity of a product by UID',
        params: z.object({
          uid: z.string().uuid('Invalid product UID format'),
        }),
        body: z.object({
          quantity: z.number().min(1, 'Decrement quantity must be at least 1'),
        }),
        response: {
          200: z.object({
            message: z.string(),
            product: z.object({
              id: z.string(),
              name: z.string(),
              description: z.string(),
              price: z.number(),
              quantity: z.number(),
            }),
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
      const { quantity } = request.body;

      try {
        const product = await Product.findOne({ uid });

        if (!product) {
          return reply.status(404).send({ message: 'Product not found' });
        }

        if (product.deletedAt) {
          return reply
            .status(400)
            .send({
              message: 'Cannot decrement quantity of a deleted product',
            });
        }

        if (product.quantity < quantity) {
          return reply
            .status(400)
            .send({ message: 'Insufficient stock to decrement' });
        }

        product.quantity -= quantity;
        await product.save();

        const mappedProduct = {
          id: product.uid,
          name: product.name,
          description: product.description,
          price: product.price,
          quantity: product.quantity,
        };

        return reply.status(200).send({
          message: 'Product quantity decremented successfully',
          product: mappedProduct,
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
}
