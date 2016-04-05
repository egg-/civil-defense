var request = require('request')
var qs = require('querystring')
var moment = require('moment')
var _ = require('lodash')
var cheerio = require('cheerio')

var endpoint = 'http://civil.safekorea.go.kr/civil/edu/eduPlan/EduPlanDbList.do?menuId=M_NST_SVC_03_02_02'

// parser
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
  schedulePageCount: function ($) {
    var anchors = $('div.board_nav a')
    var anchor = $(anchors[anchors.length - 1])
    var url = anchor.attr('href')
    var matches = /.*pageIndex=(\d+)/.exec(url)
    return matches ? parseInt(matches[1], 10) : 0
  },
  schedules: function (city, $) {
    var schedules = {}
    var schedule = null

    $($('table.civillist')[0]).find('tbody tr').each(function () {
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
          // case 4: // 장소
          //   schedule.place = val
          // break
          case 6: // 장소
            var anchor = $el.find('a')
            var addr = $(anchor).attr('href')
            var regexp = /.*\('(.*)\',\s*\'(.*)\'\)/
            var matches = regexp.exec(addr)
            if (matches) {
              schedule.place = matches[1]
              schedule.addr = matches[2]
            }
            break
        }
      })

      // 중복 제거
      var key = _.values(schedule).join('-')
      if (!schedules[key] && schedule.time) {
        // date, time -> timestamp
        var time = schedule.time.split('-')
        var start = [schedule.date, time[0]].join('T') + ':00+09:00'
        var end = [schedule.date, time[1]].join('T') + ':00+09:00'

        schedule.city = city
        schedule.start = moment(start).unix()
        schedule.end = moment(end).unix()

        delete schedule.date
        delete schedule.time

        schedules[key] = schedule
      }
    })

    return _.values(schedules)
  }
}

function loader (logger) {
  /**
  * load data
  * @param  {object} param
  * @param  {function} cb
  */
  var _request = function (param, cb) {
    logger.debug('request', {
      url: endpoint + '&' + qs.stringify(param)
    })

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

  return {
    /**
    * load cities
    * @param  {function} cb
    */
    cities: function (cb) {
      logger.info('request cities.')

      return _request({}, function (err, $) {
        cb(err, err ? [] : parser.cities($))
      })
    },

    /**
    * load schedules
    * @param {object} param
    * @param {number} param.code
    * @param {number} param.start
    * @param {number} param.end
    * @param {number} param.page
    */
    schedules: function (param, cb) {
      // &areaCd01=6110000&areaCd02=&areaCd03=&holiDaySe=&strDate=2016-03-05&endDate=2016-04-05&eduTgtSeCd=&pageIndex=2
      logger.info('request schedules', param)

      return _request({
        areaCd01: param.code,
        strDate: param.start,
        endDate: param.end,
        pageIndex: param.page
      }, function (err, $) {
        cb(err, err ? [] : parser.schedules(param.code, $))
      })
    },

    /**
     * load schedule page count
     * @param {object} param
     * @param {number} param.code
     * @param {number} param.start
     * @param {number} param.end
     */
    schedulePageCount: function (param, cb) {
      // &areaCd01=6110000&areaCd02=&areaCd03=&holiDaySe=&strDate=2016-03-05&endDate=2016-04-05&eduTgtSeCd=&pageIndex=2
      logger.info('request schedulePageCount', param)

      return _request({
        areaCd01: param.code,
        strDate: param.start,
        endDate: param.end
      }, function (err, $) {
        cb(err, err ? 0 : parser.schedulePageCount($))
      })
    }
  }
}

module.exports = {
  create: function (logger) {
    return loader(logger)
  }
}
