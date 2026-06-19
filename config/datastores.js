module.exports.datastores = {

  default: {
    adapter: 'sails-postgresql',

    url: process.env.DATABASE_URL || 'postgresql://postgres:emily19kenia@localhost:5432/araujo_news',

    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false
  }

};