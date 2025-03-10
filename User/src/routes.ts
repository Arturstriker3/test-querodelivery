import { FastifyTypedIntance } from './types/fastify-types';
import { z } from 'zod';
import { userRepository } from './repositories/UserRepository';
import { hash, compare } from 'bcrypt';
import { User } from './entities/User';
import jwt from 'jsonwebtoken';
import { envConfig } from './helpers/envs';
import axios from 'axios';

export async function routes(app: FastifyTypedIntance): Promise<void> {
  const productServiceUrl = envConfig.getProductServiceUrl();

  app.post(
    '/register',
    {
      schema: {
        tags: ['authentication'],
        description: 'Create a new user',
        body: z.object({
          name: z.string().min(1, 'Name is required'),
          email: z.string().email('Invalid email format'),
          password: z.string().min(6, 'Password must be at least 6 characters'),
        }),
        response: {
          201: z.object({
            uid: z.string(),
            name: z.string(),
            email: z.string(),
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
      const { name, email, password } = request.body;

      try {
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
          return reply.status(400).send({ message: 'Email is already in use' });
        }

        const hashedPassword = await hash(password, 10);

        const newUser = new User();
        newUser.name = name;
        newUser.email = email;
        newUser.password = hashedPassword;

        const savedUser = await userRepository.save(newUser);

        const cartToken = jwt.sign({ id: savedUser.id }, process.env.JWT_SECRET ?? '', {
          expiresIn: '5m',
        });

        const cartResponse = await axios.post(
          `${productServiceUrl}/carts/${savedUser.id}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${cartToken}`,
            },
          }
        );

        if (cartResponse.status !== 201) {
          return reply.status(500).send({ message: 'Error creating cart' });
        }

        return reply.status(201).send({
          uid: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          cart: cartResponse.data.cart,
        });
      } catch (error) {
        console.error(error);

        if (axios.isAxiosError(error) && error.response) {
          return reply.status(error.response.status).send({
            message: error.response.data.message || 'Error communicating with cart service',
          });
        }

        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );

  app.post(
    '/login',
    {
      schema: {
        tags: ['authentication'],
        description: 'Login with email and password',
        body: z.object({
          email: z.string().email('Invalid email format'),
          password: z.string().min(6, 'Password must be at least 6 characters'),
        }),
        response: {
          200: z.object({
            uid: z.string(),
            name: z.string(),
            email: z.string(),
            token: z.string(),
          },
        ),
          400: z.object({
            message: z.string(),
          }),
          401: z.object({
            message: z.string(),
          }),
          500: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      try {
        const user = await userRepository.findOne({
          where: { email },
        });

        if (!user) {
          return reply.status(401).send({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await compare(password, user.password);

        if (!isPasswordValid) {
          return reply.status(401).send({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET ?? "", {
          expiresIn: "1d",
        });

        return reply.status(200).send({
          uid: user.id,
          name: user.name,
          email: user.email,
          token,
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );

  app.get(
    '/users/:userUid',
    {
      preValidation: [app.authenticate],
      schema: {
        tags: ['users'],
        description: 'Get user details by userUid',
        params: z.object({
          userUid: z.string(),
        }),
        response: {
          200: z.object({
            uid: z.string(),
            name: z.string(),
            email: z.string(),
          }),
          400: z.object({
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
      const { userUid } = request.params;
  
      try {
        const user = await userRepository.findOne({
          where: { id: userUid },
        });
  
        if (!user) {
          return reply.status(404).send({ message: 'User not found' });
        }
  
        const { password, ...userData } = user;
        const response = { uid: user.id, ...userData };
  
        return reply.status(200).send(response);
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
}