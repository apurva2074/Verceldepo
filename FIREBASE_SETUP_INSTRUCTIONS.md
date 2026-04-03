# Firebase Security Rules Setup

## Problem
Properties are not visible to guests due to Firebase security rules that require authentication.

## Solution
You need to deploy the Firestore security rules to allow public read access to properties.

## Steps to Fix:

### Option 1: Using Firebase Console (Recommended)
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `rentit-562ce`
3. Go to Firestore Database
4. Click on "Rules" tab
5. Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Properties collection - public read access
    match /properties/{propertyId} {
      allow read: if true; // Anyone can read properties
      allow write: if request.auth != null && request.auth.uid == resource.data.owner_uid; // Only owner can write
    }
    
    // Property media collection - public read access
    match /property_media/{mediaId} {
      allow read: if true; // Anyone can read property media
      allow write: if request.auth != null; // Authenticated users can write media
    }
    
    // Users collection - only owner can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Wishlist collection - only owner can read/write their own wishlist
    match /wishlist/{wishlistId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

6. Click "Publish" to deploy the rules

### Option 2: Using Firebase CLI
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Deploy rules: `firebase deploy --only firestore:rules`

## What These Rules Do:
- ✅ **Public Read Access**: Anyone can read properties and property media
- ✅ **Owner Write Access**: Only property owners can modify their properties
- ✅ **Authenticated Media Upload**: Logged-in users can upload property media
- ✅ **User Privacy**: Users can only access their own user data and wishlist
- ✅ **Security**: All other collections are denied access by default

## After Deployment:
- Properties will be visible to guests and tenants
- Property owners can still manage their properties
- All existing functionality will work as expected
- Security is maintained for sensitive operations

## Testing:
1. Visit `/listings` without logging in
2. Properties should be visible to everyone
3. Test filtering and search functionality
4. Verify property owners can still manage their properties
