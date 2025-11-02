import admin from 'firebase-admin';

let initializedApp: admin.app.App | undefined;

function initializeFirebaseAdmin() {
  // If already initialized, return existing app
  if (admin.apps.length > 0) {
    initializedApp = admin.app();
    return initializedApp;
  }

  // For Firebase Hosting/Cloud Functions/Cloud Run in the same project, initializeApp() works without credentials
  // Try this first as it's the simplest and works automatically in Firebase/GCP environments
  try {
    // Build config object with available environment variables
    const config: any = {};
    
    // Set projectId from environment if available (helps with Cloud Run)
    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      config.projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      console.log('[FIREBASE ADMIN] Using projectId from env:', config.projectId);
    }
    
    // Initialize with or without explicit config
    if (Object.keys(config).length > 0) {
      initializedApp = admin.initializeApp(config);
      console.log('[FIREBASE ADMIN] Initialized with explicit config');
    } else {
      initializedApp = admin.initializeApp();
      console.log('[FIREBASE ADMIN] Initialized with default project credentials (ADC)');
    }
    return initializedApp;
  } catch (error: any) {
    // Check if app was already initialized (sometimes happens in edge cases)
    if (admin.apps.length > 0) {
      initializedApp = admin.app();
      console.log('[FIREBASE ADMIN] App was already initialized, using existing app');
      return initializedApp;
    }

    // If simple initialization fails, try with explicit credentials
    try {
      // Try service account credentials from environment variable
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        initializedApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('[FIREBASE ADMIN] Initialized with service account from environment');
        return initializedApp;
      }

      // Try application default credentials (for Cloud Run/GCP)
      initializedApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('[FIREBASE ADMIN] Initialized with application default credentials');
      return initializedApp;
    } catch (credentialError: any) {
      // Check again if app was initialized during credential attempt
      if (admin.apps.length > 0) {
        initializedApp = admin.app();
        console.log('[FIREBASE ADMIN] App initialized during credential attempt');
        return initializedApp;
      }

      console.error('[FIREBASE ADMIN] Failed to initialize with credentials:', credentialError);
      console.error('[FIREBASE ADMIN] Original error:', error);
      throw new Error(
        `Firebase Admin initialization failed. ` +
        `Original: ${error.message}. ` +
        `Credential: ${credentialError.message}. ` +
        `Make sure you're deploying to Firebase Hosting/Cloud Run or have proper credentials configured.`
      );
    }
  }
}

export function getFirebaseAdmin() {
  // Check if already initialized and cached
  if (initializedApp) {
    return {
      db: initializedApp.firestore(),
      auth: initializedApp.auth(),
      storage: initializedApp.storage(),
    };
  }

  // Check if Firebase Admin app exists but not cached
  if (admin.apps.length > 0) {
    initializedApp = admin.app();
    console.log('[FIREBASE ADMIN] Using existing Firebase Admin app');
    return {
      db: initializedApp.firestore(),
      auth: initializedApp.auth(),
      storage: initializedApp.storage(),
    };
  }
  
  // Initialize Firebase Admin if not already initialized
  try {
    initializedApp = initializeFirebaseAdmin();
    console.log('[FIREBASE ADMIN] Successfully initialized Firebase Admin');
  } catch (error: any) {
    console.error('[FIREBASE ADMIN] Failed to initialize:', error);
    throw new Error(
      `Firebase Admin initialization failed: ${error.message}. ` +
      `Make sure you're running in a server environment (not browser) and have proper credentials configured.`
    );
  }
  
  if (!initializedApp) {
    throw new Error('Firebase Admin app is not initialized. Check your credentials and environment variables.');
  }

  return {
    db: initializedApp.firestore(),
    auth: initializedApp.auth(),
    storage: initializedApp.storage(),
  };
}