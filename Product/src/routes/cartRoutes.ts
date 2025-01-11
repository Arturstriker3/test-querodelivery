import { FastifyTypedIntance } from '../types/fastify-types';
import { z } from 'zod';
import { Cart } from '../entities/Cart';
import { Product } from '../entities/Product';

export async function cartRoutes(app: FastifyTypedIntance): Promise<void> {
  app.post(
    '/carts/:userUid',
    {
      schema: {
        tags: ['carts'],
        description: 'Create a cart for a new user',
        params: z.object({
          userUid: z.string().uuid('Invalid UUID format for userUid'),
        }),
        response: {
          201: z.object({
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

      try {
        const existingCart = await Cart.findOne({ owner: userUid });
        if (existingCart) {
          return reply
            .status(400)
            .send({ message: 'Cart already exists for this user' });
        }

        const newCart = new Cart({ owner: userUid });
        const savedCart = await newCart.save();

        return reply.status(201).send({
          message: 'Cart created successfully',
          cart: {
            id: savedCart._id.toString(),
            uid: savedCart.uid,
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
          return reply
            .status(404)
            .send({ message: 'Cart not found for this user' });
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
          return reply
            .status(400)
            .send({
              message: 'Product is deleted and cannot be added to the cart',
            });
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
          return reply
            .status(404)
            .send({ message: 'Cart not found for this user cart' });
        }

        const productIndex = cart.products.findIndex(
          (product) => product.productId.toString() === productId
        );

        if (productIndex === -1) {
          return reply
            .status(404)
            .send({ message: 'Product not found in this user cart' });
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
