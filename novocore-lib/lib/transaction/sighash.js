'use strict'

var buffer = require('buffer')

var Signature = require('../crypto/signature')
var Script = require('../script')
var Output = require('./output')
var BufferReader = require('../encoding/bufferreader')
var BufferWriter = require('../encoding/bufferwriter')
var BN = require('../crypto/bn')
var Hash = require('../crypto/hash')
var ECDSA = require('../crypto/ecdsa')
var $ = require('../util/preconditions')
var Interpreter = require('../script/interpreter')
var _ = require('../util/_')

var SIGHASH_SINGLE_BUG = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
var BITS_64_ON = 'ffffffffffffffff'

// By default, we sign with sighash_forkid
var DEFAULT_SIGN_FLAGS = Interpreter.SCRIPT_ENABLE_SIGHASH_FORKID


var sighashPreimageForForkId = function (transaction, sighashType, inputNumber, subscript, satoshisBN) {
  var input = transaction.inputs[inputNumber]
  $.checkArgument(
    satoshisBN instanceof BN,
    'For ForkId=0 signatures, satoshis or complete input must be provided'
  )

  function GetPrevoutHash (tx) {
    var writer = new BufferWriter()

    _.each(tx.inputs, function (input) {
      writer.writeReverse(input.prevTxId)
      writer.writeUInt32LE(input.outputIndex)
    })

    var buf = writer.toBuffer()
    var ret = Hash.sha256sha256(buf)
    return ret
  }

  function GetSequenceHash (tx) {
    var writer = new BufferWriter()

    _.each(tx.inputs, function (input) {
      writer.writeUInt32LE(input.sequenceNumber)
    })

    var buf = writer.toBuffer()
    var ret = Hash.sha256sha256(buf)
    return ret
  }

  function GetOutputsHash (tx, n) {
    var writer = new BufferWriter()

    if (_.isUndefined(n)) {
      _.each(tx.outputs, function (output) {
        output.toBufferWriter(writer)
      })
    } else {
      tx.outputs[n].toBufferWriter(writer)
    }

    var buf = writer.toBuffer()
    var ret = Hash.sha256sha256(buf)
    return ret
  }

  var hashPrevouts = Buffer.alloc(32)
  var hashSequence = Buffer.alloc(32)
  var hashOutputs = Buffer.alloc(32)

  if (!(sighashType & Signature.SIGHASH_ANYONECANPAY)) {
    hashPrevouts = GetPrevoutHash(transaction)
  }

  if (!(sighashType & Signature.SIGHASH_ANYONECANPAY) &&
    (sighashType & 31) !== Signature.SIGHASH_SINGLE &&
    (sighashType & 31) !== Signature.SIGHASH_NONE) {
    hashSequence = GetSequenceHash(transaction)
  }

  if ((sighashType & 31) !== Signature.SIGHASH_SINGLE && (sighashType & 31) !== Signature.SIGHASH_NONE) {
    hashOutputs = GetOutputsHash(transaction)
  } else if ((sighashType & 31) === Signature.SIGHASH_SINGLE && inputNumber < transaction.outputs.length) {
    hashOutputs = GetOutputsHash(transaction, inputNumber)
  }

  var writer = new BufferWriter()

  // Version
  writer.writeInt32LE(transaction.version)

  // Input prevouts/nSequence (none/all, depending on flags)
  writer.write(hashPrevouts)
  writer.write(hashSequence)

  //  outpoint (32-byte hash + 4-byte little endian)
  writer.writeReverse(input.prevTxId)
  writer.writeUInt32LE(input.outputIndex)

  // scriptCode of the input (serialized as scripts inside CTxOuts)
  writer.writeVarintNum(subscript.toBuffer().length)
  writer.write(subscript.toBuffer())

  // value of the output spent by this input (8-byte little endian)
  writer.writeUInt64LEBN(satoshisBN)

  // nSequence of the input (4-byte little endian)
  var sequenceNumber = input.sequenceNumber
  writer.writeUInt32LE(sequenceNumber)

  // Outputs (none/one/all, depending on flags)
  writer.write(hashOutputs)

  // Locktime
  writer.writeUInt32LE(transaction.nLockTime)

  // sighashType
  writer.writeUInt32LE(sighashType >>> 0)

  var buf = writer.toBuffer()
  return buf
}


