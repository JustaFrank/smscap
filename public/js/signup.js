/* eslint-disable no-undef */

$(document).ready(() => {
  $('#btnSignUp').on('click', async () => {
    const phoneNumber = $('#inputPhoneNumber').val()
    const formattedNumber = compressNumber(phoneNumber)
    if (formattedNumber) {
      const availableNumber = await getAvailableProxyNumber()
      if (availableNumber) {
        alert(`Your new proxy number is ${availableNumber.number}`)
      } else {
        alert("Sorry, we're out of proxy numbers right now!")
      }
      // window.location.href = `http://localhost:6969/dashboard/${formattedNumber}/account`
      // window.location.href = `http://lahacks-teleguard.herokuapp.com/dashboard/${formattedNumber}/account`
    } else {
      alert('Invalid phone number.')
    }
  })
})

function compressNumber (number) {
  const numberString = number.replace(/\(|\)| |\+1|-/g, '')
  if (!isNaN(numberString) && numberString.length === 10) {
    return `+1${numberString}`
  }
  return undefined
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
