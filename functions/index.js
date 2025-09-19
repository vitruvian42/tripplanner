
const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");

setGlobalOptions({maxInstances: 10});

const server = await import("firebase-frameworks");
exports.server = onRequest(async (request, response) => {
  return server.handle(request, response);
});
