/* eslint-disable no-undef */

var config = {
  apiKey: 'AIzaSyDIZNUj7_HIupGibza01dQeGkvJGxjHvIU',
  authDomain: 'ringed-magpie-220504.firebaseapp.com',
  databaseURL: 'https://ringed-magpie-220504.firebaseio.com',
  projectId: 'ringed-magpie-220504',
  storageBucket: 'ringed-magpie-220504.appspot.com',
  messagingSenderId: '968898347672'
}
firebase.initializeApp(config)

var uiConfig = {
  signInSuccessUrl: '',
  signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    {
      provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
      // Invisible reCAPTCHA with image challenge and bottom left badge.
      recaptchaParameters: {
        type: 'image',
        size: 'invisible',
        badge: 'bottomleft'
      }
    }
  ],
  // tosUrl and privacyPolicyUrl accept either url string or a callback
  // function.
  // Terms of service url/callback.
  tosUrl: '<your-tos-url>',
  // Privacy policy url/callback.
  privacyPolicyUrl: function () {
    window.location.assign('<your-privacy-policy-url>')
  },
  callbacks: {
    signInSuccessWithAuthResult: async function (authResult, redirectUrl) {
      const user = authResult.user
      const phoneNumber = user.phoneNumber
      console.log(authResult)
      alert(JSON.stringify(result))
      // alert("Sorry, we're out of proxy numbers right now!")
      window.location.href = `/`

      // Do something with the returned AuthResult.
      // Return type determines whether we continue the redirect automatically
      // or whether we leave that to developer to handle.

      return false
    }
  }
}

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth())
// The start method will wait until the DOM is loaded.
ui.start('#firebaseui-auth-container', uiConfig)
