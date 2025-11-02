# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Environment Setup

1. Copy the env example template for your local development and production builds:

   cp .env.example .env.development
   cp .env.example .env.production

2. Fill in each file with the corresponding Firebase project configuration, which you can find in your Firebase Console (Project Settings > General > Your Apps > Config).

   - `.env.development` → Use your **Dev** Firebase project values.
   - `.env.production` → Use your **Production** Firebase project values.

3. The `.env*` files are already in .gitignore, so secrets won't be committed.

4. Never share production secrets or service account files (like `serviceAccountKey.json`) publicly.
