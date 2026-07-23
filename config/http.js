/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuración del servidor HTTP de Araujo News.
 */

module.exports.http = {

  /**
   * Araujo News funciona detrás del proxy de DemoFlowApp.
   *
   * Esto permite que Express/Sails interprete correctamente
   * las cabeceras X-Forwarded-* enviadas por el proxy.
   */
  trustProxy: true,

  middleware: {

    /**
     * Configuración personalizada de Skipper.
     *
     * Se aumentan los tiempos porque Araujo News funciona
     * detrás del proxy de DemoFlowApp y de Render.
     */
    bodyParser: (function configurarBodyParser() {
      const skipper = require('skipper');

      return skipper({
        strict: true,

        /**
         * Tiempo máximo para que Skipper entregue el control
         * al controlador mientras procesa multipart/form-data.
         */
        maxWaitTimeBeforePassingControlToApp: 5000,

        /**
         * Tiempo máximo para esperar que llegue el primer archivo
         * del campo imagen o video.
         *
         * Evita el error ETIMEOUT que estaba apareciendo.
         */
        maxTimeToWaitForFirstFile: 120000,

        /**
         * Tiempo máximo que Skipper mantiene un archivo esperando
         * antes de conectarlo con req.file(...).upload(...).
         *
         * Evita errores EMAXBUFFER cuando la aplicación está
         * detrás de proxies o la conexión es más lenta.
         */
        maxTimeToBuffer: 120000
      });
    })()

  }

};