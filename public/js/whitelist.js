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
    /dashboard\/(.*)\/whitelist/i
  )[1]
  const user = await findUser(userProxyNumber)
  user.whitelist.forEach(addListNumber)

  $('#btnWhitelistNumber').on('click', () => {
    const numToAdd = compressNumber($('#inputWhitelistNumber').val())
    console.log(numToAdd)
    const url = `https://lahacks-teleguard.herokuapp.com/user/${
      user.proxyNumber
    }/whitelist`
    console.log(url)
    numToAdd &&
      $.ajax({
        url,
        type: 'POST',
        data: JSON.stringify({ whitelist: [numToAdd] }),
        dataType: 'json',
        contentType: 'application/json;charset=utf-8',
        success: () => {
          console.log('Success adding number to whitelist')
          addListNumber(numToAdd)
        },
        error: err => console.log('Error adding number to whitelist: ' + err)
      })
  })

  $('.delete-whitelist-item').on('click', function () {
    const tagToRemove = $(this)
      .parent()
      .parent()
      .parent()
    const numToRemove = tagToRemove.attr('id')
    const url = `https://lahacks-teleguard.herokuapp.com/user/${
      user.proxyNumber
    }/whitelist`
    numToRemove &&
      $.ajax({
        url,
        type: 'DELETE',
        data: JSON.stringify({ whitelist: [numToRemove] }),
        dataType: 'json',
        contentType: 'application/json;charset=utf-8',
        success: () => {
          console.log('Success removing number to whitelist')
          tagToRemove.remove()
        },
        error: err => console.log('Error removing number to whitelist: ' + err)
      })
  })
})

function addListNumber (number) {
  $('#ulWhitelist').append(
    `<li id="${number}" class="list-group-item"><div class="row"><div class="col">${formatNumber(
      number
    )}</div><div class="col text-right"><i class="fas delete-whitelist-item custom-delete-icon fa-minus-circle"></i></div></div>
    </li>`
  )
}

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

function compressNumber (number) {
  const numberString = number.replace(/\(|\)| |\+1|-/g, '')
  if (!isNaN(numberString) && numberString.length === 10) {
    return `+1${numberString}`
  }
  return undefined
}
