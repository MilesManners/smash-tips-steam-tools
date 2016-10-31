const {ipcRenderer} = require('electron')
const pug = require('pug')
window.Tether = {}
require('bootstrap')

$('#manual')
    .submit((e) => {
        e.preventDefault()

        ipcRenderer.send('save-form-manual', $('#manual').serializeArray())
    })

$('#challonge')
    .submit((e) => {
        e.preventDefault()

        ipcRenderer.send('get-matches', $('#challonge').serializeArray())
    })

$('#challongeUpdate')
    .click((e) => {
        e.preventDefault()

        var match = {}
        match.p1Name = $('#preview .player1').text()
        match.p2Name = $('#preview .player2').text()
        var round = $('.selected .roundLabel').text().split(' ')
        match.roundLeft = round.shift()
        match.roundRight = round.join(' ')

        console.log(match)
        ipcRenderer.send('save-form', match)
    })

ipcRenderer.on('get-matches-reply', (event, response) => {
    console.log(response)
    $('#challongeMatches').empty()

    let currentRound = ''
    let currentRow = ''
    for(let i in response) {
        if(currentRound != `${response[i].roundLeft} ${response[i].roundRight}`) {
            $('#challongeMatches').append(currentRow)
            currentRound = `${response[i].roundLeft} ${response[i].roundRight}`
            $('#challongeMatches').append(`<h2>${response[i].roundLeft} ${response[i].roundRight}</h2>`)
            currentRow = $('<div class="row"></div>')
        }

        currentRow.append(pug.render(
            `.col-xl-2.col-lg-3.col-md-4.col-sm-6
                .card.card-inverse.card-outline-secondary.match
                    .card-block
                        .roundLabel(hidden="hidden") ${response[i].roundLeft} ${response[i].roundRight}
                        .player1 ${response[i].p1Name}
                        .player2 ${response[i].p2Name}`))
    }

    $('#challongeMatches').append(currentRow)
})

$('#challonge').on('click', '.match', function() {
    $('.selected').removeClass('selected')
    $(this).addClass('selected')

    $('#preview')
        .empty()
        .append(
            `<div class="col-xs-2">
                <input#swap.btn.btn-secondary(type="button" value='swap')
            .col-xs-8
                .pull-xs-left.text-xs-center.player1 ${$('.selected .player1').text()}
                .pull-xs-right.text-xs-center.player2 ${$('.selected .player2').text()}`)
})

$('#challonge').on('click', '#swap', () => {
    var oldLeft = $('#preview .player1').html()
    var oldRight = $('#preview .player2').html()

    $('#preview .player1').html(oldRight)
    $('#preview .player2').html(oldLeft)
})