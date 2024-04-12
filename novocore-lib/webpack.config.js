var path = require('path')

module.exports = {
  entry: path.join(__dirname, '/index.js'),
  externals: {
    crypto: 'crypto'
  },
  output: {
    library: 'novo',
    path: path.join(__dirname, '/'),
    filename: 'novo.min.js'
  },
  mode: 'production'
}
