# FIREBASE RULES DEPLOYMENT INSTRUCTIONS

## The Issue
Your Firestore rules haven't been deployed yet, which is why you're getting "Missing or insufficient permissions" errors.

## Quick Fix (Deploy Rules)

1. **Open terminal in your project root:**
```bash
cd "d:\Major project\code"
```

2. **Deploy Firestore rules:**
```bash
firebase deploy --only firestore:rules
```

3. **If that doesn't work, try:**
```bash
firebase login
firebase deploy --only firestore:rules
```

## Alternative: Test with Temporary Open Rules

For immediate testing, you can temporarily use these rules (NOT FOR PRODUCTION):

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY: Allow all authenticated users to read/write rent_requests
    // REMOVE THIS IN PRODUCTION!
    match /rent_requests/{requestId} {
      allow read, write, create, update, delete: if request.auth != null;
    }
    
    // Keep all your existing rules...
    // (rest of your rules remain the same)
  }
}
```

## How to Deploy Temporary Rules:

1. Copy the temporary rules above
2. Paste them into your `firestore.rules` file (replace the rent_requests section)
3. Deploy: `firebase deploy --only firestore:rules`

## After Testing

Once you confirm the rent flow works, deploy the proper secure rules:

```javascript
// PRODUCTION RULES (Secure)
match /rent_requests/{requestId} {
  // Allow list queries only with proper filters
  allow list: if request.auth != null && 
    (request.query.where == 'tenantId' && request.query.equalTo == request.auth.uid) ||
    (request.query.where == 'ownerId' && request.query.equalTo == request.auth.uid);
  
  // Allow read if user is tenant or owner of the request
  allow read: if request.auth != null && 
    (request.auth.uid == resource.data.tenantId || 
     request.auth.uid == resource.data.ownerId);
  
  // Allow create if user is the tenant
  allow create: if request.auth != null && 
    request.auth.uid == resource.data.tenantId;
  
  // Allow update if user is the owner (to approve/reject)
  allow update: if request.auth != null && 
    request.auth.uid == resource.data.ownerId;
  
  // Allow delete if user is tenant (withdraw request) or owner
  allow delete: if request.auth != null && 
    (request.auth.uid == resource.data.tenantId || 
     request.auth.uid == resource.data.ownerId);
}
```

## Verify Deployment

After deploying, check the Firebase Console:
1. Go to Firestore Database → Rules tab
2. Confirm your new rules are published
3. Test the rent flow again

The error should disappear once the rules are deployed!
