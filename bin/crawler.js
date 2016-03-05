var request = require('request')
var qs = require('querystring')
var cheerio = require('cheerio')
var _ = require('lodash')
var moment = require('moment')
var run = require('iterator-runner')

var endpoint = 'http://civil.safekorea.go.kr/civil/edu/eduPlan/EduPlanDbList.do?menuId=M_NST_SVC_03_02_02'

// namespace
var loader = {}
var parser = {
  cities: function ($) {
    var cities = []
    $('#areaCd01 option').each(function () {
      var $el = $(this)
      var code = $el.attr('value')

      if (code) {
        cities.push({
          code: code,
          name: $el.text()
        })
      }
    })
    return cities
  },
  schedules: function ($) {
    var schedules = {}
    var schedule = null

    $('table.civillist tbody tr').each(function () {
      schedule = {}
      $(this).find('td').each(function (idx) {
        var $el = $(this)
        var val = _.trim($el.text())

        switch (idx) {
          case 0: // 동명
            break
          case 1: // 교육대상
            schedule.target = val
            break
          case 2: // 날짜
            schedule.date = val
            break
          case 3: // 시간
            schedule.time = val.replace(/[\s\r\n\t]/gim, '')
            break
          case 4: // 장소
            schedule.place = val
            break
        }
      })

      // 중복 제거
      var key = _.values(schedule).join('-')
      if (!schedules[key]) {
        // date, time -> timestamp
        var time = schedule.time.split('-')
        var start = [schedule.date, time[0]].join('T') + ':00+09:00'
        var end = [schedule.date, time[1]].join('T') + ':00+09:00'

        schedule.start = moment(start).format()
        schedule.end = moment(end).format()

        delete schedule.date
        delete schedule.time

        schedules[key] = schedule
      }
    })

    return _.values(schedules)
  }
}

loader.request = function (param, cb) {
  return request({
    method: 'GET',
    url: endpoint + '&' + qs.stringify(param)
  }, function (err, res, body) {
    if (err) {
      return cb(err)
    }

    cb(err, err ? null : cheerio.load(body))
  })
}

loader.cities = function (cb) {
  return loader.request({}, function (err, $) {
    cb(err, err ? [] : parser.cities($))
  })
}

/**
 * @param {object} param
 * @param {number} param.code
 * @param {number} param.start
 * @param {number} param.end
 */
loader.schedules = function (param, cb) {
  // &areaCd01=6110000&areaCd02=&areaCd03=&holiDaySe=&strDate=2016-03-05&endDate=2016-04-05&eduTgtSeCd=&pageIndex=2
  return loader.request({
    areaCd01: param.code,
    strDate: param.start,
    endDate: param.end
  }, function (err, $) {
    cb(err, err ? [] : parser.schedules($))
  })
}

run(function * () {
  try {
    // var cities = yield loader.cities.bind()
    var schedules = yield loader.schedules.bind(null, {
      code: '6110000', // cities[0].code,
      start: '2016-03-01',
      end: '2016-03-05'
    })
    console.log(schedules)
  } catch (err) {
    console.error(err)
  }
})
