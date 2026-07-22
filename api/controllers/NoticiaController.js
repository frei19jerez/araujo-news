const path = require('path');
const fs = require('fs');

const LIMITE_IMAGEN = 15 * 1024 * 1024; // 15 MB
const LIMITE_VIDEO = 2 * 1024 * 1024 * 1024; // 2 GB

/**
 * Elimina información sensible del autor.
 */
function limpiarAutor(data) {
  if (!data) {
    return data;
  }

  const limpiar = (item) => {
    if (item && item.autor) {
      delete item.autor.password;
      delete item.autor.contraseña;
    }

    return item;
  };

  if (Array.isArray(data)) {
    return data.map(limpiar);
  }

  return limpiar(data);
}

/**
 * Limpia espacios innecesarios.
 */
function limpiarTexto(texto = '') {
  return String(texto)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Genera un slug básico.
 */
function generarSlug(texto = '') {
  return limpiarTexto(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Genera un resumen de la noticia.
 */
function generarResumen(contenido = '', limite = 180) {
  const texto = limpiarTexto(contenido);

  if (!texto) {
    return '';
  }

  if (texto.length <= limite) {
    return texto;
  }

  return texto.substring(0, limite).trim() + '...';
}

/**
 * Normaliza enlaces de YouTube.
 */
function normalizarYoutubeUrl(url = '') {
  const valor = limpiarTexto(url);

  if (!valor) {
    return '';
  }

  try {
    const u = new URL(valor);

    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '').trim();

      if (id) {
        return `https://www.youtube.com/watch?v=${id}`;
      }
    }

    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');

      if (id) {
        return `https://www.youtube.com/watch?v=${id}`;
      }
    }

    return valor;
  } catch (error) {
    return valor;
  }
}

/**
 * Convierte un enlace de YouTube a formato embed.
 */
function youtubeEmbedUrl(url = '') {
  const valor = normalizarYoutubeUrl(url);

  if (!valor) {
    return '';
  }

  try {
    const u = new URL(valor);

    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');

      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }

    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '').trim();

      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }

    return '';
  } catch (error) {
    return '';
  }
}

/**
 * Genera un slug que no esté repetido.
 */
async function generarSlugUnico(titulo) {
  const base = generarSlug(titulo) || 'noticia';

  let slug = base;
  let contador = 1;

  while (await Noticia.findOne({ slug })) {
    slug = `${base}-${contador}`;
    contador++;
  }

  return slug;
}

/**
 * Crea la carpeta de archivos si no existe.
 */
function asegurarCarpeta(ruta) {
  if (!fs.existsSync(ruta)) {
    fs.mkdirSync(ruta, {
      recursive: true
    });
  }
}

/**
 * Sube un archivo recibido por Skipper.
 */
function subirArchivo(req, fieldName, dirname, maxBytes) {
  return new Promise((resolve, reject) => {
    let campo;

    try {
      campo = req.file(fieldName);
    } catch (error) {
      return reject(error);
    }

    if (!campo) {
      return resolve([]);
    }

    campo.upload(
      {
        dirname,
        maxBytes
      },
      (error, files) => {
        if (error) {
          return reject(error);
        }

        return resolve(files || []);
      }
    );
  });
}

/**
 * Obtiene la ruta pública de un archivo.
 */
function obtenerRutaPublica(req, file) {
  if (!file || !file.fd) {
    return '';
  }

  const baseUrl = getBaseUrl(req);
  const nombreArchivo = path.basename(file.fd);

  return `${baseUrl}/uploads/${nombreArchivo}`;
}

/**
 * Obtiene el prefijo enviado por DemoFlowApp.
 *
 * Local:
 * ''
 *
 * DemoFlowApp:
 * '/runtime/araujo-news'
 */
function getBaseUrl(req) {
  if (
    req.headers &&
    req.headers['x-forwarded-prefix']
  ) {
    return String(
      req.headers['x-forwarded-prefix']
    ).replace(/\/+$/, '');
  }

  if (
    req.headers &&
    req.headers['x-runtime-prefix']
  ) {
    return String(
      req.headers['x-runtime-prefix']
    ).replace(/\/+$/, '');
  }

  return '';
}

