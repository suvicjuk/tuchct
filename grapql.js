const { ApolloServer} = require('apollo-server-express');

async function startApolloServer(typeDefs, resolvers, app) {
  //const httpServer = http.createServer(app);
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: error => {
      console.log(error);
      return error;
    },
    playground: true,
    introspection: true,
    //plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });
  await server.start();
  //app.use(express.static('public'));
  const enableCors = (process.env.ENABLE_CORS || 'true') == 'true';
  console.log('CORS setting:', enableCors);
  server.applyMiddleware({ app, path: '/graphql', cors: enableCors });
  console.log(`🚀 Server ready at http://localhost:${process.env.PORT}  ${server.graphqlPath} `);
}

module.exports = { startApolloServer };