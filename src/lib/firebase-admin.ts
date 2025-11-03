import admin from 'firebase-admin';

let initializedApp: admin.app.App | undefined;

// Helper function for structured logging that works with Cloud Run
function logInfo(message: string, data?: any) {
  const logEntry = {
    severity: 'INFO',
    message: `[FIREBASE ADMIN] ${message}`,
    ...(data && { data }),
    timestamp: new Date().toISOString(),
  };
  console.log(JSON.stringify(logEntry));
}

function logError(message: string, error?: any) {
  const logEntry = {
    severity: 'ERROR',
    message: `[FIREBASE ADMIN] ${message}`,
    ...(error && {
      error: {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      },
    }),
    timestamp: new Date().toISOString(),
  };
  console.error(JSON.stringify(logEntry));
}

function initializeFirebaseAdmin() {
  // Check if we should skip using existing apps (if they might have bad credentials)
  const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  let shouldSkipExistingApps = false;
  
  // If GOOGLE_APPLICATION_CREDENTIALS points to a non-existent file, existing apps are likely invalid
  if (googleAppCreds) {
    try {
      const fs = require('fs');
      if (fs.existsSync && !fs.existsSync(googleAppCreds)) {
        logError('GOOGLE_APPLICATION_CREDENTIALS points to non-existent file - existing apps may be invalid', {
          path: googleAppCreds,
        });
        shouldSkipExistingApps = true;
        // Clear all existing apps - they were initialized with bad credentials
        try {
          while (admin.apps.length > 0) {
            const appToDelete = admin.apps[0];
            const appName = appToDelete.name || '[default]';
            logInfo('Deleting existing app with invalid credentials', { appName });
            admin.app(appName).delete();
          }
        } catch (deleteError: any) {
          logError('Failed to delete existing apps', deleteError);
        }
      }
    } catch (checkError: any) {
      // Couldn't check, continue normally
    }
  }

  // Only reuse existing apps if we haven't detected credential issues
  if (!shouldSkipExistingApps && admin.apps.length > 0) {
    try {
      // Try to get the default app
      initializedApp = admin.app('[default]');
      logInfo('App already initialized, returning existing app', {
        projectId: initializedApp?.options?.projectId,
      });
      return initializedApp;
    } catch (error: any) {
      // If '[default]' doesn't exist, try getting any app
      try {
        const existingApp = admin.apps[0];
        if (existingApp) {
          initializedApp = existingApp;
          logInfo('Found existing app (non-default), returning it', {
            projectId: initializedApp?.options?.projectId,
          });
          return initializedApp;
        }
      } catch (fallbackError: any) {
        logError('Failed to get existing app, will reinitialize', { originalError: error, fallbackError });
      }
      // Continue to initialization below if no app found
    }
  }

  // Get projectId - REQUIRED for Cloud Run
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
  
  if (!projectId) {
    logError('No projectId found in environment variables', {
      availableEnvVars: Object.keys(process.env).filter(key => 
        key.includes('PROJECT') || key.includes('FIREBASE') || key.includes('GCP')
      ),
    });
  }

  // Check if GOOGLE_APPLICATION_CREDENTIALS points to a non-existent file
  // (googleAppCreds already declared at the top of the function)
  let canUseADC = true;
  if (googleAppCreds) {
    // Only check file existence if we're in Node.js (not browser)
    // In Cloud Run, this check will help us avoid trying ADC with a bad file path
    try {
      // Use Node.js fs module synchronously (this is server-side code)
      const fs = require('fs');
      if (fs.existsSync && !fs.existsSync(googleAppCreds)) {
        logError('GOOGLE_APPLICATION_CREDENTIALS points to non-existent file', {
          path: googleAppCreds,
        });
        canUseADC = false;
      }
    } catch (checkError: any) {
      // If we can't check (e.g., in browser), we'll try ADC anyway and let it fail naturally
      // This is fine - the initialization will catch the error if ADC fails
      logError('Could not check GOOGLE_APPLICATION_CREDENTIALS file', checkError);
    }
  }

  // Strategy 1: Try with service account from environment variable (most reliable for Cloud Run)
  // This should be tried FIRST if available, as it's explicit and doesn't rely on ADC
  if (process.env.APP_SERVICE_ACCOUNT) {
    try {
      logInfo('Attempting initialization with service account from environment');
      
      // Parse the service account JSON
      let serviceAccount: any;
      try {
        serviceAccount = JSON.parse(process.env.APP_SERVICE_ACCOUNT);
      } catch (parseError: any) {
        logError('Failed to parse APP_SERVICE_ACCOUNT as JSON', parseError);
        throw new Error(`Invalid JSON in APP_SERVICE_ACCOUNT: ${parseError.message}`);
      }
      
      // Validate required fields
      if (!serviceAccount.private_key || !serviceAccount.client_email) {
        logError('Service account missing required fields', {
          hasPrivateKey: !!serviceAccount.private_key,
          hasClientEmail: !!serviceAccount.client_email,
        });
        throw new Error('Service account JSON missing required fields (private_key or client_email)');
      }
      
      const config: any = {
        credential: admin.credential.cert(serviceAccount),
      };
      
      // Use project_id from service account if available, otherwise use projectId from env
      if (serviceAccount.project_id) {
        config.projectId = serviceAccount.project_id;
        logInfo('Using project_id from service account', { projectId: config.projectId });
      } else if (projectId) {
        config.projectId = projectId;
        logInfo('Using projectId from environment', { projectId: config.projectId });
      } else {
        throw new Error('No projectId available in service account or environment variables');
      }
      
      initializedApp = admin.initializeApp(config, '[default]');
      logInfo('Successfully initialized with service account', { 
        projectId: config.projectId,
        clientEmail: serviceAccount.client_email?.substring(0, 20) + '...' // Log partial email for debugging
      });
      return initializedApp;
    } catch (error: any) {
      logError('Failed to initialize with service account', {
        error: error.message,
        code: error.code,
        hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        serviceAccountKeyLength: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length || 0,
      });
      // Continue to next strategy
    }
  }

  // Strategy 2: Try with projectId and application default credentials (best for Cloud Run)
  // Only try this if ADC can be used (file exists or not using file-based creds)
  if (projectId && canUseADC) {
    try {
      logInfo('Attempting initialization with projectId and ADC', { projectId });
      initializedApp = admin.initializeApp({
        projectId,
        credential: admin.credential.applicationDefault(),
      }, '[default]'); // Explicitly name the app
      logInfo('Successfully initialized with projectId and ADC', { projectId });
      return initializedApp;
    } catch (error: any) {
      // Check if error is related to missing service account file
      if (error.message?.includes('does not exist') || error.code === 'ENOENT') {
        logError('ADC file path issue detected, will skip ADC strategies', error);
        canUseADC = false;
      } else {
        logError('Failed to initialize with projectId and ADC', error);
      }
      // Continue to next strategy
    }
  }

  // Strategy 3: Try simple initialization with projectId (may work if in same GCP project)
  if (projectId) {
    try {
      logInfo('Attempting simple initialization with projectId', { projectId });
      initializedApp = admin.initializeApp({ projectId }, '[default]');
      logInfo('Successfully initialized with simple config and projectId');
      return initializedApp;
    } catch (error: any) {
      logError('Failed to initialize with simple config and projectId', error);
    }
  }

  // Strategy 4: Try simple initialization without projectId (may work if in same GCP project)
  try {
    logInfo('Attempting simple initialization (assuming same GCP project)');
    initializedApp = admin.initializeApp({}, '[default]');
    logInfo('Successfully initialized with simple config');
    return initializedApp;
  } catch (error: any) {
    logError('Failed to initialize with simple config', error);
  }

  // Strategy 5: Try application default credentials without projectId (only if ADC is safe)
  if (canUseADC) {
    try {
      logInfo('Attempting initialization with ADC only');
      initializedApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      }, '[default]');
      logInfo('Successfully initialized with ADC only');
      return initializedApp;
    } catch (error: any) {
      logError('Failed to initialize with ADC only', error);
    }
  } else {
    logInfo('Skipping ADC-only strategy due to credential file issues');
  }

  // All strategies failed
  logError('All initialization strategies failed');
  throw new Error(
    `Firebase Admin initialization failed. ` +
    `ProjectId: ${projectId || 'NOT SET'}. ` +
    `Service Account: ${process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'SET' : 'NOT SET'}. ` +
    `Make sure NEXT_PUBLIC_FIREBASE_PROJECT_ID is set or you're running in a GCP environment with proper credentials.`
  );
}

