/**
 * Clean Existing URLs Script
 * Removes transformation segments from any existing Cloudinary profile_photo_url and WinnerPost media_url values in the database.
 * Run: node clean-urls.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const WinnerPost = require('./models/WinnerPost');

function cleanCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('cloudinary.com')) return url;
  
  const uploadMarker = '/image/upload/';
  const uploadIdx = url.indexOf(uploadMarker);
  if (uploadIdx === -1) return url;
  
  const prefix = url.substring(0, uploadIdx + uploadMarker.length);
  const remaining = url.substring(uploadIdx + uploadMarker.length);
  
  const parts = remaining.split('/');
  // Find the first part that looks like a version (starts with 'v' followed by digits)
  const versionIdx = parts.findIndex(p => /^v\d+$/.test(p));
  if (versionIdx > 0) {
    const cleanRemaining = parts.slice(versionIdx).join('/');
    return prefix + cleanRemaining;
  }
  return url;
}

async function runClean() {
  try {
    await connectDB();
    console.log('Connected to MongoDB. Running URL cleanup...');

    // 1. Clean User profile_photo_urls
    const users = await User.find({ profile_photo_url: { $ne: '' } });
    console.log(`Found ${users.length} users with profile photos.`);
    
    let userChanges = 0;
    for (const user of users) {
      const original = user.profile_photo_url;
      const cleaned = cleanCloudinaryUrl(original);
      if (original !== cleaned) {
        console.log(`[USER] Cleaning: "${original}" -> "${cleaned}"`);
        user.profile_photo_url = cleaned;
        await user.save();
        userChanges++;
      }
    }
    console.log(`Updated ${userChanges} user profile photo URLs.`);

    // 2. Clean WinnerPost media_urls
    const posts = await WinnerPost.find({ media_url: { $ne: '' } });
    console.log(`Found ${posts.length} winner posts with media.`);
    
    let postChanges = 0;
    for (const post of posts) {
      const original = post.media_url;
      const cleaned = cleanCloudinaryUrl(original);
      if (original !== cleaned) {
        console.log(`[WINNERPOST] Cleaning: "${original}" -> "${cleaned}"`);
        post.media_url = cleaned;
        await post.save();
        postChanges++;
      }
    }
    console.log(`Updated ${postChanges} winner post media URLs.`);

    console.log('\n✅ URL Cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running cleanup:', error);
    process.exit(1);
  }
}

runClean();
