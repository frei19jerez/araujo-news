function getBaseUrl(req) {
  if (req.headers['x-forwarded-prefix']) {
    return req.headers['x-forwarded-prefix'];
  }

  if (
    req.originalUrl &&
    req.originalUrl.startsWith('/runtime/')
  ) {
    const partes = req.originalUrl.split('/');

    if (partes[1] && partes[2]) {
      return '/' + partes[1] + '/' + partes[2];
    }
  }

  return '';
}

module.exports = {

  dashboard: async function(req, res) {
    try {
      const totalNoticias = await Noticia.count();
      const totalUsuarios = await Usuario.count();

      return res.view('pages/admin/dashboard', {
        totalNoticias,
        totalUsuarios,
        baseUrl: getBaseUrl(req)
      });

    } catch (error) {
      console.error('Error cargando dashboard admin:', error);
      return res.serverError('Error cargando panel administrador');
    }
  },

  publicaciones: async function(req, res) {
    try {
      const noticias = await Noticia.find().sort('id DESC');

      return res.view('pages/admin/publicaciones', {
        noticias: noticias || [],
        baseUrl: getBaseUrl(req)
      });

    } catch (error) {
      console.error('Error cargando publicaciones:', error);
      return res.serverError('Error cargando publicaciones');
    }
  },

  nuevaPage: async function(req, res) {
    try {
      const categorias = await Categoria.find().sort('nombre ASC');

      return res.view('pages/admin/nueva-noticia', {
        categorias: categorias || [],
        baseUrl: getBaseUrl(req)
      });

    } catch (error) {
      console.error('Error cargando formulario nueva noticia:', error);
      return res.serverError('Error cargando formulario');
    }
  },

  editarPage: async function(req, res) {
    try {
      const id = req.params.id;

      if (!id || isNaN(id)) {
        return res.badRequest('ID de noticia no válido');
      }

      const noticia = await Noticia.findOne({ id: Number(id) });

      if (!noticia) {
        return res.notFound('Noticia no encontrada');
      }

      const categorias = await Categoria.find().sort('nombre ASC');

      return res.view('pages/admin/editar-noticia', {
        noticia,
        categorias: categorias || [],
        baseUrl: getBaseUrl(req)
      });

    } catch (error) {
      console.error('Error cargando edición de noticia:', error);
      return res.serverError('Error cargando noticia para editar');
    }
  },

  actualizar: async function(req, res) {
    try {
      const id = req.params.id;
      const titulo = req.body.titulo ? req.body.titulo.trim() : '';
      const contenido = req.body.contenido ? req.body.contenido.trim() : '';
      const categoria = req.body.categoria ? Number(req.body.categoria) : null;

      if (!id || isNaN(id)) {
        return res.badRequest('ID de noticia no válido');
      }

      if (!titulo || !contenido) {
        return res.badRequest('Título y contenido son obligatorios');
      }

      const noticia = await Noticia.findOne({ id: Number(id) });

      if (!noticia) {
        return res.notFound('Noticia no encontrada');
      }

      await Noticia.updateOne({ id: Number(id) }).set({
        titulo,
        contenido,
        categoria: categoria && !isNaN(categoria) ? categoria : null
      });

      return res.redirect(getBaseUrl(req) + '/admin/publicaciones');

    } catch (error) {
      console.error('Error actualizando noticia:', error);
      return res.serverError('Error actualizando noticia');
    }
  },

  eliminar: async function(req, res) {
    try {
      const id = req.params.id;

      if (!id || isNaN(id)) {
        return res.badRequest('ID de noticia no válido');
      }

      const noticia = await Noticia.findOne({ id: Number(id) });

      if (!noticia) {
        return res.notFound('Noticia no encontrada');
      }

      await Noticia.destroyOne({ id: Number(id) });

      return res.redirect(getBaseUrl(req) + '/admin/publicaciones');

    } catch (error) {
      console.error('Error eliminando noticia:', error);
      return res.serverError('Error eliminando noticia');
    }
  }

};