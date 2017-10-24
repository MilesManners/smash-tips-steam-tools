const {app, BrowserWindow, ipcMain, globalShortcut} = require('electron')
const fs = require('fs')
const Challonge = require('./js/challonge.js')

let p1Score = 0
let p2Score = 0
let dir = './streamFiles'
let settings

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

  fs.readFile('./settings.ini', 'utf8', (err, data) => {
    if (!err) { settings = JSON.parse(data) }
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

  globalShortcut.register('End', () => {
    if (fs.existsSync(dir)) {
      fs.writeFile(`${dir}/player1Score.txt`, ++p1Score)
      win.webContents.send('increaseP1')
    }
  })
  globalShortcut.register('Down', () => {
    if (fs.existsSync(dir)) {
      fs.writeFile(`${dir}/player2Score.txt`, ++p2Score)
      win.webContents.send('increaseP2')
    }
  })
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

ipcMain.on('save-form', (event, match) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }

  // fs.writeFile(`${dir}/commentators.txt`, `Commentary\n${match.c1Name}\n${match.c2Name}`)
  fs.writeFile(`${dir}/round.txt`, `${match.roundLeft} ${match.roundRight}`)
  fs.writeFile(`${dir}/player1.txt`, match.p1Name)
  fs.writeFile(`${dir}/player2.txt`, match.p2Name)
  p1Score = match.p1Score
  p2Score = match.p2Score
  fs.writeFile(`${dir}/player1Score.txt`, p1Score)
  fs.writeFile(`${dir}/player2Score.txt`, p2Score)
})

const showError = error => {
  console.log(error)
}

class Match {
  constructor (id, p1Id, p2Id, winnerId, loserId, round, state) {
    this.id = id
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
ipcMain.on('get-matches', event => {
  if (!settings || !settings.apiKey || !settings.tournament) {
    event.sender.send('get-matches-reply', {error: true, message: 'Information missing from settings'})
    return
  }

  let chApi = new Challonge(settings.apiKey)

  let state = 'all'
  if ('state' in settings) { state = settings.state }

  chApi.matches.index(settings.tournament, 'all')
    .then((rawMatches) => {
      chApi.participants.index(settings.tournament)
        .then((rawParticipants) => {
          let matches = rawMatches.map((x) => new Match(x.match.id, x.match.player1_id, x.match.player2_id, x.match.winner_id, x.match.loser_id, x.match.round, x.match.state))

          let participants = {}
          for (let i in rawParticipants) {
            participants[rawParticipants[i].participant.id] = rawParticipants[i].participant.name
          }

          let maxRound = 0
          let minRound = 0

          for (let i in matches) {
            matches[i].p1Name = participants[matches[i].p1Id]
            matches[i].p2Name = participants[matches[i].p2Id]
            if (matches[i].round > maxRound) { maxRound = matches[i].round }
            if (matches[i].round < minRound) { minRound = matches[i].round }
          }

          for (let i in matches) {
            switch (matches[i].round) {
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
                if (matches[i].round > 0) {
                  matches[i].roundLeft = 'Winners'
                  matches[i].roundRight = `Round ${Math.abs(matches[i].round)}`
                } else {
                  matches[i].roundLeft = 'Losers'
                  matches[i].roundRight = `Round ${Math.abs(matches[i].round)}`
                }
            }
          }

          if (state !== 'all') { matches = matches.filter(m => m.state === state) }

          event.sender.send('get-matches-reply', matches)
        })
        .catch((e) => showError(e))
    })
    .catch((e) => showError(e))
})

let child
ipcMain.on('show-settings', event => {
  child = new BrowserWindow({
    parent: win,
    width: 400,
    height: 400,
    modal: true,
    autoHideMenuBar: true,
    show: false
  })
  child.loadURL(`file://${__dirname}/html/settings.html`)
  child.once('ready-to-show', () => child.show())
})

ipcMain.on('load-settings', event => {
  event.sender.send('load-settings', settings)
})

ipcMain.on('save-settings', (event, data) => {
  settings = data
  fs.writeFile('./settings.ini', JSON.stringify(settings))
  child.close()
})

ipcMain.on('submit-match', (event, match) => {
  let chApi = new Challonge(settings.apiKey)

  let winner = match.p1Score > match.p2Score ? match.p1Id : match.p2Id
  let score = match.swapped ? `"${match.p2Score}-${match.p1Score}"` : `"${match.p1Score}-${match.p2Score}"`

  chApi.matches.update(settings.tournament, match.id, score, winner)
    .then(console.log)
})
