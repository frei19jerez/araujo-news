/**
 * Session Configuration
 * (sails.config.session)
 */

module.exports.session = {

  secret: process.env.SESSION_SECRET || '8b891772b17ab98752fab48df4e1f603',

  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }

};