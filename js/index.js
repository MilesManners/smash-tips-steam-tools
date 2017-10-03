const { ipcRenderer } = require('electron')
const pug = require('pug')
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
  for (let i in response) {
    if (currentRound !== `${response[i].roundLeft} ${response[i].roundRight}`) {
      matches.append(currentRow)
      currentRound = `${response[i].roundLeft} ${response[i].roundRight}`
      matches.append(`<h2>${response[i].roundLeft} ${response[i].roundRight}</h2>`)
      currentRow = $('<div class="row"></div>')
    }

    currentRow.append(pug.render(
      `.col-xl-3.col-lg-4.col-md-6.matchBox
        .card.bg-dark.text-white.card-outline-secondary.match(data-id=${response[i].id})
          .card-block
            .roundLabel(hidden="hidden") ${response[i].roundLeft} ${response[i].roundRight}
            .player1(data-id=${response[i].p1Id}) ${response[i].p1Name}
            .player2(data-id=${response[i].p2Id}) ${response[i].p2Name}`))
  }

  matches.append(currentRow)
})

ipcRenderer.on('increaseP1', event => {
  $('#p1score').val(parseInt($('#p1score').val()) + 1)
})

ipcRenderer.on('increaseP2', event => {
  $('#p2score').val(parseInt($('#p2score').val()) + 1)
})

$('.slider').on('click', '.match', function () {
  let match = $(this).data('id')

  let p1name = $(this).find('.player1').text()
  let p2name = $(this).find('.player2').text()

  let p1Id = $(this).find('.player1').data('id')
  let p2Id = $(this).find('.player2').data('id')

  $('#form').data('id', match)

  $('#p1name').val(p1name)
  $('#p2name').val(p2name)

  $('#p1name').data('id', p1Id)
  $('#p2name').data('id', p2Id)

  let round = $(this).find('.roundLabel').text().split(' ')
  $('#round-left').val(round.shift())
  $('#round-right').val(round.join(' '))

  $('.slider').removeClass('is-visible')
})

// Prevent form submition on enter press
$('#form').on('keyup keypress', e => {
  if ((e.keyCode || e.which) === 13) {
    e.preventDefault()
    return false
  }
})

// Click slider button to open slider
$('#match-selector').click(e => {
  ipcRenderer.send('get-matches')

  $('.slider').addClass('is-visible')
})

// Click outside slider to close it
$('body').click(e => {
  if ($(e.target).hasClass('slider')) {
    $('.slider').removeClass('is-visible')
  }
})

// Click submit results to update Challonge match
$('#challonge').click(e => {
  e.preventDefault()

  if ($('#p1score').val() || $('#p2score').val()) {
    let match = {
      id: $('#form').data('id'),
      swapped: $('#form').data('swapped'),
      p1Name: $('#p1name').val(),
      p2Name: $('#p2name').val(),
      p1Id: $('#p1name').data('id'),
      p2Id: $('#p2name').data('id'),
      p1Score: $('#p1score').val(),
      p2Score: $('#p2score').val()
    }

    ipcRenderer.send('submit-match', match)
  }
})

// Click reset button to reset form
$('#reset').click(e => $('#form').reset())

// Click swap button to swap names
$('#swap').click(() => {
  let temp = $('#p1name').val()
  $('#p1name').val($('#p2name').val())
  $('#p2name').val(temp)

  temp = $('#p1name').data('id')
  $('#p1name').data('id', $('#p2name').data('id'))
  $('#p2name').data('id', temp)

  $('#form').data('swapped', !$('#form').data('swapped'))
})

// Click update to update the text files
$('#update').click(e => {
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

// Click cog to open settings
$('#settings').click(e => {
  e.preventDefault()

  ipcRenderer.send('show-settings')
})