/**
 * Returns a buffer with the which is hashed with sighash that needs to be signed
 * for OP_CHECKSIG.
 *
 * @name Signing.sighash
 * @param {Transaction} transaction the transaction to sign
 * @param {number} sighashType the type of the hash
 * @param {number} inputNumber the input index for the signature
 * @param {Script} subscript the script that will be signed
 * @param {satoshisBN} input's amount 
 *
 */
var sighashPreimage = function sighashPreimage (transaction, sighashType, inputNumber, subscript, satoshisBN, flags) {
  var Transaction = require('./transaction')
  var Input = require('./input')

  if (_.isUndefined(flags)) {
    flags = DEFAULT_SIGN_FLAGS
  }

  // Copy transaction
  var txcopy = Transaction.shallowCopy(transaction)

  // Copy script
  subscript = new Script(subscript)

  if (flags & Interpreter.SCRIPT_ENABLE_REPLAY_PROTECTION) {
    // Legacy chain's value for fork id must be of the form 0xffxxxx.
    // By xoring with 0xdead, we ensure that the value will be different
    // from the original one, even if it already starts with 0xff.
    var forkValue = sighashType >> 8
    var newForkValue = 0xff0000 | (forkValue ^ 0xdead)
    sighashType = (newForkValue << 8) | (sighashType & 0xff)
  }

  return sighashPreimageForForkId(txcopy, sighashType, inputNumber, subscript, satoshisBN)
}

/**
 * Returns a buffer of length 32 bytes with the hash that needs to be signed
 * for OP_CHECKSIG.
 *
 * @name Signing.sighash
 * @param {Transaction} transaction the transaction to sign
 * @param {number} sighashType the type of the hash
 * @param {number} inputNumber the input index for the signature
 * @param {Script} subscript the script that will be signed
 * @param {satoshisBN} input's amount 
 *
 */
var sighash = function sighash (transaction, sighashType, inputNumber, subscript, satoshisBN, flags) {
  var preimage = sighashPreimage(transaction, sighashType, inputNumber, subscript, satoshisBN, flags)
  if (preimage.compare(SIGHASH_SINGLE_BUG) === 0) return preimage
  var ret = Hash.sha256sha256(preimage)
  ret = new BufferReader(ret).readReverse()
  return ret
}

/**
 * Create a signature
 *
 * @name Signing.sign
 * @param {Transaction} transaction
 * @param {PrivateKey} privateKey
 * @param {number} sighash
 * @param {number} inputIndex
 * @param {Script} subscript
 * @param {satoshisBN} input's amount
 * @return {Signature}
 */
function sign (transaction, privateKey, sighashType, inputIndex, subscript, satoshisBN, flags) {
  var hashbuf = sighash(transaction, sighashType, inputIndex, subscript, satoshisBN, flags)

  var sig = ECDSA.sign(hashbuf, privateKey, 'little').set({
    nhashtype: sighashType
  })
  return sig
}

/**
 * Verify a signature
 *
 * @name Signing.verify
 * @param {Transaction} transaction
 * @param {Signature} signature
 * @param {PublicKey} publicKey
 * @param {number} inputIndex
 * @param {Script} subscript
 * @param {satoshisBN} input's amount
 * @param {flags} verification flags
 * @return {boolean}
 */
function verify (transaction, signature, publicKey, inputIndex, subscript, satoshisBN, flags) {
  $.checkArgument(!_.isUndefined(transaction))
  $.checkArgument(!_.isUndefined(signature) && !_.isUndefined(signature.nhashtype))
  var hashbuf = sighash(transaction, signature.nhashtype, inputIndex, subscript, satoshisBN, flags)
  return ECDSA.verify(hashbuf, signature, publicKey, 'little')
}

/**
 * @namespace Signing
 */
module.exports = {
  sighashPreimage: sighashPreimage,
  sighash: sighash,
  sign: sign,
  verify: verify
}
