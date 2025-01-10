import { FastifyTypedIntance } from './types/fastify-types';
import { z } from 'zod';
import { Product } from './entities/Product';
import { ObjectId } from 'mongoose';

export async function routes(app: FastifyTypedIntance): Promise<void> {
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
        description: 'Get all products with pagination',
        querystring: z.object({
          page: z.number().min(1, 'Page must be at least 1').default(1),
          limit: z.number().min(1, 'Limit must be at least 1').default(10),
        }),
        response: {
          200: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            products: z.array(
              z.object({
                id: z.string(),
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
        const skip = (page - 1) * limit;
  
        const total = await Product.countDocuments();
        const products = await Product.find().skip(skip).limit(limit);
  
        const mappedProducts = products.map((product) => ({
          id: (product._id as ObjectId).toString(),
          name: product.name,
          description: product.description,
          price: product.price,
          quantity: product.quantity,
        }));
  
        return reply.status(200).send({
          total,
          page,
          limit,
          products: mappedProducts,
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );

  app.get(
    '/products/:id',
    {
      schema: {
        tags: ['products'],
        description: 'Get a product by ID',
        params: z.object({
          id: z.string().uuid('Invalid product ID format'),
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
      const { id } = request.params;
  
      try {
        const product = await Product.findById(id);
  
        if (!product) {
          return reply.status(404).send({ message: 'Product not found' });
        }
  
        const mappedProduct = {
          id: (product._id as ObjectId).toString(),
          name: product.name,
          description: product.description,
          price: product.price,
          quantity: product.quantity,
        };
  
        return reply.status(200).send(mappedProduct);
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );

  app.put(
    '/products/:id',
    {
      schema: {
        tags: ['products'],
        description: 'Update a product by ID',
        params: z.object({
          id: z.string().uuid('Invalid product ID format'),
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
      const { id } = request.params;
      const { name, description, price, quantity } = request.body;
  
      try {
        const product = await Product.findById(id);
  
        if (!product) {
          return reply.status(404).send({ message: 'Product not found' });
        }
  
        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.quantity = quantity || product.quantity;
  
        const updatedProduct = await product.save();
  
        const mappedProduct = {
          id: (updatedProduct._id as ObjectId).toString(),
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
    '/products/:id',
    {
      schema: {
        tags: ['products'],
        description: 'Soft delete a product by ID',
        params: z.object({
          id: z.string().uuid('Invalid product ID format'),
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
      const { id } = request.params;

      try {
        const product = await Product.findById(id);

        if (!product) {
          return reply.status(404).send({ message: 'Product not found' });
        }

        product.deletedAt = new Date();
        await product.save();

        return reply.status(200).send({ message: 'Product soft deleted successfully' });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
}