import auth from './auth';
import logout from './logout';
import register from './register';

export default fastify => {
    fastify.get('/users/auth', auth(fastify));
    fastify.get('/:language/users/auth', auth(fastify));
    fastify.get('/users/register', register(fastify));
    fastify.get('/:language/users/register', register(fastify));
    fastify.get('/users/logout', logout(fastify));
    fastify.get('/:language/users/logout', logout(fastify));
};
