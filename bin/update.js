/**
 * 수집된 데이터 DB에 추가.
 */

var run = require('iterator-runner')
var mysql = require('mysql')
var init = require('./init')
var logger = init.logger('update')

var sql = function (item) {
  if (item.action === 'delete') {
    return mysql.format('DELETE FROM schedules WHERE city = ? AND start >= ? AND end <= ?', [
      item.city,
      item.start,
      item.end
    ])
  }
  return mysql.format('INSERT INTO schedules SET ?', item)
}

run(function *() {
  try {
    var pouch = yield init.pouch.bind(null)
    var client = yield init.mysql.bind(null, {
      multipleStatements: true
    })
    client.on('error', logger.error)

    var update = function () {
      pouch.pick(100, function (err, items) {
        if (err) throw err
        if (items.length === 0) {
          client.end()
          process.exit()
          return true
        }

        var sqls = []
        for (var i = 0; i < items.length; i++) {
          sqls.push(sql(JSON.parse(items[i])))
        }

        client.query(sqls.join(';\n') + ';', function (err, result) {
          if (err) {
            logger.error('update', sqls.join('\n'))
            throw err
          }

          if (result instanceof Array === false) {
            result = [result]
          }

          logger.debug('update complete.', result.length)

          setTimeout(update, 100)
        })
      })
    }

    update()
  } catch (err) {
    console.error(err)
  }
})
