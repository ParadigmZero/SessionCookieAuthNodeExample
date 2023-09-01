import fastify, {FastifyInstance,FastifyRequest, FastifyReply} from 'fastify'
import {getSession, checkSession, clearSession, clearExpiredSessions, clearAllSessions} from './sessionstore';
import {log, error} from 'console';

const server : FastifyInstance = fastify()

interface LoginBody {
  username: string
  password: string
}

interface AdminSecretBody {
  secret: string
}

server.post('/login', async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
  if (request.body.username !== 'admin' || request.body.password !== 'admin') {
    reply.code(401).send('Invalid username and/or password');
  }

  const sessionText = await getSession(request.body.username);

  reply.code(200).header('set-cookie', sessionText)
    .send(`Logged in ${request.body.username}`);
});

server.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
  if(request.headers.cookie !== undefined)
  {
    clearSession(request.headers.cookie);
  }

  reply.code(200).header('set-cookie', 'token=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT')
    .send('logged out');
});

server.get('/testauth', async (request: FastifyRequest, reply: FastifyReply) => {
  if(request.headers.cookie === undefined)
  {
    reply.code(401).send('unauthorized');
  }

  if(await checkSession(request.headers.cookie as string))
  {
    reply.code(200).send(`Welcome`);
  }

  reply.code(401).send(`unauthorized`);
});

server.post('/clearexpiredsessions', async (request: FastifyRequest, reply: FastifyReply) => {
  clearExpiredSessions();
  reply.code(200).send(`Assume done.`);
});

server.post('/clearallsessions', async (request: FastifyRequest<{Body:AdminSecretBody}>, reply: FastifyReply) => {
  if (request.body.secret !== "secret") {
    reply.code(401).send('Invalid secret for admin operation. Unauthorized.')
  }
  clearAllSessions();
  reply.code(200).send(`Assume done.`);
});


server.listen({ port: 8080 }, (err : (Error|null), address : string) => {
  if (err) {
    error(err)
    process.exit(1)
  }
  log(`Server listening at ${address}`)
})










