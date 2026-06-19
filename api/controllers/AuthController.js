const bcrypt = require('bcryptjs');

function getBaseUrl(req) {
  if (req.headers['x-forwarded-prefix']) {
    return req.headers['x-forwarded-prefix'];
  }

  if (req.originalUrl && req.originalUrl.startsWith('/runtime/')) {
    const partes = req.originalUrl.split('/');

    if (partes[1] && partes[2]) {
      return '/' + partes[1] + '/' + partes[2];
    }
  }

  return '';
}

module.exports = {

  loginPage: async function(req, res) {
    return res.view('pages/auth/login', {
      titulo: 'Iniciar sesión',
      baseUrl: getBaseUrl(req)
    });
  },

  login: async function(req, res) {
    try {
      const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
      const password = req.body.password ? req.body.password.trim() : '';

      if (!email || !password) {
        return res.badRequest('Correo y contraseña obligatorios');
      }

      const user = await Usuario.findOne({ email });

      if (!user) {
        return res.badRequest('Usuario no encontrado');
      }

      const ok = await bcrypt.compare(password, user.password);

      if (!ok) {
        return res.badRequest('Contraseña incorrecta');
      }

      req.session.userId = user.id;
      req.session.rol = user.rol;

      return req.session.save(function(err) {
        if (err) {
          sails.log.error('Error guardando sesión:', err);
          return res.serverError('Error guardando sesión');
        }

        return res.redirect(getBaseUrl(req) + '/admin');
      });

    } catch (error) {
      console.log(error);
      return res.serverError('Error iniciando sesión');
    }
  },

  logout: async function(req, res) {
    const baseUrl = getBaseUrl(req);

    req.session.destroy(() => {
      return res.redirect(baseUrl + '/');
    });
  }

};