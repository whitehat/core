const generateTransactions = require('./transaction')
const { TRANSACTION_TYPES } = require('../../../../crypto/lib/constants')

module.exports = (network, passphrase, quantity = 10, getStruct = false, fee) =>
  generateTransactions(
    network,
    TRANSACTION_TYPES.VOTE,
    passphrase,
    undefined,
    undefined,
    quantity,
    getStruct,
    fee,
  )
