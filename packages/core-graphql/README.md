# Ark Core - GraphQL

<p align="center">
    <img src="../../banner.png?sanitize=true" />
</p>

## Installation

```bash
yarn add @arkecosystem/core-graphql
```

## Configuration

```js
module.exports = {
  enabled: !process.env.ARK_GRAPHQL_DISABLED,
  host: process.env.ARK_GRAPHQL_HOST || '0.0.0.0',
  port: process.env.ARK_GRAPHQL_PORT || 4005,
  path: '/graphql',
  graphiql: true,
}
```

## Usage

You can play with the data using the [GraphQL Playground](https://github.com/prisma/graphql-playground), or programmatically posting querys directly to the endpoint. By default the endpoint is `http://0.0.0.0:4005/graphql`, but can be changed in your configuration.

#### Query Examples

> Get first blocks

```gql
{
  blocks(orderBy: { field: "height", direction: ASC }) {
    id
    payloadHash
    height
    numberOfTransactions
  }
}
```

> Get the list of transactions from a specific block

```gql
{
  block(id: "13114381566690093367") {
    timestamp
    generatorPublicKey
    transactions {
      id
      type
      amount
    }
  }
}
```

> Get the recipient info of each transaction

```gql
{
  block(id: "13114381566690093367") {
    generatorPublicKey
    transactions {
      id
      recipient {
        address
        balance
      }
    }
  }
}
```

## Security

If you discover a security vulnerability within this package, please send an e-mail to security@ark.io. All security vulnerabilities will be promptly addressed.

## Credits

- [Lúcio Rubens](https://github.com/luciorubeens)
- [All Contributors](../../../../contributors)

## License

[MIT](LICENSE) © [ArkEcosystem](https://ark.io)
