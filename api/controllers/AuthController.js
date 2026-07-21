const bcrypt = require('bcryptjs');

/**
 * Obtiene el prefijo utilizado por DemoFlow.
 *
 * Ejemplo:
 * /runtime/araujo-news
 */
function getBaseUrl(req) {
  const headers = req.headers || {};

  const prefix =
    headers['x-runtime-prefix'] ||
    headers['x-forwarded-prefix'] ||
    '';

  if (!prefix) {
    return '';
  }

  const limpio = String(prefix)
    .trim()
    .replace(/\/+$/, '');

  if (!limpio.startsWith('/')) {
    return `/${limpio}`;
  }

  return limpio;
}

/**
 * Guarda la sesión si el adaptador incluye req.session.save().
 * Si no existe, Sails guardará la sesión automáticamente.
 */
function guardarSesion(req, callback) {
  if (
    req.session &&
    typeof req.session.save === 'function'
  ) {
    return req.session.save(callback);
  }

  return callback(null);
}

module.exports = {

  /**
   * GET /login
   */
  loginPage: async function (req, res) {
    try {
      const baseUrl = getBaseUrl(req);

      return res.view('pages/auth/login', {
        titulo: 'Iniciar sesión',
        baseUrl
      });
    } catch (error) {
      sails.log.error(
        'Error mostrando login de Araujo News:',
        error
      );

      return res.serverError(
        'No fue posible mostrar el inicio de sesión'
      );
    }
  },

  /**
   * POST /login
   */
  login: async function (req, res) {
    try {
      const baseUrl = getBaseUrl(req);

      const email = String(req.body.email || '')
        .trim()
        .toLowerCase();

      const password = String(req.body.password || '')
        .trim();

      sails.log.info(
        'Araujo News: intento de inicio de sesión',
        {
          email,
          baseUrl,
          runtimePrefix:
            req.headers['x-runtime-prefix'] || '',
          forwardedPrefix:
            req.headers['x-forwarded-prefix'] || ''
        }
      );

      if (!email || !password) {
        return res.badRequest(
          'Correo y contraseña obligatorios'
        );
      }

      const user = await Usuario.findOne({ email });

      if (!user) {
        sails.log.warn(
          `Araujo News: usuario no encontrado: ${email}`
        );

        return res.badRequest(
          'Correo o contraseña incorrectos'
        );
      }

      if (!user.password) {
        sails.log.error(
          `Araujo News: el usuario ${email} no tiene contraseña`
        );

        return res.serverError(
          'El usuario no tiene una contraseña configurada'
        );
      }

      const passwordCorrecta = await bcrypt.compare(
        password,
        user.password
      );

      if (!passwordCorrecta) {
        sails.log.warn(
          `Araujo News: contraseña incorrecta para ${email}`
        );

        return res.badRequest(
          'Correo o contraseña incorrectos'
        );
      }

      req.session.araujoUserId = user.id;
      req.session.araujoRol = user.rol;
      req.session.araujoEmail = user.email;
      req.session.araujoNombre = user.nombre;

      return guardarSesion(req, function (errorSesion) {
        if (errorSesion) {
          sails.log.error(
            'Error guardando sesión de Araujo News:',
            errorSesion
          );

          return res.serverError(
            'Error guardando la sesión'
          );
        }

        const destino = `${baseUrl}/admin`;

        sails.log.info(
          `Araujo News: inicio de sesión correcto. Redirigiendo a ${destino}`
        );

        return res.redirect(destino);
      });

    } catch (error) {
      sails.log.error(
        'Error iniciando sesión en Araujo News:',
        error
      );

      sails.log.error(
        'Detalle del error:',
        error && error.stack
          ? error.stack
          : error
      );

      return res.serverError(
        'Error iniciando sesión'
      );
    }
  },

  /**
   * GET /logout
   */
  logout: async function (req, res) {
    try {
      const baseUrl = getBaseUrl(req);

      delete req.session.araujoUserId;
      delete req.session.araujoRol;
      delete req.session.araujoEmail;
      delete req.session.araujoNombre;

      return guardarSesion(req, function (errorSesion) {
        if (errorSesion) {
          sails.log.error(
            'Error cerrando sesión de Araujo News:',
            errorSesion
          );
        }

        return res.redirect(`${baseUrl}/`);
      });

    } catch (error) {
      sails.log.error(
        'Error cerrando sesión de Araujo News:',
        error
      );

      return res.redirect('/');
    }
  }

};