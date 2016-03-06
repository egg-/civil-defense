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
    var start = moment().startOf('month')
    var end = moment().endOf('month').add(config.duration, 'months')
    var count = 0

    var queue = async.queue(function (param, cb) {
      loader.schedules({
        code: param.city.code,
        start: param.start,
        end: param.end
      }, function (err, schedules) {
        if (err) {
          return cb(err)
        }

        count += schedules.length

        pouch.put(cb, _.map(schedules, function (schedule) {
          return JSON.stringify(schedule)
        }))
      })
    }, conncurent)

    var cities = yield loader.cities.bind()
    _.each(cities, function (city) {
      queue.push({
        city: city,
        start: start.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD')
      })
    })

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
