/* eslint-disable no-undef */

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
    11
  )}`
}
