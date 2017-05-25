var https = require('https')

class Challonge {
    serialize(obj) {
        return '?' + Object.keys(obj).reduce((a, k) => {
            if(obj[k] !== undefined && obj[k] !== '' && obj[k] !== ' ') {
                a.push(k + '=' + encodeURIComponent(obj[k]))
                return a
            }
        }, []).join('&')
    }

    request(path, method = 'GET', params) {
        var p = this.baseParams
        if(params !== undefined)
            p = Object.assign(p, params)

        var query = this.serialize(p)

        console.log(`${this.baseHost}${this.basePath}${path}.json${query}`)

        this.baseParams = {}
        this.baseParams.api_key = this.apiKey

        return new Promise((resolve, reject) => {
            https.request({
                host: this.baseHost,
                path: `${this.basePath}${path}.json${query}`,
                method: method
            }, (response) => {
                var data = ''
                response.on('data', (chunk) => {data += chunk})
                response.on('end', () => { console.log(data); resolve(JSON.parse(data)) })
            }).on('error', (e) => reject(e)).end()
        })
    }

    constructor(apiKey) {
        this.baseHost = 'api.challonge.com'
        this.basePath = '/v1/'
        this.baseParams = {}

        this.apiKey = apiKey
        this.baseParams.api_key = apiKey

        var instance = this

        var notImplemented = new Promise((resolve, reject) => reject('Not implemented'))

        // TOURNAMENTS
        this.tournaments = {
            // GET /tournaments/index
            index(state, type, createdAfter, createdBefore, subdomain) {
                var params = {
                    state: state,
                    type: type,
                    createdAfter: createdAfter,
                    createdBefore: createdBefore,
                    subdomain: subdomain
                }

                return new Promise((resolve, reject) =>
                    instance.request('tournaments/index', 'GET', params)
                        .then((data) => resolve(data))
                        .catch((e) => reject(e))
                )
            },

            // POST /tournaments/create
            create() { return notImplemented },

            // GET /tournaments/{tournament}
            show() { return notImplemented },

            // PUT /tournaments/{tournament}
            update() { return notImplemented },

            // DELETE /tournaments/{tournament}
            destroy() { return notImplemented },

            // POST /tournaments/{tournament}/process_check_ins
            processCheckIns() { return notImplemented },

            // POST /tournaments/{tournament}/abort_check_in
            abortCheckIn() { return notImplemented },

            // POST /tournaments/{tournament}/start
            start() { return notImplemented },

            // POST /tournaments/{tournament}/finalize
            finalize() { return notImplemented },

            // POST /tournaments/{tournament}/reset
            reset() { return notImplemented }
        }

        // PARTICIPANTS
        this.participants = {
            // GET /tournaments/{tournament}/index
            index(tournament) {
                return new Promise((resolve, reject) =>
                    instance.request(`tournaments/${tournament}/participants`, 'GET')
                        .then((data) => resolve(data))
                        .catch((e) => reject(e))
                )
            },

            // POST /tournaments/{tournament}/participants
            create() { return notImplemented },

            // POST /tournaments/{tournament}/participants/bulk_add
            bulkAdd() { return notImplemented },

            // GET /tournaments/{tournament}/participants/{participant_id}
            show() { return notImplemented },

            // PUT /tournaments/{tournament}/participants/{participant_id}
            update() { return notImplemented },

            // POST /tournaments/{tournament}/participants/{participant_id}/check_in
            checkIn() { return notImplemented },

            // POST /tournaments/{tournament}/participants/{participant_id}/undo_check_in
            undoCheckIn() { return notImplemented },

            // DELETE /tournaments/{tournament}/participants/{participant_id}
            destroy() { return notImplemented },

            // POST /tournaments/{tournament}/participants/randomize
            randomize() { return notImplemented }
        }

        // MATCHES
        this.matches = {
            // GET /tournaments/{tournament}/matches
            index(tournament, state) {
                var params = {
                    state: state
                }

                return new Promise((resolve, reject) =>
                    instance.request(`tournaments/${tournament}/matches`, 'GET', params)
                        .then((data) => resolve(data))
                        .catch((e) => reject(e))
                )
            },

            // GET /tournaments/{tournament}/matches/{match_id}
            show() { return notImplemented },

            // PUT /tournaments/{tournament_id}/matches/{match_id}
            update() { return notImplemented }
        }

        this.matchAttachments = {
            // GET /tournaments/{tournament}/matches/{match_id}/attachments
            index() { return notImplemented },

            // POST /tournaments/{tournament}/matches/{match_id}/attachments
            create() { return notImplemented },

            // POST /tournaments/{tournament}/matches/{match_id}/attachments/{attachment_id}
            show() { return notImplemented },

            // PUT /tournaments/{tournament}/matches/{match_id}/attachments/{attachment_id}
            update() { return notImplemented },

            // DELETE /tournaments/{tournament}/matches/{match_id}/attachments/{attachment_id}
            destroy() { return notImplemented }
        }
    }
}

module.exports = Challonge