import { FastifyTypedIntance } from './types/fastify-types';
import { z } from 'zod';
import { Product } from './entities/Product';
import { ObjectId } from 'mongoose';
import { Cart } from './entities/Cart'

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
        description: 'Get all products paginated',
        querystring: z.object({
          page: z.coerce.number().int().min(1, 'Page must be a positive integer'),
          limit: z.coerce.number().int().min(1, 'Limit must be a positive integer'),
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
          deletedAt: product.deletedAt ? product.deletedAt.toISOString() : undefined,
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
          return reply.status(400).send({ message: 'Cannot edit a deleted product' });
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
          return reply.status(400).send({ message: 'Cannot delete a deleted product' });
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
          return reply.status(400).send({ message: 'Cannot increment quantity of a deleted product' });
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
          return reply.status(400).send({ message: 'Cannot decrement quantity of a deleted product' });
        }
    
        if (product.quantity < quantity) {
          return reply.status(400).send({ message: 'Insufficient stock to decrement' });
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

  app.post(
    '/carts/:userId',
    {
      schema: {
        tags: ['carts'],
        description: 'Create a cart for a new user',
        params: z.object({
          userId: z.string().uuid('Invalid UUID format for userId'),
        }),
        response: {
          201: z.object({
            message: z.string(),
            cart: z.object({
              id: z.string(),
              owner: z.string(),
              products: z.array(
                z.object({
                  productId: z.string(),
                  name: z.string(),
                  price: z.number(),
                  quantity: z.number(),
                })
              ),
              totalPrice: z.number(),
            }),
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
      const { userId } = request.params;
  
      try {
        const existingCart = await Cart.findOne({ owner: userId });
        if (existingCart) {
          return reply.status(400).send({ message: 'Cart already exists for this user' });
        }
  
        const newCart = new Cart({ owner: userId });
        const savedCart = await newCart.save();
  
        return reply.status(201).send({
          message: 'Cart created successfully',
          cart: {
            id: savedCart._id.toString(),
            owner: savedCart.owner,
            products: savedCart.products.map((product) => ({
              productId: product.productId.toString(),
              name: product.name,
              price: product.price,
              quantity: product.quantity,
            })),
            totalPrice: savedCart.totalPrice,
          },
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );

  app.get(
    '/carts/:userUid',
    {
      schema: {
        tags: ['carts'],
        description: 'Get the cart of a user by userUid',
        params: z.object({
          userUid: z.string(),
        }),
        response: {
          200: z.object({
            cart: z.object({
              id: z.string(),
              uid: z.string(),
              owner: z.string(),
              products: z.array(
                z.object({
                  productId: z.string(),
                  name: z.string(),
                  price: z.number(),
                  quantity: z.number(),
                })
              ),
              totalPrice: z.number(),
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
      const { userUid } = request.params;
    
      try {
        const cart = await Cart.findOne({ owner: userUid });
    
        if (!cart) {
          return reply.status(404).send({ message: 'Cart not found for this user' });
        }
    
        return reply.status(200).send({
          cart: {
            id: cart._id.toString(),
            uid: cart.uid,
            owner: cart.owner,
            products: cart.products.map((product) => ({
              productId: product.productId.toString(),
              name: product.name,
              price: product.price,
              quantity: product.quantity,
            })),
            totalPrice: cart.totalPrice,
          },
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );

  app.post(
    '/carts/:userUid/products',
    {
      schema: {
        tags: ['carts'],
        description: 'Add a product to the cart of a user by userUid',
        params: z.object({
          userUid: z.string().uuid('Invalid UUID format for userUid'),
        }),
        body: z.object({
          productId: z.string().uuid('Invalid UUID format for productId'),
          quantity: z.number().min(1, 'Quantity must be at least 1'),
        }),
        response: {
          200: z.object({
            message: z.string(),
            cart: z.object({
              id: z.string(),
              uid: z.string(),
              owner: z.string(),
              products: z.array(
                z.object({
                  productId: z.string(),
                  name: z.string(),
                  price: z.number(),
                  quantity: z.number(),
                })
              ),
              totalPrice: z.number(),
            }),
          }),
          404: z.object({
            message: z.string(),
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
      const { userUid } = request.params;
      const { productId, quantity } = request.body;
  
      try {
        let cart = await Cart.findOne({ owner: userUid });
  
        if (!cart) {
          return reply.status(404).send({ message: 'User cart not found' });
        }
  
        const product = await Product.findOne({ uid: productId });
  
        if (!product) {
          return reply.status(404).send({ message: 'Product not found' });
        }

        if (product.deletedAt) {
          return reply.status(400).send({ message: 'Product is deleted and cannot be added to the cart' });
        }

        const existingProduct = cart.products.find(
          (p) => p.productId === product.uid
        );
  
        if (existingProduct) {
          existingProduct.quantity += quantity;
        } else {
          cart.products.push({
            productId: product.uid,
            name: product.name,
            price: product.price,
            quantity,
          });
        }
  
        cart.totalPrice = cart.products.reduce(
          (total, p) => total + p.price * p.quantity,
          0
        );
  
        await cart.save();
  
        return reply.status(200).send({
          message: 'Product added to cart successfully',
          cart: {
            id: cart._id.toString(),
            uid: cart.uid,
            owner: cart.owner,
            products: cart.products.map((product) => ({
              productId: product.productId,
              name: product.name,
              price: product.price,
              quantity: product.quantity,
            })),
            totalPrice: cart.totalPrice,
          },
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );

  app.delete(
    '/carts/user/:userUid/products/:productId',
    {
      schema: {
        tags: ['carts'],
        description: 'Remove a product from the cart by userUid and productId',
        params: z.object({
          userUid: z.string(),
          productId: z.string(),
        }),
        response: {
          200: z.object({
            message: z.string(),
            cart: z.object({
              id: z.string(),
              uid: z.string(),
              owner: z.string(),
              products: z.array(
                z.object({
                  productId: z.string(),
                  name: z.string(),
                  price: z.number(),
                  quantity: z.number(),
                })
              ),
              totalPrice: z.number(),
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
      const { userUid, productId } = request.params;
  
      try {
        const cart = await Cart.findOne({ owner: userUid });
  
        if (!cart) {
          return reply.status(404).send({ message: 'Cart not found for this user cart' });
        }
  
        const productIndex = cart.products.findIndex(
          (product) => product.productId.toString() === productId
        );
  
        if (productIndex === -1) {
          return reply.status(404).send({ message: 'Product not found in this user cart' });
        }
  
        const product = cart.products[productIndex];
  
        if (product.quantity > 1) {
          product.quantity -= 1;
        } else {
          cart.products.splice(productIndex, 1);
        }
  
        cart.totalPrice = cart.products.reduce(
          (total, product) => total + product.price * product.quantity,
          0
        );
  
        await cart.save();
  
        return reply.status(200).send({
          message: 'Product removed successfully',
          cart: {
            id: cart._id.toString(),
            uid: cart.uid,
            owner: cart.owner,
            products: cart.products.map((product) => ({
              productId: product.productId.toString(),
              name: product.name,
              price: product.price,
              quantity: product.quantity,
            })),
            totalPrice: cart.totalPrice,
          },
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );

  app.delete(
    '/carts/user/:userUid/products',
    {
      schema: {
        tags: ['carts'],
        description: 'Remove all products from the cart by userUid',
        params: z.object({
          userUid: z.string(),
        }),
        response: {
          200: z.object({
            message: z.string(),
            cart: z.object({
              id: z.string(),
              uid: z.string(),
              owner: z.string(),
              products: z.array(
                z.object({
                  productId: z.string(),
                  name: z.string(),
                  price: z.number(),
                  quantity: z.number(),
                })
              ),
              totalPrice: z.number(),
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
      const { userUid } = request.params;
  
      try {
        const cart = await Cart.findOne({ owner: userUid });
  
        if (!cart) {
          return reply.status(404).send({ message: 'Cart not found' });
        }
  
        cart.products.splice(0, cart.products.length);
        cart.totalPrice = 0;
  
        await cart.save();
  
        return reply.status(200).send({
          message: 'All products removed successfully',
          cart: {
            id: cart._id.toString(),
            uid: cart.uid,
            owner: cart.owner,
            products: cart.products,
            totalPrice: cart.totalPrice,
          },
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
}