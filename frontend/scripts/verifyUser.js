/* eslint-disable no-undef */
/**
 * One-off helper: mark a Firebase Auth user as email-verified.
 *
 * Why this exists:
 *   The dev/test superadmin account (smstech@pharma.com) was created with
 *   a fake email, so the normal "send verification link -> click in inbox"
 *   flow can never succeed. This script uses the Admin SDK to flip
 *   `emailVerified: true` directly on the Auth record.
 *
 * Usage:
 *   node scripts/verifyUser.js                       # default email
 *   node scripts/verifyUser.js --email foo@bar.com   # custom email
 *   node scripts/verifyUser.js --uid <firebase-uid>  # by uid instead
 *
 * Requires:
 *   scripts/serviceAccountKey.json  (Firebase Admin service account)
 */

import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_EMAIL = "smstech@pharma.com";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = { email: null, uid: null };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--email" && args[i + 1]) {
      out.email = args[i + 1];
      i += 1;
    } else if (args[i] === "--uid" && args[i + 1]) {
      out.uid = args[i + 1];
      i += 1;
    }
  }
  return out;
};

const loadServiceAccount = () => {
  const keyPath = path.resolve(__dirname, "serviceAccountKey.json");
  const raw = readFileSync(keyPath, "utf-8");
  return JSON.parse(raw);
};

const main = async () => {
  const { email, uid } = parseArgs();

  const serviceAccount = loadServiceAccount();
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  let userRecord;
  try {
    userRecord = uid
      ? await admin.auth().getUser(uid)
      : await admin.auth().getUserByEmail(email || DEFAULT_EMAIL);
  } catch (err) {
    console.error(
      `\nCould not find user ${uid ? `uid=${uid}` : `email=${email || DEFAULT_EMAIL}`}: ${err.message}\n`,
    );
    process.exit(1);
  }

  if (userRecord.emailVerified) {
    console.log(
      `\nUser ${userRecord.email} (${userRecord.uid}) is already marked as email-verified. Nothing to do.\n`,
    );
    return;
  }

  await admin.auth().updateUser(userRecord.uid, { emailVerified: true });

  // Re-read to confirm
  const confirmed = await admin.auth().getUser(userRecord.uid);

  console.log(
    `\nDone. ${confirmed.email} (${confirmed.uid}) -> emailVerified = ${confirmed.emailVerified}\n`,
  );
};

main().catch((err) => {
  console.error("\nUnexpected error:", err);
  process.exit(1);
});
