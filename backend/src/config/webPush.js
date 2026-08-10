import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

export const initializeWebPush = () => {
  const vapidDetails = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT || 'mailto:your-email@example.com',
  };

  if (!vapidDetails.publicKey || !vapidDetails.privateKey) {
    console.warn('⚠️ Web Push skipped: VAPID keys missing in environment variables.');
    return webpush;
  }

  try {
    webpush.setVapidDetails(
      vapidDetails.subject,
      vapidDetails.publicKey,
      vapidDetails.privateKey
    );
    console.log('✅ Web Push VAPID keys configured');
  } catch (error) {
    console.warn('⚠️ Web Push initialization failed:', error.message);
  }
  return webpush;
};

export { webpush };
