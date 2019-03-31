/* eslint-disable no-undef */

$(document).ready(() => {
  $('#btnFindNumber').on('click', () => {
    const proxyNumber = $('#inputProxyNumber').val()
    const formattedNumber = formatNumber(proxyNumber)
    if (formattedNumber) {
      // window.location.href = `http://localhost:6969/dashboard/${formattedNumber}`
      window.location.href = `http://lahacks-teleguard.com/dashboard/${formattedNumber}/account`
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