module.exports = {

  /**
   * PORTADA
   */
  async index(req, res) {
    try {
      let noticias = await Noticia.find()
        .sort('id DESC')
        .populate('categoria')
        .populate('autor');

      noticias = limpiarAutor(noticias).map((noticia) => {
        noticia.resumenCorto =
          noticia.resumen ||
          generarResumen(noticia.contenido, 180);

        noticia.youtubeEmbed =
          youtubeEmbedUrl(noticia.youtubeUrl || '');

        return noticia;
      });

      return res.view('pages/homepage', {
        noticias: noticias || [],
        baseUrl: getBaseUrl(req)
      });

    } catch (error) {
      console.error(
        'Error cargando noticias:',
        error
      );

      return res.view('pages/homepage', {
        noticias: [],
        baseUrl: getBaseUrl(req)
      });
    }
  },

  /**
   * CREAR NOTICIA
   */
  async crear(req, res) {
    try {
      const titulo = limpiarTexto(
        req.body.titulo || ''
      );

      const contenido = limpiarTexto(
        req.body.contenido || ''
      );

      const youtubeUrl = normalizarYoutubeUrl(
        req.body.youtubeUrl || ''
      );

      const baseUrl = getBaseUrl(req);

      if (!titulo || !contenido) {
        return res.badRequest(
          'Título y contenido son obligatorios'
        );
      }

      const uploadDir = path.resolve(
        sails.config.appPath,
        'assets/uploads'
      );

      asegurarCarpeta(uploadDir);

      let imagen = '';
      let video = '';

      let imagenFiles = [];
      let videoFiles = [];

      try {
        /*
         * MUY IMPORTANTE:
         *
         * La imagen y el video deben comenzar a recibirse
         * simultáneamente. Si se procesa primero la imagen
         * y después el video, Skipper puede lanzar EMAXBUFFER.
         */
        [imagenFiles, videoFiles] = await Promise.all([
          subirArchivo(
            req,
            'imagen',
            uploadDir,
            LIMITE_IMAGEN
          ),

          subirArchivo(
            req,
            'video',
            uploadDir,
            LIMITE_VIDEO
          )
        ]);

        console.log('==============================');
        console.log('📦 BODY:', req.body);
        console.log('📸 IMAGEN FILES:', imagenFiles);
        console.log('🎥 VIDEO FILES:', videoFiles);
        console.log('==============================');

      } catch (errorSubida) {
        console.error(
          'Error real subiendo archivos:',
          errorSubida
        );

        if (
          errorSubida.code ===
          'E_EXCEEDS_UPLOAD_LIMIT'
        ) {
          return res.badRequest(
            'Uno de los archivos supera el límite permitido'
          );
        }

        if (errorSubida.code === 'EMAXBUFFER') {
          return res.badRequest(
            'La subida tardó demasiado. Intenta con un video más liviano o utiliza YouTube.'
          );
        }

        return res.serverError(
          'Error subiendo los archivos'
        );
      }

      /*
       * VALIDAR IMAGEN
       */
      if (imagenFiles.length > 0) {
        const archivoImagen = imagenFiles[0];

        console.log(
          '📸 ARCHIVO IMAGEN:',
          archivoImagen
        );

        const tipoImagen = String(
          archivoImagen.type || ''
        ).toLowerCase();

        if (!tipoImagen.startsWith('image/')) {
          return res.badRequest(
            'El archivo de imagen no es válido'
          );
        }

        imagen = obtenerRutaPublica(
          req,
          archivoImagen
        );

        console.log(
          '✅ RUTA IMAGEN:',
          imagen
        );
      }

      /*
       * VALIDAR VIDEO
       */
      if (videoFiles.length > 0) {
        const archivoVideo = videoFiles[0];

        console.log(
          '🎥 ARCHIVO VIDEO:',
          archivoVideo
        );

        const tipoVideo = String(
          archivoVideo.type || ''
        ).toLowerCase();

        if (!tipoVideo.startsWith('video/')) {
          return res.badRequest(
            'El archivo de video no es válido'
          );
        }

        video = obtenerRutaPublica(
          req,
          archivoVideo
        );

        console.log(
          '✅ RUTA VIDEO:',
          video
        );
      }

      const slug = await generarSlugUnico(titulo);
      const resumen = generarResumen(
        contenido,
        180
      );

      const nuevaNoticia = {
        titulo,
        slug,
        contenido,
        resumen,
        imagen,
        video,
        youtubeUrl,
        destacada: Boolean(req.body.destacada)
      };

      if (
        req.session &&
        req.session.userId
      ) {
        nuevaNoticia.autor =
          req.session.userId;
      }

      if (
        req.body.categoria &&
        !isNaN(req.body.categoria)
      ) {
        nuevaNoticia.categoria =
          Number(req.body.categoria);
      }

      console.log(
        '📝 NOTICIA A CREAR:',
        nuevaNoticia
      );

      await Noticia.create(nuevaNoticia);

      return res.redirect(
        `${baseUrl}/admin/publicaciones`
      );

    } catch (error) {
      console.error(
        'Error creando noticia:',
        error
      );

      return res.serverError(
        'No se pudo crear la noticia'
      );
    }
  },

  /**
   * VER NOTICIA INDIVIDUAL
   */
  async ver(req, res) {
    try {
      const id = req.params.id;

      if (!id || isNaN(id)) {
        return res.badRequest(
          'Id de noticia no válido'
        );
      }

      let noticia = await Noticia
        .findOne({
          id: Number(id)
        })
        .populate('categoria')
        .populate('autor');

      if (!noticia) {
        return res.notFound(
          'Noticia no encontrada'
        );
      }

      noticia = limpiarAutor(noticia);

      noticia.youtubeEmbed =
        youtubeEmbedUrl(
          noticia.youtubeUrl || ''
        );

      let relacionadas = await Noticia.find({
        id: {
          '!=': noticia.id
        }
      })
        .sort('id DESC')
        .limit(4)
        .populate('categoria')
        .populate('autor');

      relacionadas =
        limpiarAutor(relacionadas).map(
          (relacionada) => {
            relacionada.resumenCorto =
              relacionada.resumen ||
              generarResumen(
                relacionada.contenido,
                120
              );

            relacionada.youtubeEmbed =
              youtubeEmbedUrl(
                relacionada.youtubeUrl || ''
              );

            return relacionada;
          }
        );

      return res.view('pages/noticia', {
        noticia,
        relacionadas,
        baseUrl: getBaseUrl(req)
      });

    } catch (error) {
      console.error(
        'Error cargando noticia:',
        error
      );

      return res.serverError(
        'Error cargando noticia'
      );
    }
  },

  /**
   * VER NOTICIA POR SLUG
   */
  async verPorSlug(req, res) {
    try {
      const slug = limpiarTexto(
        req.params.slug || ''
      );

      if (!slug) {
        return res.badRequest(
          'Slug no válido'
        );
      }

      let noticia = await Noticia
        .findOne({ slug })
        .populate('categoria')
        .populate('autor');

      if (!noticia) {
        return res.notFound(
          'Noticia no encontrada'
        );
      }

      noticia = limpiarAutor(noticia);

      noticia.youtubeEmbed =
        youtubeEmbedUrl(
          noticia.youtubeUrl || ''
        );

      let relacionadas = await Noticia.find({
        id: {
          '!=': noticia.id
        }
      })
        .sort('id DESC')
        .limit(4)
        .populate('categoria')
        .populate('autor');

      relacionadas =
        limpiarAutor(relacionadas).map(
          (relacionada) => {
            relacionada.resumenCorto =
              relacionada.resumen ||
              generarResumen(
                relacionada.contenido,
                120
              );

            relacionada.youtubeEmbed =
              youtubeEmbedUrl(
                relacionada.youtubeUrl || ''
              );

            return relacionada;
          }
        );

      return res.view('pages/noticia', {
        noticia,
        relacionadas,
        baseUrl: getBaseUrl(req)
      });

    } catch (error) {
      console.error(
        'Error cargando noticia por slug:',
        error
      );

      return res.serverError(
        'Error cargando noticia'
      );
    }
  },

  /**
   * BUSCADOR
   */
  async buscar(req, res) {
    try {
      const q = limpiarTexto(
        req.query.q || ''
      );

      if (!q) {
        const baseUrl = getBaseUrl(req);

        return res.redirect(
          `${baseUrl}/`
        );
      }

      let noticias = await Noticia.find({
        or: [
          {
            titulo: {
              contains: q
            }
          },
          {
            contenido: {
              contains: q
            }
          },
          {
            resumen: {
              contains: q
            }
          }
        ]
      })
        .sort('id DESC')
        .populate('categoria')
        .populate('autor');

      noticias =
        limpiarAutor(noticias).map(
          (noticia) => {
            noticia.resumenCorto =
              noticia.resumen ||
              generarResumen(
                noticia.contenido,
                180
              );

            noticia.youtubeEmbed =
              youtubeEmbedUrl(
                noticia.youtubeUrl || ''
              );

            return noticia;
          }
        );

      return res.view('pages/homepage', {
        noticias,
        busqueda: q,
        baseUrl: getBaseUrl(req)
      });

    } catch (error) {
      console.error(
        'Error buscando noticias:',
        error
      );

      return res.serverError(
        'Error buscando noticias'
      );
    }
  },

  /**
   * SERVIR ARCHIVOS SUBIDOS
   */
  archivo(req, res) {
    try {
      const file = req.params.file;

      if (
        !file ||
        file.includes('..') ||
        path.basename(file) !== file
      ) {
        return res.notFound();
      }

      const root = path.resolve(
        sails.config.appPath,
        'assets/uploads'
      );

      return res.sendFile(file, {
        root
      });

    } catch (error) {
      console.error(
        'Error sirviendo archivo:',
        error
      );

      return res.notFound();
    }
  }

};