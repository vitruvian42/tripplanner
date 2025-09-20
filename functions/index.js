import {onRequest} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import firebaseAdmin from 'firebase-admin';
import * as functions from 'firebase-functions';
import cors from 'cors'; // Import cors

firebaseAdmin.initializeApp();

setGlobalOptions({maxInstances: 10});

const server = await import("firebase-frameworks");
export const ssrabsoluterealm470109c = onRequest(async (request, response) => {
  return server.handle(request, response);
});

const corsOptions = {
  origin: '*', // how to allow all origins  
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

export const uploadTripPhoto = functions.https.onRequest((req, res) => {
  cors(corsOptions)(req, res, async () => {
    let decodedIdToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const idToken = req.headers.authorization.split('Bearer ')[1];
      try {
        decodedIdToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        res.status(401).send('Unauthorized');
        return;
      }
    } else {
      res.status(401).send('Unauthorized: No ID token provided.');
      return;
    }

    const data = req.body; // For onRequest, data is in req.body

    if (!decodedIdToken) {
      res.status(401).send('Unauthorized: Invalid ID token.');
      return;
    }

    const { tripId, imageData, fileName, mimeType } = data;
    const uid = decodedIdToken.uid;
    const name = decodedIdToken.name || 'Anonymous';
    const photoURL = decodedIdToken.picture || null;

    if (!tripId || !imageData || !fileName || !mimeType) {
      res.status(400).send('Bad Request: The function must be called with tripId, imageData, fileName, and mimeType.');
      return;
    }

    const bucket = firebaseAdmin.storage().bucket();
    const filePath = `trip_photos/${tripId}/${uid}/${Date.now()}_${fileName}`;
    const file = bucket.file(filePath);

    const imageBuffer = Buffer.from(imageData, 'base64');

    try {
      await file.save(imageBuffer, {
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000',
        },
        public: true,
      });

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491', // A very distant future date
      });

      const photoId = firebaseAdmin.firestore().collection('trips').doc(tripId).collection('photos').doc().id;

      const newPhoto = {
        id: photoId,
        url: url,
        uploadedBy: {
          uid: uid,
          name: name,
          photoURL: photoURL,
        },
        uploadedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      };

      await firebaseAdmin.firestore().collection('trips').doc(tripId).update({
        photos: firebaseAdmin.firestore.FieldValue.arrayUnion(newPhoto),
      });

      res.status(200).json({ photoId: photoId, url: url });
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).send('Internal Server Error: Failed to upload photo.');
    }
  });
});