export function getFirebaseAdmin() {
  // Check if GOOGLE_APPLICATION_CREDENTIALS points to a bad file - if so, clear everything
  const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (googleAppCreds) {
    try {
      const fs = require('fs');
      if (fs.existsSync && !fs.existsSync(googleAppCreds)) {
        logError('Detected invalid GOOGLE_APPLICATION_CREDENTIALS - clearing cache and existing apps');
        initializedApp = undefined; // Clear cache
        // Don't try to delete apps here - let initializeFirebaseAdmin handle it
      }
    } catch (checkError: any) {
      // Couldn't check, continue
    }
  }

  // Check if already initialized and cached
  if (initializedApp) {
    try {
      // Verify the app is still valid by accessing its projectId
      const projectId = initializedApp.options?.projectId;
      logInfo('Using cached Firebase Admin instance', { projectId });
      return {
        db: initializedApp.firestore(),
        auth: initializedApp.auth(),
        storage: initializedApp.storage(),
      };
    } catch (error: any) {
      logError('Cached app is invalid, will reinitialize', error);
      initializedApp = undefined; // Clear cache
    }
  }

  // Check if Firebase Admin app exists but not cached
  // BUT skip this if we detected credential issues (let initializeFirebaseAdmin handle it)
  let canUseExistingApps = true;
  if (googleAppCreds) {
    try {
      const fs = require('fs');
      if (fs.existsSync && !fs.existsSync(googleAppCreds)) {
        canUseExistingApps = false;
      }
    } catch (checkError: any) {
      // Couldn't check, assume we can use existing apps
    }
  }
  
  if (admin.apps.length > 0 && canUseExistingApps) {
    try {
      initializedApp = admin.app('[default]');
      const projectId = initializedApp?.options?.projectId;
      logInfo('Using existing Firebase Admin app (not cached)', { projectId });
      return {
        db: initializedApp.firestore(),
        auth: initializedApp.auth(),
        storage: initializedApp.storage(),
      };
    } catch (error: any) {
      logError('Failed to get existing app, will reinitialize', error);
      // Continue to initialization below
    }
  }
  
  // Initialize Firebase Admin if not already initialized
  try {
    logInfo('Initializing Firebase Admin SDK...', {
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    });
    initializedApp = initializeFirebaseAdmin();
    
    if (!initializedApp) {
      throw new Error('Initialization returned undefined');
    }

    // Verify initialization succeeded
    const projectId = initializedApp.options?.projectId;
    const hasAuth = !!initializedApp?.auth();
    const hasFirestore = !!initializedApp?.firestore();
    
    logInfo('Successfully initialized Firebase Admin', {
      projectId,
      hasAuth,
      hasFirestore,
    });

    if (!hasFirestore) {
      throw new Error('Firestore is not available after initialization');
    }

    return {
      db: initializedApp.firestore(),
      auth: initializedApp.auth(),
      storage: initializedApp.storage(),
    };
  } catch (error: any) {
    logError('Failed to initialize Firebase Admin', error);
    initializedApp = undefined; // Clear any partial initialization
    throw new Error(
      `Firebase Admin initialization failed: ${error.message}. ` +
      `Make sure you're running in a server environment (not browser) and have proper credentials configured. ` +
      `Required: NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable.`
    );
  }
}