module.exports = {

  tableName: 'usuario',

  attributes: {

    nombre: {
      type: 'string',
      required: true,
      maxLength: 120
    },

    email: {
      type: 'string',
      required: true,
      unique: true,
      isEmail: true,
      maxLength: 120
    },

    password: {
      type: 'string',
      required: true,
      protect: true
    },

    rol: {
      type: 'string',
      isIn: ['admin', 'editor'],
      defaultsTo: 'editor'
    },

    noticias: {
      collection: 'noticia',
      via: 'autor'
    }

  }

};