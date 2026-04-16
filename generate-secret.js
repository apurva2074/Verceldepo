const crypto = require('crypto');

// Generate secure random admin secret
const adminSecret = crypto.randomBytes(64).toString('hex');

console.log('🔐 Generated Admin Secret:');
console.log(adminSecret);
console.log('\n📝 Copy this for your ADMIN_SECRET environment variable');
console.log('⚠️  Store this securely - you cannot regenerate it!');
