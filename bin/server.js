var http = require('http')
var init = require('./init')
var app = require('../app/app')
var api = require('../app/api')
var config = init.config()

var port = config.port

api.client.db = init.db()

process.on('uncaughtException', function (err) {
  console.error(err.stack)
})

http.createServer(app).listen(port, function () {
  console.info('start server. (port: ' + port + ')')
})
