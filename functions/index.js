import {onRequest} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";

setGlobalOptions({maxInstances: 10});

const server = await import("firebase-frameworks");
export const ssrabsoluterealm470109c = onRequest(async (request, response) => {
  return server.handle(request, response);
});
