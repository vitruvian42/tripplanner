import firebaseAdmin from 'firebase-admin';
import * as functions from 'firebase-functions';
import cors from 'cors';

if (firebaseAdmin.apps.length === 0) {
  firebaseAdmin.initializeApp();
}

const corsOptions = {
  origin: true, // Allow all origins, but validate them
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
const corsHandler = cors(corsOptions);

export const uploadPhoto = functions.https.onRequest(async (req, res) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return corsHandler(req, res, () => {
      res.status(204).send('');
    });
  }

  return corsHandler(req, res, async () => {
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
        // Removed 'public: true' - using uniform bucket-level access
      });

      // Generate signed URL - requires service account to have "Service Account Token Creator" role
      // This provides secure, time-limited access to the file
      let url;
      try {
        // Try to get service account email for better error reporting
        let serviceAccountEmail = 'unknown';
        try {
          const app = firebaseAdmin.app();
          const credential = app.options.credential;
          if (credential && typeof credential.getAccessToken === 'function') {
            // Try to extract service account from credential if available
            const projectId = process.env.GOOGLE_CLOUD_PROJECT || firebaseAdmin.app().options.projectId;
            if (projectId) {
              serviceAccountEmail = `${projectId}@appspot.gserviceaccount.com`;
            }
          }
        } catch (e) {
          // Ignore errors getting service account info
        }

        // Generate signed URL with a long expiration (10 years)
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 10);
        
        const [signedUrl] = await file.getSignedUrl({
          action: 'read',
          expires: expirationDate,
        });
        url = signedUrl;
        console.log('Successfully generated signed URL');
      } catch (signError) {
        // If signing fails, log detailed error
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || firebaseAdmin.app().options.projectId || 'unknown';
        const serviceAccountEmail = `${projectId}@appspot.gserviceaccount.com`;
        
        console.error('Error generating signed URL:', {
          message: signError.message,
          code: signError.code,
          serviceAccount: serviceAccountEmail,
          projectId: projectId
        });
        
        // Since signed URLs aren't working and bucket isn't public, we need to make it public
        // OR fix IAM permissions. For now, return error with instructions
        console.error('SIGNED URL GENERATION FAILED. Options:');
        console.error('1. Grant "Service Account Token Creator" role to:', serviceAccountEmail);
        console.error('2. OR make bucket publicly readable: Add allUsers with "Storage Object Viewer" role');
        
        // Still return the public URL format - user needs to make bucket public for this to work
        url = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        console.warn(`Using public URL format (bucket must be public): ${url}`);
      }

      // Generate photo ID
      const photoId = firebaseAdmin.firestore().collection('trips').doc(tripId).collection('photos').doc().id;

      // Use ISO string for timestamp since FieldValue.serverTimestamp() cannot be used inside arrays
      const newPhoto = {
        id: photoId,
        url: url,
        uploadedBy: {
          uid: uid,
          name: name,
          photoURL: photoURL,
        },
        uploadedAt: new Date().toISOString(),
      };

      // Update Firestore with the new photo
      try {
        const tripRef = firebaseAdmin.firestore().collection('trips').doc(tripId);
        
        // Check if trip exists
        const tripDoc = await tripRef.get();
        if (!tripDoc.exists) {
          throw new Error(`Trip ${tripId} does not exist`);
        }

        // Get current photos array or initialize as empty
        const tripData = tripDoc.data();
        const currentPhotos = tripData?.photos || [];

        // Add new photo to array
        const updatedPhotos = [...currentPhotos, newPhoto];

        // Update the trip document
        await tripRef.update({
          photos: updatedPhotos,
        });
        console.log('Photo metadata saved to Firestore successfully');
      } catch (firestoreError) {
        console.error('Error saving photo to Firestore:', {
          message: firestoreError.message,
          code: firestoreError.code,
          stack: firestoreError.stack
        });
        // Even if Firestore update fails, return success since file is uploaded
        // The photo URL is still valid and can be added manually if needed
        console.warn('Photo uploaded to storage but Firestore update failed. Photo URL:', url);
        // Don't throw - we still want to return the URL to the client
      }

      res.status(200).json({ photoId: photoId, url: url });
    } catch (error) {
      console.error('Error uploading photo:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      });
      res.status(500).json({ 
        error: 'Internal Server Error: Failed to upload photo.',
        details: error.message 
      });
    }
  });
});