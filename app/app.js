var express = require('express')
var bodyParser = require('body-parser')
var path = require('path')

var app = express()

var routes = {
  '/api': require('./routes/api'),
  '/*': require('./routes/index')
}

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.disable('x-powered-by')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, '../public')))

for (var k in routes) {
  app.use(k, routes[k])
}

// 404 error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

module.exports = app
