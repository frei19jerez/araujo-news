module.exports = {
  tableName: 'noticia',

  attributes: {
    titulo: {
      type: 'string',
      required: true
    },

    slug: {
      type: 'string',
      unique: true,
      allowNull: true
    },

    contenido: {
      type: 'string',
      columnType: 'text',
      required: true
    },

    resumen: {
      type: 'string',
      columnType: 'text',
      allowNull: true
    },

    imagen: {
      type: 'string',
      allowNull: true
    },

    video: {
      type: 'string',
      allowNull: true
    },

    youtubeUrl: {
      type: 'string',
      allowNull: true
    },

    categoria: {
      model: 'categoria'
    },

    autor: {
      model: 'usuario'
    }
  }
};