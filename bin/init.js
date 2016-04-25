var config = require('../conf/config.json')
var _ = require('lodash')

module.exports = {
  config: function () {
    return config
  },
  logger: function (name) {
    var winston = require('winston')
    var path = require('path')
    var fs = require('fs')
    var dir = path.resolve(__dirname, '..', config.logger.path)

    if (fs.existsSync(dir) === false) {
      fs.mkdirSync(dir)
    }

    return new winston.Logger({
      transports: [
        new (winston.transports.File)({
          name: name,
          filename: dir + '/' + name + '.log',
          level: config.logger.level || 'info',
          maxsize: config.logger.maxsize || (1024 * 1024),
          maxFiles: config.logger.maxFiles || 10
        })
      ]
    })
  },
  pouch: function (cb) {
    var client = require('simple-pouch').create(config.pouch)

    client.on('ready', function () {
      cb(null, {
        put: function (items, cb) {
          client.put(cb || function () {}, items)
        },
        count: function (cb) {
          client.count(cb)
        },
        pick: function (size, cb) {
          client.pick(cb, size)
        },
        list: function (start, end, cb) {
          client.list(cb, start, end)
        }
      })
    })
  },
  db: function (opt, cb) {
    return require('mysql').createPool(_.assign(config.database, opt || {}))
  }
}
