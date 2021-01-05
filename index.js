require('dotenv').config()

const { get, without, forEach, throttle, size, find, isUndefined } = require('lodash')
const { authRequest, getList, getUserInfo, logToGoogleForm } = require('./requests.js')
const CronJob = require('cron').CronJob

const { format, parse } = require('date-fns')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('user.json')
const db = low(adapter)

db.defaults({ currentUser: [], changes: [] })
  .write()

function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}

function timestamp () {
  return format(new Date(), 'HH:mm:ss dd-MM-yyyy')
}

function formatDate (date) {
  if (isValidDate(date)) {
    return format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
  } else {
    return date
  }
}

function parseDate (date) {
  return parse(date, 'EEE MMM dd kk:mm:ss xxxx yyyy', new Date())
}

function compareLists (newList, oldList) {
  const left = without(oldList, ...newList)
  const join = without(newList, ...oldList)

  const user = {}
  forEach(left, id => {
    user[id] = 'left'
  })
  forEach(join, id => {
    user[id] = 'join'
  })
  return user
}

function processList (newUser) {
  console.log('Processing list')
  const oldUser = db.get('currentUser').value()

  const changes = compareLists(newUser, oldUser)

  db.set('currentUser', newUser).write()

  console.log(`${timestamp()}: ${newUser.length} user in total. ${size(changes)} changes.`)

  if (size(changes)) {
    getUserInfo(changes, addChanges)
  }
}

function addChanges (changes, details) {
  forEach(changes, (action, id) => {
    const user = find(details, { id_str: id })

    const detail = {
      action,
      id,
      name: get(user, 'name'),
      screen_name: get(user, 'screen_name'),
      url: get(user, 'url'),
      followers_count: get(user, 'followers_count'),
      friends_count: get(user, 'friends_count'),
      listed_count: get(user, 'listed_count'),
      created_at: formatDate(parseDate(get(user, 'created_at'))),
      statuses_count: get(user, 'statuses_count'),
      following: get(user, 'following'),
      verified: get(user, 'verified'),
      location: get(user, 'location'),
      description: get(user, 'description'),
      timestamp: formatDate(new Date())
    }

    console.log(`${timestamp()}: ${detail.screen_name || 'unknown'}: ${action}`)
    db.get('changes').push(detail).write()
    logToGoogleForm(detail)
  })
}

authRequest(() => {
  getList(processList)
})

new CronJob('0 * * * *', function() {
  authRequest(() => {
    getList(processList)
  })
}, null, true);
