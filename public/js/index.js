/* eslint-disable no-undef */

$(document).ready(() => {
  $('#btnFindNumber').on('click', async () => {
    const proxyNumber = $('#inputProxyNumber').val()
    const formattedNumber = compressNumber(proxyNumber)
    if (formattedNumber && (await isUser(formattedNumber))) {
      window.location.href = `/dashboard/${formattedNumber}/account`
    } else {
      alert('Invalid phone number.')
    }
  })
  $('#btnSignUp').on('click', () => {
    window.location.href = `/signup`
  })
})

function compressNumber (number) {
  const numberString = number.replace(/\(|\)| |\+1|-/g, '')
  if (!isNaN(numberString) && numberString.length === 10) {
    return `+1${numberString}`
  }
  return undefined
}

async function isUser (number) {
  const url = `https://lahacks-teleguard.herokuapp.com/user/${number}`
  console.log(`Fetching data from ${url}`)
  return fetch(url)
    .then(res => res.json())
    .then(json => {
      return true
    })
    .catch(err => {
      console.log(`An error occurred while fetching data: ${err}`)
      alert('This proxy number does not exist.')
      return false
    })
}
