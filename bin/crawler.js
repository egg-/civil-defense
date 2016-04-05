/**
 * 데이터 수집 후 DB 버퍼에 추가.
 */

var run = require('iterator-runner')
var moment = require('moment')
var async = require('async')
var winston = require('winston')
var _ = require('lodash')

run(function * () {
  try {
    var conncurent = 1
    var config = require('../conf/config.json')
    var logger = new (winston.Logger)({
      level: 'debug',
      transports: [
        new (winston.transports.Console)()
      ]
    })
    var loader = require('./crawler/loader').create(logger)
    var pouch = require('simple-pouch').create(config.pouch)
    var start = moment().utcOffset(540).startOf('month')
    var end = moment().utcOffset(540).endOf('month').add(config.duration, 'months')
    var count = 0

    var queue = async.queue(function (city, cb) {
      loader.schedules({
        code: city.code,
        start: start.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD')
      }, function (err, schedules) {
        if (err) {
          return cb(err)
        }

        count += schedules.length

        schedules.unshift({
          action: 'delete',
          city: city.code,
          start: start.unix(),
          end: end.unix()
        })

        pouch.put(cb, _.map(schedules, function (schedule) {
          return JSON.stringify(schedule)
        }))
      })
    }, conncurent)

    var cities = yield loader.cities.bind()
    queue.push(cities)

    setInterval(function () {
      if (queue.length() === 0 && queue.idle()) {
        logger.info('collect schedules complete. #' + count)

        process.exit()
      }
    }, 1000)
  } catch (err) {
    console.error(err)
  }
})
