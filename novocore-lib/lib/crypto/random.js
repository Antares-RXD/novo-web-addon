'use strict'

function Random () {
}

/* secure random bytes that sometimes throws an error due to lack of entropy */
Random.getRandomBuffer = function (size) {
  return Random.getRandomBufferNode(size)
}

Random.getRandomBufferNode = function (size) {
  var crypto = require('crypto')
  return crypto.randomBytes(size)
}


module.exports = Random
