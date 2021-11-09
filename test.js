(async () => {
  const NodeGeocoder = require('node-geocoder')
  const geocoder = NodeGeocoder({
    provider: 'openstreetmap'
  })


  const res1 = await geocoder.geocode('2000 sageleaf ct');
  console.log(res1)

  // // OpenCage advanced usage example
  // const res = await geocoder.geocode({
  //   address: '29 champs elysée',
  //   countryCode: 'fr',
  //   minConfidence: 0.5,
  //   limit: 5
  // });

  // Reverse example

  const res = await geocoder.reverse({ lat: 35.6195209, lon: -78.6273667 });
  console.log(res)
})()
