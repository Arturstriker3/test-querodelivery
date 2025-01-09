import { FastifyTypedIntance } from './types/fastify-types';
import { z } from 'zod';
import { userRepository } from './repositories/UserRepository';
import { hash } from 'bcrypt';
import { User } from './entities/User';

export async function routes(app: FastifyTypedIntance): Promise<void> {
  app.post(
    '/register',
    {
      schema: {
        tags: ['users'],
        description: 'Create a new user',
        body: z.object({
          name: z.string().min(1, 'Name is required'),
          email: z.string().email('Invalid email format'),
          password: z.string().min(6, 'Password must be at least 6 characters'),
        }),
        response: {
          201: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
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

        const existingUser = await userRepository.findOne({
          where: { email },
        });

        if (existingUser) {
          return reply.status(400).send({ message: 'Email is already in use' });
        }

        const hashedPassword = await hash(password, 10);

        const newUser = new User();
        newUser.name = name;
        newUser.email = email;
        newUser.password = hashedPassword;

        const savedUser = await userRepository.save(newUser);

        return reply.status(201).send({
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
        });
      } catch (error) {
        console.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
}