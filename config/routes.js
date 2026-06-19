module.exports.routes = {

  // ===============================
  // PÚBLICO
  // ===============================
  'GET /': 'NoticiaController.index',
  'GET /noticia': 'NoticiaController.index',
  'GET /noticia/:id': 'NoticiaController.ver',
  'GET /n/:slug': 'NoticiaController.verPorSlug',
  'GET /buscar': 'NoticiaController.buscar',

  // ===============================
  // CREAR NOTICIA (ADMIN)
  // ===============================
  'POST /noticia': 'NoticiaController.crear',

  'GET /uploads/:file': 'NoticiaController.archivo',

  // ===============================
  // LOGIN / AUTH
  // ===============================
  'GET /login': 'AuthController.loginPage',
  'POST /login': 'AuthController.login',
  'GET /logout': 'AuthController.logout',

  // ===============================
  // PANEL ADMIN
  // ===============================
  'GET /admin': 'AdminController.dashboard',
  'GET /admin/publicaciones': 'AdminController.publicaciones',

  // NUEVA NOTICIA
  'GET /admin/noticia/nueva': 'AdminController.nuevaPage',
  'POST /admin/noticia/crear': 'NoticiaController.crear',

  // EDITAR NOTICIA
  'GET /admin/noticia/editar/:id': 'AdminController.editarPage',
  'POST /admin/noticia/actualizar/:id': 'AdminController.actualizar',

  // ELIMINAR NOTICIA
  'POST /admin/noticia/eliminar/:id': 'AdminController.eliminar'

};