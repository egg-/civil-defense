/**
 * 데이터 수집 후 DB 버퍼에 추가.
 */

var run = require('iterator-runner')
var moment = require('moment')
var async = require('async')
var _ = require('lodash')
var init = require('./init')
var logger = init.logger('crawler')

run(function * () {
  try {
    var conncurent = 5
    var config = init.config()
    var loader = require('./crawler/loader').create(logger)
    var pouch = yield init.pouch.bind(null)
    var start = moment().utcOffset(540).startOf('month')
    var end = moment().utcOffset(540).endOf('month').add(config.crawler.duration, 'months')
    var count = 0

    var queue = async.queue(function (task, cb) {
      loader.schedules({
        code: task.city.code,
        start: start.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD'),
        page: task.page
      }, function (err, schedules) {
        if (err) {
          return cb(err)
        }

        count += schedules.length

        pouch.put(_.map(schedules, function (schedule) {
          return JSON.stringify(schedule)
        }), cb)
      })
    }, conncurent)

    var cities = yield loader.cities.bind()

    for (var i = 0, pageCount, city; i < cities.length; i++) {
      city = cities[i]

      pageCount = yield loader.schedulePageCount.bind(null, {
        code: city.code,
        start: start.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD')
      })

      // add clear data
      yield pouch.put.bind(null, [JSON.stringify({
        action: 'delete',
        city: city.code,
        start: start.unix(),
        end: end.unix()
      })])

      // add tasks
      for (var page = 1; page <= pageCount; page++) {
        queue.push({
          city: city,
          page: page
        })
      }
    }

    setInterval(function () {
      if (queue.length() === 0 && queue.idle()) {
        logger.info('collect schedules complete. #' + count)

        process.exit()
      }
    }, 1000)
  } catch (err) {
    logger.error(err)
  }
})
