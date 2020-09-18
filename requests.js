const request = require('request')
const { get, keys, forEach } = require('lodash')

const USERNAME = process.env.USERNAME
const PASSWORD = process.env.PASSWORD
const USER_ID = process.env.USER_ID
const FORM = process.env.FORM

let BEARER

module.exports = {
  authRequest (callback) {
    // console.log(`Starting authRequest`)
    request.post(`https://api.twitter.com/oauth2/token?grant_type=client_credentials`, {
      auth: {
        user: USERNAME,
        pass: PASSWORD
      }
    },
    (error, response, body) => {
      BEARER = get(JSON.parse(body), 'access_token')
      // console.log(`Finishing authRequest`)
      callback()
    })
  },
  getList (callback) {
    // console.log(`Starting getList`)
    request.get(`https://api.twitter.com/1.1/followers/ids.json?user_id=${USER_ID}&stringify_ids=true`, {
      auth: {
        bearer: BEARER
      }
    },
    (error, response, body) => {
      // console.log(`Finishing getList`)
      callback(get(JSON.parse(body), 'ids', []))
    })
  },
  getUserInfo (changes, callback) {
    // console.log(`Starting getUserInfo`)
    const ids = keys(changes).join(',')
    request.get(`https://api.twitter.com/1.1/users/lookup.json?user_id=${ids}`, {
      auth: {
        bearer: BEARER
      }
    },
    (error, response, body) => {
      // console.log(`Finishing getUserInfo`)
      callback(changes, JSON.parse(body))
    })
  },
  logToGoogleForm (detail) {
    let entries = {
      'entry.1853612370': 'action',
      'entry.768425125': 'name',
      'entry.1854247375': 'screen_name',
      'entry.621019786': 'url',
      'entry.1612288882': 'followers_count',
      'entry.1754222331': 'friends_count',
      'entry.159042684': 'listed_count',
      // 'entry.1978602096': 'created_at',
      'entry.1713027614': 'statuses_count',
      'entry.1916892429': 'following',
      'entry.935811465': 'verified',
      'entry.1500016717': 'location',
      // 'entry.327424402': 'description',
      'entry.473828998': 'id'
    }
    forEach(entries, (entry, key) => {
      entries[key] = get(detail, entry, '') || ''
    })
    // console.log(`Starting logToGoogleForm`)
    request.post({
        url: FORM,
        form: entries
      },
      (error, response, body) => {
        // console.log(`Finishing logToGoogleForm`)
      }
    )
  }
};