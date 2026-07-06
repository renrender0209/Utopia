import createServer from '@tomphttp/bare-server-node';
import http from 'http';
import nodeStatic from 'node-static';
const port = process.env.PORT || 8080;

const bare =  createServer('/bare/');
const serve = new nodeStatic.Server('main/');

const server = http.createServer();

server.on('request', (req, res) => {
  if (bare.shouldRoute(req)) {
    // Wrap routeRequest to catch RangeError from Node.js v20+ status code validation
    Promise.resolve()
      .then(() => bare.routeRequest(req, res))
      .catch((err) => {
        if (!res.headersSent) {
          try {
            res.writeHead(500);
            res.end(JSON.stringify({ code: 'UNKNOWN', id: 'error.RangeError', message: err.message }));
          } catch (_) {
            res.end();
          }
        }
      });
  } else {
    serve.serve(req, res);
  }
});

server.on('upgrade', (req, socket, head) => {
  if (bare.shouldRoute(req, socket, head)) {
    bare.routeUpgrade(req, socket, head);
  }else{
    socket.end();
  }
});

server.listen({
  port: port,
});

console.log(`Listening on http://localhost:${port}`)
