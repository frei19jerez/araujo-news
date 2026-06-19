module.exports = {

  tableName: 'categoria',

  attributes: {

    nombre: {
      type: 'string',
      required: true,
      unique: true,
      maxLength: 120
    },

    noticias: {
      collection: 'noticia',
      via: 'categoria'
    }

  },

  beforeCreate: async function(values, proceed) {
    if (values.nombre) {
      values.nombre = values.nombre.trim();
    }
    return proceed();
  },

  beforeUpdate: async function(values, proceed) {
    if (values.nombre) {
      values.nombre = values.nombre.trim();
    }
    return proceed();
  }

};