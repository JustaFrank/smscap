/* eslint-disable no-undef */

$(document).ready(() => {
  console.log('hi')
})

function findUser (number) {
  const url = `https://lahacks-teleguard.herokuapp.com/user/${number}`
  console.log(`Fetching data from ${url}`)
  fetch(url)
    .then(res => res.json())
    .then(json => {
      console.log(json)
    })
    .catch(err => {
      console.log(`An error occurred while fetching data: ${err}`)
      alert('This proxy number does not exist.')
    })
}
