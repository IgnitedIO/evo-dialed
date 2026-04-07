#!/bin/bash
set -e

# Production deployment script
# Usage: ./deploy_prod.sh
#
# Required environment variables:
#   PROD_HOST     - EC2 hostname or IP
#   PROD_USER     - SSH user (default: ec2-user)
#   PROD_PATH     - Path to project on server (default: /home/ec2-user/evo-dialed)
#   SSH_KEY_PATH  - Path to SSH private key (optional if using ssh-agent)

PROD_USER="${PROD_USER:-ec2-user}"
PROD_PATH="${PROD_PATH:-/home/ec2-user/evo-dialed}"

if [ -z "$PROD_HOST" ]; then
  echo "Error: PROD_HOST environment variable is required"
  echo "Usage: PROD_HOST=your-server-ip ./deploy_prod.sh"
  exit 1
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=30"
if [ -n "$SSH_KEY_PATH" ]; then
  SSH_OPTS="$SSH_OPTS -i $SSH_KEY_PATH"
fi

echo "🚀 Deploying to production..."
echo "   Host: $PROD_HOST"
echo "   User: $PROD_USER"
echo "   Path: $PROD_PATH"
echo ""

ssh $SSH_OPTS "$PROD_USER@$PROD_HOST" << EOF
  set -e
  cd $PROD_PATH

  echo "📥 Pulling latest changes..."
  git fetch origin main
  git reset --hard origin/main

  echo "🔨 Building and starting services..."
  cd scripts
  ./build_prod.sh

  echo "✅ Deployment complete!"
EOF

echo ""
echo "🎉 Production deployment finished successfully!"
