module.exports = {

  port: process.env.PORT || 1337,

  sockets: {
    onlyAllowOrigins: [
      'https://demoflowapp.com',
      'https://www.demoflowapp.com'
    ]
  },

  http: {
    trustProxy: true
  },

  session: {
    cookie: {
      secure: true
    }
  }

};