const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://162.218.114.85:3030',
      changeOrigin: true,
    })
  );
}; 