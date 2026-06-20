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

    secret: process.env.SESSION_SECRET || 'araujo-news-session-secret',

    cookie: {

      secure: false,

      httpOnly: true,

      sameSite: 'lax',

      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 días

    }

  }

};