const { client } = require('@arkecosystem/crypto')
const pluralize = require('pluralize')
const sample = require('lodash/sample')
const { logger } = require('../utils')
const Command = require('./command')
const Transfer = require('./transfer')

module.exports = class VoteCommand extends Command {
  /**
   * Run vote command.
   * @return {void}
   */
  async run() {
    const wallets = this.generateWallets()

    const transfer = await Transfer.init(this.options)
    await transfer.run({
      wallets,
      amount: 2,
      skipTesting: true,
    })

    let delegate = this.options.delegate
    if (!delegate) {
      try {
        delegate = sample(await this.getDelegates()).publicKey
      } catch (error) {
        logger.error(error)
        return
      }
    }

    const voters = await this.getVoters(delegate)
    logger.info(`Sending ${this.options.number} vote ${
      pluralize('transaction', this.options.number, true)
    }`)

    const transactions = []
    wallets.forEach((wallet, i) => {
      const transaction = client
        .getBuilder()
        .vote()
        .fee(Command.parseFee(this.options.voteFee))
        .votesAsset([`+${delegate}`])
        .network(this.config.network.version)
        .sign(wallet.passphrase)
        .secondSign(this.config.secondPassphrase)
        .build()

      transactions.push(transaction)

      logger.info(
        `${i} ==> ${transaction.id}, ${
          wallet.address
        } (fee: ${Command.__arktoshiToArk(transaction.fee)})`,
      )
    })

    if (this.options.copy) {
      this.copyToClipboard(transactions)
      return
    }

    const expectedVoterCount = voters.length + wallets.length
    if (!this.options.skipValidation) {
      logger.info(`Expected end voters: ${expectedVoterCount}`)
    }

    try {
      await this.sendTransactions(
        transactions,
        'vote',
        !this.options.skipValidation,
      )

      if (this.options.skipValidation) {
        return
      }

      const voterCount = (await this.getVoters(delegate)).length

      logger.info(
        `All transactions have been sent! Total voters: ${voterCount}`,
      )

      if (voterCount !== expectedVoterCount) {
        logger.error(
          `Delegate voter count incorrect. '${voterCount}' but should be '${expectedVoterCount}'`,
        )
      }
    } catch (error) {
      logger.error(
        `There was a problem sending transactions: ${
          error.response ? error.response.data.message : error
        }`,
      )
    }
  }
}
