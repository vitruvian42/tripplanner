
const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");

setGlobalOptions({maxInstances: 10});

const server = import("firebase-frameworks");
exports.server = onRequest(async (request, response) => {
  return server.then(s => s.handle(request, response));
});
