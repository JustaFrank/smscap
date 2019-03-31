/* eslint-disable no-undef */

// Initialize Firebase
var config = {
  apiKey: 'AIzaSyDIZNUj7_HIupGibza01dQeGkvJGxjHvIU',
  authDomain: 'ringed-magpie-220504.firebaseapp.com',
  databaseURL: 'https://ringed-magpie-220504.firebaseio.com/',
  projectId: 'ringed-magpie-220504',
  storageBucket: 'ringed-magpie-220504.appspot.com',
  messagingSenderId: '968898347672'
}
firebase.initializeApp(config)
console.log(firebase.auth())
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in.
    console.log('signed in')
  } else {
    // No user is signed in.
    console.log('not signed in')
    window.location.href = '/'
  }
})

$(document).ready(async () => {
  const userProxyNumber = window.location.href.match(
    /dashboard\/(.*)\/account/i
  )[1]
  const user = await findUser(userProxyNumber)
  $('#hProxyNumber').html(
    `Your proxy number is: <b>${formatNumber(user.proxyNumber)}</b>`
  )
  $('#colPhoneNumber').append(`<br />${formatNumber(user.number)}`)
  $('#colWhitelist').append(
    user.whitelist.map(num => '<br>' + formatNumber(num)).join()
  )
  $('#colBlacklist').append(
    user.blacklist.map(num => '<br>' + formatNumber(num)).join()
  )
  console.log(user)
})

async function findUser (number) {
  const url = `https://lahacks-teleguard.herokuapp.com/user/${number}`
  console.log(`Fetching data from ${url}`)
  return fetch(url)
    .then(res => res.json())
    .catch(err => {
      console.log(`An error occurred while fetching data: ${err}`)
      alert('This proxy number does not exist.')
    })
}

function formatNumber (number) {
  return `+1 (${number.slice(2, 5)})-${number.slice(5, 8)}-${number.slice(
    8,
    12
  )}`
}
