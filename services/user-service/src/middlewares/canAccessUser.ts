import { FastifyRequest, FastifyReply } from 'fastify';

export async function canAccessUser(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const  id = request.params.id;
  const loggedUserId = request.userId;

  if (!id || !loggedUserId) {
    return reply.status(400).send({ error: 'Invalid user or route parameter' });
  }

  if (id !== loggedUserId) {
    return reply.status(403).send({ error: 'You are not allowed to access this resource' });
  }
}