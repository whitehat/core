const { createServer, mountServer } = require('@arkecosystem/core-http-utils')

/**
 * Create a new hapi.js server.
 * @param  {Object} config
 * @return {Hapi.Server}
 */
module.exports = async (p2p, config) => {
  const server = await createServer({
    host: config.host,
    port: config.port,
  })

  await server.register({
    plugin: require('hapi-rate-limit'),
    options: config.rateLimit,
  })

  await server.register({
    plugin: require('./plugins/validate-headers'),
  })

  await server.register({
    plugin: require('./plugins/accept-request'),
    options: {
      whitelist: config.whitelist,
    },
  })

  await server.register({
    plugin: require('./plugins/set-headers'),
  })

  await server.register({
    plugin: require('./plugins/blockchain-ready'),
    options: {
      routes: [
        '/peer/height',
        '/peer/blocks/common',
        '/peer/status',
        '/peer/blocks',
        '/peer/transactions',
        '/internal/round',
        '/internal/blocks',
        '/internal/forgingTransactions',
        '/internal/networkState',
        '/internal/syncCheck',
        '/internal/usernames',
        '/remote/blockchain/{event}',
      ],
    },
  })

  // await server.register({
  //   plugin: require('./plugins/transaction-pool-ready'),
  //   options: {
  //     routes: [
  //       '/peer/transactions'
  //     ]
  //   }
  // })

  await server.register({
    plugin: require('./versions/config'),
    routes: { prefix: '/config' },
  })

  // ARK_V2 process variable enables V2-specific behavior
  // Here defining which version is behind /peer endpoint

  if (process.env.ARK_V2) {
    await server.register({
      plugin: require('./versions/peer'),
      routes: { prefix: '/peer' },
    })
  } else {
    await server.register({
      plugin: require('./versions/1'),
      routes: { prefix: '/peer' },
    })
  }

  await server.register({
    plugin: require('./versions/internal'),
    routes: { prefix: '/internal' },
  })

  if (config.remoteInterface) {
    await server.register({
      plugin: require('./versions/remote'),
      routes: { prefix: '/remote' },
    })
  }

  return mountServer('P2P API', server)
}
