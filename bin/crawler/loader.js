var request = require('request')
var moment = require('moment')
var _ = require('lodash')

// parser
var parser = {
  cities: function (res) {
    return _.map(res.List, function (o) {
      return {
        code: o.orgCd,
        name: o.orgNm
      }
    })
  },
  schedules: function (code, res) {
    return _.map(res.eduShcList, function (o) {
      return {
        city: code,
        target: o.edcTgtSeNm,
        start: moment([o.edcDe, o.edcBeginTime].join(' '), 'YYYYMMDD HHmm').utcOffset(540).unix(),
        end: moment([o.edcDe, o.edcEndTime].join(' '), 'YYYYMMDD HHmm').utcOffset(540).unix(),
        place: o.edcntrNm,
        addr: o.edcntrAdres
      }
    })
  }
}

function loader (logger) {
  /**
   * load data
   * @param {object} param
   * @param {function} cb
   */
  var _requestAPI = function (endpoint, param, cb) {
    logger.debug('request', {
      url: endpoint,
      param: param
    })
    console.log(param)
    return request({
      method: 'POST',
      url: 'http://civil.safekorea.go.kr' + endpoint,
      body: param,
      json: true
    }, function (err, res, body) {
      if (err) {
        return cb(err)
      }

      cb(err, err ? null : body)
    })
  }

  return {
    /**
    * load cities
    * @param  {function} cb
    */
    cities: function (cb) {
      logger.info('request cities.')

      return _requestAPI('/idsiSFK/sfk/ca/cac/are2/area2List.do', {
        reqInfo: {
          upperOrgCd: '0',
          searchGb: ''
        }
      }, function (err, result) {
        cb(err, err ? [] : parser.cities(result))
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

      return _requestAPI('/idsiSFK/sfk/cs/cvi/edtr/selectEduSchList.do', {
        selectList: {
          pageIndex: param.page,
          pageSize: 100,
          pageUnit: 100,
          q_area_cd_1: param.code,
          searchDate1: param.start.format('YYYYMMDD'),
          searchDate2: param.end.format('YYYYMMDD')
        }
      }, function (err, res) {
        cb(err, err ? [] : parser.schedules(param.code, res))
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
      logger.info('request schedulePageCount', param)

      return _requestAPI('/idsiSFK/sfk/cs/cvi/edtr/selectEduSchList.do', {
        selectList: {
          pageIndex: 1,
          pageSize: 100,
          pageUnit: 100,
          q_area_cd_1: param.code,
          searchDate1: param.start.format('YYYYMMDD'),
          searchDate2: param.end.format('YYYYMMDD')
        }
      }, function (err, res) {
        cb(err, err ? 0 : res.rtnResult.pageSize)
      })
    }
  }
}

module.exports = {
  create: function (logger) {
    return loader(logger)
  }
}
