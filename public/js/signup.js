/* eslint-disable no-undef */

$(document).ready(() => {
  $('#btnSignUp').on('click', () => {
    const phoneNumber = $('#inputPhoneNumber').val()
    const formattedNumber = compressNumber(phoneNumber)
    if (formattedNumber) {
      alert(formattedNumber)
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
