#!/bin/bash

# ════════════════════════════════════════════════════════════════
# GA4 MEASUREMENT PROTOCOL SETUP SCRIPT
# Reset Primal - Automated .env Configuration
# ════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_ENV="${SCRIPT_DIR}/.env"
LOCAL_ENV_BACKUP="${LOCAL_ENV}.backup-$(date +%s)"

# GA4 Measurement ID (already known)
GA4_MEASUREMENT_ID="G-KKTGW6BEJP"

# ════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ════════════════════════════════════════════════════════════════

print_header() {
  echo ""
  echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Update or create .env variable
update_env_var() {
  local file="$1"
  local key="$2"
  local value="$3"

  # Check if key exists
  if grep -q "^${key}=" "$file"; then
    # Update existing key
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      sed -i '' "s/^${key}=.*/${key}=${value}/" "$file"
    else
      # Linux
      sed -i "s/^${key}=.*/${key}=${value}/" "$file"
    fi
    print_info "Updated $key in $file"
  else
    # Add new key
    echo "${key}=${value}" >> "$file"
    print_info "Added $key to $file"
  fi
}

# ════════════════════════════════════════════════════════════════
# MAIN SETUP
# ════════════════════════════════════════════════════════════════

print_header "GA4 MEASUREMENT PROTOCOL SETUP"

echo "This script will configure your .env files for GA4 server-side tracking."
echo ""
print_warning "Before running this script, get your GA4 API Secret:"
echo ""
echo "  1. Go to https://analytics.google.com/"
echo "  2. Select 'Reset Primal' property"
echo "  3. Admin → Data Streams → Your web stream"
echo "  4. Scroll to 'Measurement Protocol' section"
echo "  5. Click 'Create' to generate a new secret"
echo "  6. Copy the secret value"
echo ""

# Prompt for GA4 API Secret
read -sp "📝 Enter your GA4 API Secret (hidden): " GA4_API_SECRET
echo ""

if [ -z "$GA4_API_SECRET" ]; then
  print_error "GA4 API Secret cannot be empty"
  exit 1
fi

# Validate secret format (should be at least 10 chars)
if [ ${#GA4_API_SECRET} -lt 10 ]; then
  print_warning "GA4 API Secret seems too short. Are you sure it's correct? (y/n)"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    print_error "Setup cancelled"
    exit 1
  fi
fi

print_success "GA4 API Secret received"
echo ""

# ════════════════════════════════════════════════════════════════
# LOCAL .env SETUP
# ════════════════════════════════════════════════════════════════

print_header "LOCAL .env Configuration"

if [ ! -f "$LOCAL_ENV" ]; then
  print_error "Local .env file not found at: $LOCAL_ENV"
  echo ""
  print_info "Creating .env from .env.example..."

  if [ -f "${SCRIPT_DIR}/.env.example" ]; then
    cp "${SCRIPT_DIR}/.env.example" "$LOCAL_ENV"
    print_success "Created .env from template"
  else
    print_error ".env.example not found"
    exit 1
  fi
fi

# Backup local .env
cp "$LOCAL_ENV" "$LOCAL_ENV_BACKUP"
print_success "Backup created: $LOCAL_ENV_BACKUP"

# Update local .env
update_env_var "$LOCAL_ENV" "GOOGLE_ANALYTICS_PROPERTY_ID" "$GA4_MEASUREMENT_ID"
update_env_var "$LOCAL_ENV" "GOOGLE_ANALYTICS_API_SECRET" "$GA4_API_SECRET"

print_success "Local .env updated"
echo ""

# Verify local .env
echo "Current GA4 settings in local .env:"
echo -e "${GREEN}"
grep "GOOGLE_ANALYTICS" "$LOCAL_ENV" || echo "⚠️  No GA4 settings found (may be commented out)"
echo -e "${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# PRODUCTION .env SETUP (VIA SSH)
# ════════════════════════════════════════════════════════════════

print_header "PRODUCTION .env Configuration"

echo "Would you like to update the production server's .env file? (y/n)"
read -r update_prod

if [[ "$update_prod" =~ ^[Yy]$ ]]; then

  PROD_SERVER="root@64.225.44.199"
  PROD_ENV="/var/www/reset-primal/api/.env"

  print_info "Connecting to production server..."

  # Test SSH connection
  if ! ssh -o ConnectTimeout=5 -q "$PROD_SERVER" exit; then
    print_error "Cannot connect to production server: $PROD_SERVER"
    print_info "Make sure you have SSH access configured"
    echo ""
    print_warning "You can manually update the production .env file:"
    echo "  ssh $PROD_SERVER"
    echo "  nano $PROD_ENV"
    echo ""
    echo "Add or update these lines:"
    echo "  GOOGLE_ANALYTICS_PROPERTY_ID=$GA4_MEASUREMENT_ID"
    echo "  GOOGLE_ANALYTICS_API_SECRET=$GA4_API_SECRET"
    exit 1
  fi

  print_success "SSH connection successful"

  # Backup production .env
  print_info "Backing up production .env..."
  ssh "$PROD_SERVER" "cp $PROD_ENV ${PROD_ENV}.backup-\$(date +%s)" 2>/dev/null || true

  # Check if .env exists
  if ! ssh "$PROD_SERVER" "test -f $PROD_ENV"; then
    print_error "Production .env not found at: $PROD_ENV"
    exit 1
  fi

  # Update production .env using sed
  print_info "Updating production .env..."

  # Create temporary sed script
  TEMP_SCRIPT=$(mktemp)
  cat > "$TEMP_SCRIPT" << 'EOF'
#!/bin/bash
ENV_FILE="$1"
GA4_ID="$2"
GA4_SECRET="$3"

# Update or add GOOGLE_ANALYTICS_PROPERTY_ID
if grep -q "^GOOGLE_ANALYTICS_PROPERTY_ID=" "$ENV_FILE"; then
  sed -i.bak "s/^GOOGLE_ANALYTICS_PROPERTY_ID=.*/GOOGLE_ANALYTICS_PROPERTY_ID=$GA4_ID/" "$ENV_FILE"
else
  echo "GOOGLE_ANALYTICS_PROPERTY_ID=$GA4_ID" >> "$ENV_FILE"
fi

# Update or add GOOGLE_ANALYTICS_API_SECRET
if grep -q "^GOOGLE_ANALYTICS_API_SECRET=" "$ENV_FILE"; then
  sed -i.bak "s/^GOOGLE_ANALYTICS_API_SECRET=.*/GOOGLE_ANALYTICS_API_SECRET=$GA4_SECRET/" "$ENV_FILE"
else
  echo "GOOGLE_ANALYTICS_API_SECRET=$GA4_SECRET" >> "$ENV_FILE"
fi
EOF

  # Execute on production server
  cat "$TEMP_SCRIPT" | ssh "$PROD_SERVER" bash -s "$PROD_ENV" "$GA4_MEASUREMENT_ID" "$GA4_API_SECRET"
  rm "$TEMP_SCRIPT"

  # Verify production .env
  print_info "Verifying production .env..."
  ssh "$PROD_SERVER" "grep 'GOOGLE_ANALYTICS' $PROD_ENV" | sed 's/API_SECRET=.*/API_SECRET=***HIDDEN**/'

  print_success "Production .env updated"

  # Ask to restart webhook
  echo ""
  print_info "The webhook server needs to be restarted to load new .env variables"
  echo "Would you like to restart the webhook now? (y/n)"
  read -r restart_webhook

  if [[ "$restart_webhook" =~ ^[Yy]$ ]]; then
    print_info "Restarting webhook on production..."

    # Try PM2 first
    if ssh "$PROD_SERVER" "command -v pm2 &> /dev/null"; then
      ssh "$PROD_SERVER" "pm2 restart webhook-hotmart 2>/dev/null || true"
      print_success "Webhook restarted via PM2"
    # Try systemd
    elif ssh "$PROD_SERVER" "command -v systemctl &> /dev/null"; then
      ssh "$PROD_SERVER" "sudo systemctl restart webhook-hotmart 2>/dev/null || true"
      print_success "Webhook restarted via systemctl"
    else
      print_warning "Could not determine how to restart webhook"
      print_info "Manual restart may be needed:"
      echo "  ssh $PROD_SERVER"
      echo "  # Restart using PM2 or systemctl"
    fi
  fi

fi

echo ""

# ════════════════════════════════════════════════════════════════
# TEST SETUP
# ════════════════════════════════════════════════════════════════

print_header "TEST GA4 INTEGRATION"

echo "Would you like to test the GA4 integration now? (y/n)"
read -r run_test

if [[ "$run_test" =~ ^[Yy]$ ]]; then
  echo ""
  print_info "Testing local GA4 endpoint..."
  echo ""

  # Build test URL
  TEST_URL="http://localhost:3000/test-ga4?email=test@example.com&value=97"

  echo "Running: curl \"$TEST_URL\""
  echo ""

  # Try to curl the endpoint
  if command -v curl &> /dev/null; then
    if curl -s "$TEST_URL" 2>/dev/null | grep -q "success"; then
      print_success "GA4 test endpoint responded successfully!"
      curl -s "$TEST_URL" | grep -E "success|message|measurement_id" | head -3
    else
      print_warning "Webhook server may not be running"
      print_info "To start the webhook locally:"
      echo "  cd $SCRIPT_DIR"
      echo "  npm start"
    fi
  else
    print_warning "curl not found, skipping test"
  fi

  echo ""
fi

# ════════════════════════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════════════════════════

print_header "SETUP COMPLETE ✅"

echo "GA4 Configuration Summary:"
echo ""
echo "  📊 Measurement ID:  $GA4_MEASUREMENT_ID"
echo "  🔐 API Secret:      ${GA4_API_SECRET:0:10}...***HIDDEN***"
echo "  📁 Local .env:      $LOCAL_ENV"
echo "  💾 Backup:          $LOCAL_ENV_BACKUP"
echo ""

if [[ "$update_prod" =~ ^[Yy]$ ]]; then
  echo "  🚀 Production:      $PROD_ENV (UPDATED)"
fi

echo ""
print_success "Your GA4 integration is ready!"
echo ""

echo "Next steps:"
echo "  1. Start your local webhook: npm start"
echo "  2. Test the integration: curl http://localhost:3000/test-ga4"
echo "  3. Tomorrow: Make a test purchase to verify the full flow"
echo ""

echo "📖 For more details, see: GA4-SETUP-GUIDE.md"
echo ""
