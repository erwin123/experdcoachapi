var err, options, server;

server = require('../server.js');

options = JSON.parse(process.argv[2]);

// Make sure that the node process is killed when the import process is over.
try {
  server.models.Employee["import"](options.container, options.file, options, function (err) {
    console.log('calling import')
    return process.exit(err ? 1 : 0);
  });
} catch (_error) {
  err = _error;
  process.exit(err ? 1 : 0);
}
