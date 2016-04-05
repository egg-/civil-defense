module.exports = (grunt) ->
  # load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks)

  # load package config
  pkg = grunt.file.readJSON('package.json')

  taskConfig =

    # nodemon
    nodemon:
      options:
        args: ['development']
        nodeArgs: ['--debug=5858']
        watch: [
          'app'
          'bin'
        ]
        legacyWatch: true

      # nodemon.crawler
      crawler:
        script: 'bin/crawler.js'
        options:
          callback: (nodemon) ->
            nodemon.on 'log', (evt) ->
              console.log evt.colour

            nodemon.on 'restart', () ->
              console.log 'restart crawler.'

      # nodemon.update
      update:
        script: 'bin/update.js'
        options:
          callback: (nodemon) ->
            nodemon.on 'log', (evt) ->
              console.log evt.colour

            nodemon.on 'restart', () ->
              console.log 'restart update.'


  grunt.initConfig taskConfig

  # register task
  grunt.registerTask 'crawler', () ->
    grunt.task.run [
      'nodemon:crawler'
    ]

  grunt.registerTask 'update', () ->
    grunt.task.run [
      'nodemon:update'
    ]
