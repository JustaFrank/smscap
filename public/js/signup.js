/* eslint-disable no-undef */

$(document).ready(() => {
  $('#btnLogin').hide()
  $('#btnSignUp').on('click', async () => {
    const phoneNumber = $('#inputPhoneNumber').val()
    const formattedNumber = compressNumber(phoneNumber)
    if (formattedNumber) {
      const availableNumber = await getAvailableProxyNumber()
      if (availableNumber) {
        const proxyNumber = availableNumber.number
        // removeNumber(proxyNumber)
        // addUser(phoneNumber, proxyNumber)
        $('#inputPhoneNumber').hide()
        $('#btnSignUp').hide()
        $('#btnLogin').show()
        $('#hText').html(
          `Thank you for signing up for TeleGuard! Your new proxy number is <b>${formatNumber(
            proxyNumber
          )}</b>.`
        )
      } else {
        alert("Sorry, we're out of proxy numbers right now!")
      }
      // window.location.href = `http://localhost:6969/dashboard/${formattedNumber}/account`
      // window.location.href = `http://lahacks-teleguard.herokuapp.com/dashboard/${formattedNumber}/account`
    } else {
      alert('Invalid phone number.')
    }
  })

  $('#btnLogin').on('click', () => {
    window.location.href = 'https://lahacks-teleguard.herokuapp.com/'
  })
})

function compressNumber (number) {
  const numberString = number.replace(/\(|\)| |\+1|-/g, '')
  if (!isNaN(numberString) && numberString.length === 10) {
    return `+1${numberString}`
  }
  return undefined
}

function formatNumber (number) {
  return `+1 (${number.slice(2, 5)})-${number.slice(5, 8)}-${number.slice(
    8,
    12
  )}`
}

async function getAvailableProxyNumber () {
  try {
    const res = await fetch('https://lahacks-teleguard.herokuapp.com/number')
    const numbers = await res.json()
    return numbers[0]
  } catch (err) {
    return undefined
  }
}

async function removeNumber (number) {
  const url = `https://lahacks-teleguard.herokuapp.com/number/${number}`
  $.ajax({
    url,
    type: 'DELETE',
    success: () => {
      console.log('Success removing number')
      tagToRemove.remove()
    },
    error: err => console.log('Error removing number: ' + err)
  })
}

async function addUser (number, proxyNumber) {
  const url = `https://lahacks-teleguard.herokuapp.com/user`
  $.ajax({
    url,
    type: 'POST',
    data: JSON.stringify({
      number,
      proxyNumber
    }),
    dataType: 'json',
    contentType: 'application/json;charset=utf-8',
    success: () => {
      console.log('Success creating user')
      tagToRemove.remove()
    },
    error: err => console.log('Error creating user: ' + err)
  })
}
