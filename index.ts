import fastify, {FastifyInstance,FastifyRequest, FastifyReply} from 'fastify'
import { v4 as uuidv4 } from 'uuid';

const server : FastifyInstance = fastify()

type Mapish = { [k: string]: string };
type M = keyof Mapish;

const sessions: Mapish = {};

interface BodyType {
  username: string
  password: string
}

const sessionMinsTimeout = 30;

server.post('/login', async (request: FastifyRequest<{ Body: BodyType }>, reply: FastifyReply) => {
  if (request.body.username !== 'admin' || request.body.password !== 'admin') {
    reply.code(401).send('Invalid username and/or password');
  }
  const sessionId: M = uuidv4();

  // J : store the expiry too, incase someone sneakily uses an old cookie.
  sessions[sessionId] = request.body.username;

  reply.code(200).header('set-cookie', `session = ${sessionId}; Path = /; Expires=${new Date(Date.now() + (sessionMinsTimout * 1000)).toUTCString()}`)
    .send(`${sessions[sessionId]} logged in`);
});

server.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
  // delete a user from record when they manually logout also...

  reply.code(200).header('set-cookie', 'session=null')
    .send('logged out');
});

server.get('/testauth', async (request: FastifyRequest, reply: FastifyReply) => {
  if (!('cookie' in request.headers)) {
    reply.code(401).send('No auth');
  }

  const sessionId: M = (request.headers.cookie?.split(/[=;]/)[1] as string);

  // associate users with sessions...
  // that way sessions can only get as big as the number of users.
  reply.code(200).send(`Hello ${sessions[sessionId]}`);
});

server.get('/ping', async (request, reply) => {
  return 'pong\n'
})

server.listen({ port: 8080 }, (err : (Error|null), address : string) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})










