/* eslint-disable no-undef */

$(document).ready(() => {
  $('#btnFindNumber').on('click', async () => {
    const proxyNumber = $('#inputProxyNumber').val()
    const formattedNumber = formatNumber(proxyNumber)
    if (formattedNumber && (await isUser(formattedNumber))) {
      window.location.href = `http://localhost:6969/dashboard/${formattedNumber}/account`
      // window.location.href = `http://lahacks-teleguard.herokuapp.com/dashboard/${formattedNumber}/account`
    } else {
      alert('Invalid phone number.')
    }
  })
})

function formatNumber (number) {
  const numberString = number.replace(/\(|\)| /g, '')
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
