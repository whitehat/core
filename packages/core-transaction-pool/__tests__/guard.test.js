const { slots } = require('@arkecosystem/crypto')
const app = require('./__support__/setup')

let guard

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(() => {
  const poolInterface = new (require('../lib/interface'))({})
  guard = new (require('../lib/guard'))(poolInterface)
})

describe('Transaction Guard', () => {
  it('should be an object', () => {
    expect(guard).toBeObject()
  })

  describe('validate', () => {
    it('should be a function', () => {
      expect(guard.validate).toBeFunction()
    })
  })

  describe('invalidate', () => {
    it('should be a function', () => {
      expect(guard.invalidate).toBeFunction()
    })

    it('should invalidate transactions', () => {
      guard.invalidate([{ id: 1 }, { id: 2 }], 'Invalid.')

      expect(guard.invalid).toHaveLength(2)
      expect(guard.invalid).toEqual([{ id: 1 }, { id: 2 }])
      expect(guard.errors).toBeObject()
      expect(Object.keys(guard.errors)).toHaveLength(2)
      expect(guard.errors['1']).toEqual([
        { message: 'Invalid.', type: 'ERR_INVALID' },
      ])
    })
  })

  describe('getIds', () => {
    it('should be a function', () => {
      expect(guard.getIds).toBeFunction()
    })

    it('should be ok', () => {
      guard.transactions = [{ id: 1 }]
      guard.accept = [{ id: 2 }]
      guard.excess = [{ id: 3 }]
      guard.invalid = [{ id: 4 }]
      guard.broadcast = [{ id: 5 }]

      expect(guard.getIds()).toEqual({
        transactions: [1],
        accept: [2],
        excess: [3],
        invalid: [4],
        broadcast: [5],
      })
    })

    it('should be ok using a type', () => {
      guard.excess = [{ id: 3 }]

      expect(guard.getIds('excess')).toEqual([3])
    })
  })

  describe('getTransactions', () => {
    it('should be a function', () => {
      expect(guard.getTransactions).toBeFunction()
    })

    it('should be ok', () => {
      guard.transactions = [{ id: 1 }]
      guard.accept = [{ id: 2 }]
      guard.excess = [{ id: 3 }]
      guard.invalid = [{ id: 4 }]
      guard.broadcast = [{ id: 5 }]

      expect(guard.getTransactions()).toEqual({
        transactions: [{ id: 1 }],
        accept: [{ id: 2 }],
        excess: [{ id: 3 }],
        invalid: [{ id: 4 }],
        broadcast: [{ id: 5 }],
      })
    })

    it('should be ok using a type', () => {
      guard.excess = [{ id: 3 }]

      expect(guard.getTransactions('excess')).toEqual([{ id: 3 }])
    })
  })

  describe('toJson', () => {
    it('should be a function', () => {
      expect(guard.toJson).toBeFunction()
    })

    it('should be ok', () => {
      guard.transactions = [{ id: 1 }]
      guard.accept = [{ id: 2 }]
      guard.excess = [{ id: 3 }]
      guard.broadcast = [{ id: 5 }]

      expect(guard.toJson()).toEqual({
        data: {
          accept: [2],
          excess: [3],
          invalid: [],
          broadcast: [5],
        },
        errors: null,
      })
    })

    it('should be ok with error', () => {
      guard.transactions = [{ id: 1 }]
      guard.accept = [{ id: 2 }]
      guard.excess = [{ id: 3 }]
      guard.invalidate({ id: 4 }, 'Invalid.')
      guard.broadcast = [{ id: 5 }]

      expect(guard.toJson()).toEqual({
        data: {
          accept: [2],
          excess: [3],
          invalid: [4],
          broadcast: [5],
        },
        errors: { 4: [{ message: 'Invalid.', type: 'ERR_INVALID' }] },
      })
    })
  })

  describe('has', () => {
    it('should be a function', () => {
      expect(guard.has).toBeFunction()
    })

    it('should be ok', () => {
      guard.excess = [{ id: 1 }, { id: 2 }]

      expect(guard.has('excess', 2)).toBeTrue()
    })

    it('should not be ok', () => {
      guard.excess = [{ id: 1 }, { id: 2 }]

      expect(guard.has('excess', 1)).toBeFalse()
    })
  })

  describe('hasAtLeast', () => {
    it('should be a function', () => {
      expect(guard.hasAtLeast).toBeFunction()
    })

    it('should be ok', () => {
      guard.excess = [{ id: 1 }, { id: 2 }]

      expect(guard.hasAtLeast('excess', 2)).toBeTrue()
    })

    it('should not be ok', () => {
      guard.excess = [{ id: 1 }]

      expect(guard.hasAtLeast('excess', 2)).toBeFalse()
    })
  })

  describe('hasAny', () => {
    it('should be a function', () => {
      expect(guard.hasAny).toBeFunction()
    })

    it('should be ok', () => {
      guard.excess = [{ id: 1 }]

      expect(guard.hasAny('excess')).toBeTrue()
    })

    it('should not be ok', () => {
      guard.excess = []

      expect(guard.hasAny('excess')).toBeFalse()
    })
  })

  describe('__transformAndFilterTransactions', () => {
    it('should be a function', () => {
      expect(guard.__transformAndFilterTransactions).toBeFunction()
    })

    it('should reject duplicate transactions', () => {
      guard.pool.transactionExists = jest.fn(() => true)
      guard.pool.pingTransaction = jest.fn(() => true)

      const tx = { id: 1 }
      guard.__transformAndFilterTransactions([tx])

      expect(guard.errors['1']).toEqual([
        {
          message: 'Duplicate transaction 1',
          type: 'ERR_DUPLICATE',
        },
      ])
    })

    it('should reject blocked senders', () => {
      guard.pool.transactionExists = jest.fn(() => false)
      guard.pool.isSenderBlocked = jest.fn(() => true)

      const tx = { id: 1, senderPublicKey: 'affe' }
      guard.__transformAndFilterTransactions([tx])

      expect(guard.errors['1']).toEqual([
        {
          message: 'Transaction 1 rejected. Sender affe is blocked.',
          type: 'ERR_SENDER_BLOCKED',
        },
      ])
    })

    it('should reject transactions from the future', () => {
      guard.pool.transactionExists = jest.fn(() => false)
      const getTime = slots.getTime
      slots.getTime = jest.fn(() => 47157042)

      const tx = {
        id: 1,
        senderPublicKey: 'affe',
        timestamp: slots.getTime() + 1,
      }
      guard.__transformAndFilterTransactions([tx])

      expect(guard.errors['1']).toEqual([
        {
          message: 'Transaction 1 is from the future (47157043 > 47157042)',
          type: 'ERR_FROM_FUTURE',
        },
      ])

      slots.getTime = getTime
    })
  })

  describe('__determineValidTransactions', () => {
    it('should be a function', () => {
      expect(guard.__determineValidTransactions).toBeFunction()
    })
  })

  describe('__determineExcessTransactions', () => {
    it('should be a function', () => {
      expect(guard.__determineExcessTransactions).toBeFunction()
    })
  })

  describe('__determineFeeMatchingTransactions', () => {
    it('should be a function', () => {
      expect(guard.__determineFeeMatchingTransactions).toBeFunction()
    })
  })

  describe('__pushError', () => {
    it('should be a function', () => {
      expect(guard.__pushError).toBeFunction()
    })

    it('should have error for transaction', () => {
      expect(guard.errors).toBeEmpty()

      guard.__pushError({ id: 1 }, 'ERR_INVALID', 'Invalid.')

      expect(guard.errors).toBeObject()
      expect(guard.errors['1']).toBeArray()
      expect(guard.errors['1']).toHaveLength(1)
      expect(guard.errors['1']).toEqual([
        { message: 'Invalid.', type: 'ERR_INVALID' },
      ])
      expect(guard.invalid).toHaveLength(1)
      expect(guard.invalid).toEqual([{ id: 1 }])
    })

    it('should have multiple errors for transaction', () => {
      expect(guard.errors).toBeEmpty()

      guard.__pushError({ id: 1 }, 'ERR_INVALID', 'Invalid 1.')
      guard.__pushError({ id: 1 }, 'ERR_INVALID', 'Invalid 2.')

      expect(guard.errors).toBeObject()
      expect(guard.errors['1']).toBeArray()
      expect(guard.errors['1']).toHaveLength(2)
      expect(guard.errors['1']).toEqual([
        { message: 'Invalid 1.', type: 'ERR_INVALID' },
        { message: 'Invalid 2.', type: 'ERR_INVALID' },
      ])
      expect(guard.invalid).toHaveLength(1)
      expect(guard.invalid).toEqual([{ id: 1 }])
    })
  })

  describe('__reset', () => {
    it('should be a function', () => {
      expect(guard.__reset).toBeFunction()
    })

    it('should be ok', () => {
      guard.transactions = [{ id: 1 }]
      guard.accept = [{ id: 2 }]
      guard.excess = [{ id: 3 }]
      guard.invalid = [{ id: 4 }]
      guard.broadcast = [{ id: 5 }]

      expect(guard.transactions).not.toBeEmpty()
      expect(guard.accept).not.toBeEmpty()
      expect(guard.excess).not.toBeEmpty()
      expect(guard.invalid).not.toBeEmpty()
      expect(guard.broadcast).not.toBeEmpty()

      guard.__reset()

      expect(guard.transactions).toBeEmpty()
      expect(guard.accept).toBeEmpty()
      expect(guard.excess).toBeEmpty()
      expect(guard.invalid).toBeEmpty()
      expect(guard.broadcast).toBeEmpty()
    })
  })
})
