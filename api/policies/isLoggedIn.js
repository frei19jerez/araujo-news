module.exports = async function(req, res, proceed) {

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

  const baseUrl = getBaseUrl(req);

  if (!req.session.userId) {
    return res.redirect(baseUrl + '/login');
  }

  return proceed();

};