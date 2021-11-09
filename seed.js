;(async () => {
  try {
    const got = require('got')

    // Create user if it doesn't exist
    try {
      await got.post('http://localhost:5000/users', {
        json: {
          email: 'alex@example.com',
          password: 'foobar',
          email: 'foo@example.com',
        },
      })
      console.log('user created')
    } catch (err) {
      console.log('user already exists')
    }

    // login for auth creds
    const loginResponse = await got
      .post('http://localhost:5000/login', {
        json: {
          email: 'alex@example.com',
          password: 'foobar',
        },
      })
      .json()

    const token = loginResponse.token
    console.log(token)

    // create some dummy BoxClass
    for (let box of [
      {
        width: 10,
        height: 8,
        depth: 3,
        condition: 0,
        "location":{
          "address": "2000 sageleaf court",
          "postalcode":"27603",
          "country":"us"
        }
      },
      {
        width: 15,
        height: 10,
        depth: 5,
        condition: 0,
        "location":{
          "address": "Raleigh",
          "postalcode":"27606",
          "country":"us"
        }
      },
      // {
      //   width: 2,
      //   height: 2,
      //   depth: 2,
      //   condition: 0,
      //   location: 'Cary NC',
      // },
    ]) {
      await got.post('http://localhost:5000/boxes', {
        headers: {
          'x-access-token': token,
        },
        json: box,
      })
    }
  } catch (err) {
    console.log(err)
  }
})()
