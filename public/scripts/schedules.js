$(document).ready(function () {
  $('#schedule').fullCalendar({
    header: {
      left: 'title',
      center: '',
      right: 'prev,next,today,month,agendaWeek,agendaDay'
    },
    defaultView: 'month',
    editable: false,
    selectable: false,
    slotDuration: '01:00:00',
    timeFormat: 'H:mm',
    timezone: 'local',
    eventClick: function (event, evt, view) {
      console.log(event)
      var modal = $('#detail')
      _.each(['target', 'place', 'addr'], function (key) {
        modal.find('.' + key + ' span').text(event[key])
      })
      modal.find('h4').text(event.title)
      modal.find('p.period span').text(
        event.start.format('YYYY/MM/DD HH:mm') + ' ~ ' + event.end.format('HH:mm')
      )
      modal.find('p.addr a').attr('href', 'http://map.daum.net/?map_type=TYPE_MAP&q=' + encodeURIComponent(event.addr))
      modal.modal('show')
    },
    events: function (start, end, tz, cb) {
      $.ajax({
        url: '/api/schedules/' + start.unix() + '/' + end.unix(),
        data: {
          city: $('select[name=city]').val()
        }
      }).done(function (result) {
        cb(_.map(result.items, function (evt) {
          evt.title = evt.place
          return evt
        }))
      })
    }
  })
  $('select[name=city]').change(function (evt) {
    $('#schedule').fullCalendar('refetchEvents')
  })
})
