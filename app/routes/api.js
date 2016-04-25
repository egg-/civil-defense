'use strict'

var router = require('express').Router()
var _ = require('lodash')
var moment = require('moment')
var api = require('../api')

router.route('/schedules/:start([0-9]+)/:end([0-9]+)')
  .get(
    function (req, res) {
      try {
        var where = ['start >= ?', 'end <= ?']
        var value = [req.params.start, req.params.end]

        if (req.query.city) {
          where.push('city = ?')
          value.push(req.query.city)
        }

        api.client.db.getConnection(function (err, conn) {
          if (err) {
            throw err
          }

          conn.query([
            'SELECT * FROM schedules WHERE',
            where.join(' AND '),
            'ORDER BY start ASC'
          ].join(' '), value, function (err, rows) {
            conn.release()

            if (err) {
              throw err
            }

            res.json({
              items: _.map(rows, function (item) {
                return {
                  id: item.no,
                  start: moment.unix(item.start).format(),
                  end: moment.unix(item.end).format(),
                  target: item.target,
                  place: item.place,
                  addr: item.addr
                }
              })
            })
          })
        })
      } catch (err) {
        res.status(500).json(err)
      }
    }
)

module.exports = router
