#!/bin/bash

# Super Admin Service Layer Setup Script
# Creates required folders and empty files for the supper-admin app

set -e

ADMIN_DIR="supper-admin/src/services"

echo "🔧 Setting up Super Admin service layer..."

# Create directories
mkdir -p "$ADMIN_DIR"

# Create empty service files
touch "$ADMIN_DIR/firebase.js"
touch "$ADMIN_DIR/apiHelper.js"
touch "$ADMIN_DIR/admin.js"

# Create .env file if it doesn't exist
if [ ! -f "supper-admin/.env" ]; then
  cat > "supper-admin/.env" << 'EOF'
VITE_API_URL=pharmacy-inventory-system-production-6e12.up.railway.app/api
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
EOF
  echo "✅ Created supper-admin/.env (fill in your Firebase config values)"
else
  echo "⏭️  supper-admin/.env already exists, skipping"
fi

echo ""
echo "✅ Admin service layer created successfully!"
echo ""
echo "Files created:"
echo "  📄 $ADMIN_DIR/firebase.js"
echo "  📄 $ADMIN_DIR/apiHelper.js"
echo "  📄 $ADMIN_DIR/admin.js"
echo "  📄 supper-admin/.env"
echo ""
echo "Next steps:"
echo "  1. Fill in supper-admin/.env with your Firebase project config"
echo "  2. Paste the code for each service file"
echo "  3. Run: cd supper-admin && npm install firebase"
