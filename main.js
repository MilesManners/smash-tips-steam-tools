const {app, BrowserWindow, ipcMain, globalShortcut} = require('electron')
const request = require('request')
const fs = require('fs')
const Challonge = require('./js/challonge.js')

var p1Score = 0,
    p2Score = 0
var dir = './streamFiles'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected
let win

function createWindow () {
    // Create the browser window
    win = new BrowserWindow({
        width: 800,
        height: 600,
        backgroundColor: '#263238',
        autoHideMenuBar: true,
        show: false
    })

    // and load the index.html of the app
    win.loadURL(`file://${__dirname}/html/index.html`)

    win.once('ready-to-show', () => win.show())

    // Emitted when the window is closed
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element
        win = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows
// Some APIs can only be used after this event occurs
app.on('ready', () => {
    createWindow()

    globalShortcut.register('End', () => fs.writeFile(`${dir}/player1Score.txt`, ++p1Score))
    globalShortcut.register('Down', () => fs.writeFile(`${dir}/player2Score.txt`, ++p2Score))
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open
    if (win === null) {
        createWindow()
    }
})

ipcMain.on('save-form-manual', (event, form) => {
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir)

    fs.writeFile(`${dir}/commentators.txt`, `Commentary\n${form[0].value}\n${form[1].value}`)
    fs.writeFile(`${dir}/round.txt`, `${form[2].value}\n${form[3].value}`)
    fs.writeFile(`${dir}/player1.txt`, form[4].value)
    fs.writeFile(`${dir}/player2.txt`, form[5].value)
    p1Score = form[6].value
    p2Score = form[7].value
    fs.writeFile(`${dir}/player1Score.txt`, p1Score)
    fs.writeFile(`${dir}/player2Score.txt`, p2Score)
})

ipcMain.on('save-form', (event, match) => {
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir)

    //fs.writeFile(`${dir}/commentators.txt`, `Commentary\n${match.c1Name}\n${match.c2Name}`)
    fs.writeFile(`${dir}/round.txt`, `${match.roundLeft}\n${match.roundRight}`)
    fs.writeFile(`${dir}/player1.txt`, match.p1Name)
    fs.writeFile(`${dir}/player2.txt`, match.p2Name)
    p1Score = 0
    p2Score = 0
    fs.writeFile(`${dir}/player1Score.txt`, 0)
    fs.writeFile(`${dir}/player2Score.txt`, 0)
})

showError = function(error) {
    console.log(error)
}

class Match {
    constructor(p1Id, p2Id, winnerId, loserId, round, state) {
        this.p1Id = p1Id
        this.p2Id = p2Id
        this.winnerId = winnerId
        this.loserId = loserId
        this.round = round
        this.state = state
    }
}

// Return a list of matches in this format
// { player1, player2, state, round}
ipcMain.on('get-matches', (event, rawData) => {
    var data = {}
    for(var i in rawData)
        data[rawData[i].name] = rawData[i].value

    var chApi = new Challonge(data.apiKey)

    var state = 'all'
    if(data.hasOwnProperty('state'))
        state = data.state

    chApi.matches.index(data.tournament, state)
        .then((rawMatches) => {
            chApi.participants.index(data.tournament)
                .then((rawParticipants) => {
                    var matches = rawMatches.map((x) => new Match(x.match.player1_id, x.match.player2_id, x.match.winner_id, x.match.loser_id, x.match.round, x.match.state))

                    var participants = {}
                    for(i in rawParticipants)
                        participants[rawParticipants[i].participant.id] = rawParticipants[i].participant.name

                    var maxRound = 0,
                        minRound = 0

                    for(i in matches) {
                        matches[i].p1Name = participants[matches[i].p1Id]
                        matches[i].p2Name = participants[matches[i].p2Id]
                        if(matches[i].round > maxRound)
                            maxRound = matches[i].round
                        if(matches[i].round < minRound)
                            minRound = matches[i].round
                    }

                    for(i in matches) {
                        switch(matches[i].round) {
                            case maxRound:
                                matches[i].roundLeft = 'Grand'
                                matches[i].roundRight = 'Finals'
                                break
                            case maxRound - 1:
                                matches[i].roundLeft = 'Winners'
                                matches[i].roundRight = 'Finals'
                                break
                            case maxRound - 2:
                                matches[i].roundLeft = 'Winners'
                                matches[i].roundRight = 'Semifinals'
                                break
                            case minRound:
                                matches[i].roundLeft = 'Losers'
                                matches[i].roundRight = 'Finals'
                                break
                            case minRound + 1:
                                matches[i].roundLeft = 'Losers'
                                matches[i].roundRight = 'Semifinals'
                                break
                            default:
                                if(matches[i].round > 0) {
                                    matches[i].roundLeft = 'Winners'
                                    matches[i].roundRight = `Round ${Math.abs(matches[i].round)}`
                                } else {
                                    matches[i].roundLeft = 'Losers'
                                    matches[i].roundRight = `Round ${Math.abs(matches[i].round)}`
                                }
                        }
                    }

                    event.sender.send('get-matches-reply', matches)
                })
                .catch((e) => showError(e))
        })
        .catch((e) => showError(e))
})