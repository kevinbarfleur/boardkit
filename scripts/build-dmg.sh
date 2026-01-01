#!/bin/bash
# =============================================================================
# Boardkit DMG Build Script
# =============================================================================
# This script builds the Boardkit desktop application and creates a DMG file
# for distribution on macOS.
#
# Usage: pnpm build:dmg
# Output: releases/Boardkit_<version>_<arch>.dmg
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Get architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
  ARCH_NAME="aarch64"
else
  ARCH_NAME="x64"
fi

echo ""
echo "=================================================="
echo "  Boardkit DMG Builder"
echo "=================================================="
echo ""

# Navigate to desktop app directory
cd "$PROJECT_ROOT/apps/desktop"

# Step 1: Build frontend
echo -e "${YELLOW}[1/4]${NC} Building frontend..."
pnpm build
echo -e "${GREEN}✓${NC} Frontend built"

# Step 2: Build Tauri app (without DMG, just the .app)
echo -e "${YELLOW}[2/4]${NC} Building Tauri application..."
echo "      This may take a few minutes on first run..."

# Build only the app bundle, skip DMG (which has issues)
cargo build --release --manifest-path src-tauri/Cargo.toml
tauri build --bundles app 2>/dev/null || true

echo -e "${GREEN}✓${NC} Application built"

# Step 3: Create DMG manually using hdiutil
echo -e "${YELLOW}[3/4]${NC} Creating DMG..."

APP_PATH="src-tauri/target/release/bundle/macos/Boardkit.app"
DMG_NAME="Boardkit_0.1.0_${ARCH_NAME}.dmg"
DMG_PATH="$PROJECT_ROOT/releases/$DMG_NAME"

if [ ! -d "$APP_PATH" ]; then
  echo -e "${RED}✗${NC} Boardkit.app not found!"
  echo "  Expected at: $APP_PATH"
  exit 1
fi

# Create releases directory
mkdir -p "$PROJECT_ROOT/releases"

# Remove old DMG if exists
rm -f "$DMG_PATH"

# Create a temporary directory for DMG contents
TEMP_DMG_DIR=$(mktemp -d)
cp -R "$APP_PATH" "$TEMP_DMG_DIR/"

# Create symbolic link to Applications
ln -s /Applications "$TEMP_DMG_DIR/Applications"

# Create DMG using hdiutil
hdiutil create -volname "Boardkit" \
  -srcfolder "$TEMP_DMG_DIR" \
  -ov -format UDZO \
  "$DMG_PATH"

# Cleanup
rm -rf "$TEMP_DMG_DIR"

echo -e "${GREEN}✓${NC} DMG created"

# Step 4: Summary
echo ""
echo "=================================================="
echo -e "${GREEN}  Build Complete!${NC}"
echo "=================================================="
echo ""
echo "  DMG Location: releases/$DMG_NAME"
echo "  Size: $(du -h "$DMG_PATH" | cut -f1)"
echo ""
echo "  To share with friends:"
echo "  1. Send them the DMG file"
echo "  2. They should open it and drag Boardkit to Applications"
echo "  3. On first run: Right-click > Open (bypasses Gatekeeper)"
echo ""
