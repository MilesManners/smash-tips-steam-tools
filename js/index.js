const {ipcRenderer} = require('electron')
const pug = require('pug')
window.Tether = {}
require('bootstrap')

ipcRenderer.on('get-matches-reply', (event, response) => {
  let matches = $('.slider-content')
  matches.empty()

  if (response.error) {
    matches.append(response.message)
    return
  }

  let currentRound = ''
  let currentRow = ''
  for(let i in response) {
    if(currentRound !== `${response[i].roundLeft} ${response[i].roundRight}`) {
      matches.append(currentRow)
      currentRound = `${response[i].roundLeft} ${response[i].roundRight}`
      matches.append(`<h2>${response[i].roundLeft} ${response[i].roundRight}</h2>`)
      currentRow = $('<div class="row"></div>')
    }

    currentRow.append(pug.render(
      `.col-xl-3.col-lg-4.col-md-6.matchBox
        .card.card-inverse.card-outline-secondary.match
          .card-block
            .roundLabel(hidden="hidden") ${response[i].roundLeft} ${response[i].roundRight}
            .player1 ${response[i].p1Name}
            .player2 ${response[i].p2Name}`))
  }

  matches.append(currentRow)
})

$('.slider').on('click', '.match', function() {
  let p1name = $(this).find('.player1').text()
  let p2name = $(this).find('.player2').text()

  $('#p1name').val(p1name)
  $('#p2name').val(p2name)

  let round =  $(this).find('.roundLabel').text().split(' ')
  $('#round-left').val(round.shift())
  $('#round-right').val(round.join(' '))

  $('.slider').removeClass('is-visible')
})

// Click slider button to open slider
$('#match-selector').click(e => {
  ipcRenderer.send('get-matches')

  $('.slider').addClass('is-visible')
})

// Click outside slider to close it
$('body').click(e => {
  if ($(e.target).hasClass('slider'))
    $('.slider').removeClass('is-visible')
})

// Click reset button to reset form
$('#reset').click(e => $('#form').reset())

// Click swap button to swap names
$('#swap').click(() => {
  let temp = $('#p1name').val()
  $('#p1name').val($('#p2name').val())
  $('#p2name').val(temp)
})

// Click update to update the text files
$('#update')
  .click((e) => {
    e.preventDefault()

    let match = {
      p1Name: $('#p1name').val(),
      p2Name: $('#p2name').val(),
      roundLeft: $('#round-left').val(),
      roundRight: $('#round-right').val(),
      p1Score: $('#p1score').val(),
      p2Score: $('#p2score').val()
    }

    ipcRenderer.send('save-form', match)
  })

// Click update to update the text files
$('#settings')
  .click((e) => {
    e.preventDefault()

    ipcRenderer.send('show-settings')
  })