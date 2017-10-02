const { ipcRenderer } = require('electron')
window.Tether = {}
require('bootstrap')

ipcRenderer.send('load-settings')

ipcRenderer.on('load-settings', (event, response) => {
  if (response) {
    $('#apiKey').val(response.apiKey)
    $('#tournament').val(response.tournament)
    $('#state').val(response.state || 'all')
  }
})

// Click update to update the text files
$('#save').click((e) => {
  e.preventDefault()

  let settings = {
    apiKey: $('#apiKey').val(),
    tournament: $('#tournament').val(),
    state: $('#state').val()
  }

  ipcRenderer.send('save-settings', settings)
})
