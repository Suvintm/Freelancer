#!/bin/bash

# MaxMind GeoIP Download Script for Render
# Requires MAXMIND_LICENSE_KEY to be set in environment variables

set -e

GEOIP_DIR="./geoip"
mkdir -p $GEOIP_DIR

if [ -z "$MAXMIND_LICENSE_KEY" ]; then
  echo "⚠️  MAXMIND_LICENSE_KEY is not set. Skipping GeoIP database download."
  exit 0
fi

echo "🌐 Downloading GeoIP Country database..."

# Download the tar.gz file
# -L: Follow redirects (CRITICAL for MaxMind CDN)
# -f: Fail on HTTP errors (don't create an empty file)
# -s: Silent mode
curl -sfL "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-Country&license_key=${MAXMIND_LICENSE_KEY}&suffix=tar.gz" -o geoip.tar.gz || {
  echo "⚠️ Warning: Failed to download GeoIP database. Please check your MAXMIND_LICENSE_KEY."
  echo "The app will still run, but region blocking will be disabled."
  exit 0
}

# Check if file is small (likely an error message instead of a database)
FILESIZE=$(stat -c%s "geoip.tar.gz")
if [ "$FILESIZE" -lt 1000 ]; then
  echo "⚠️ Warning: Downloaded file is too small ($FILESIZE bytes). It might be an error from MaxMind."
  echo "Skipping GeoIP extraction to prevent build failure."
  rm -f geoip.tar.gz
  exit 0
fi

# Extract the .mmdb file from the tarball
tar -xzf geoip.tar.gz --strip-components=1 -C $GEOIP_DIR --wildcards "*.mmdb"

# Cleanup
rm geoip.tar.gz

echo "✅ GeoIP database downloaded and extracted successfully to $GEOIP_DIR"
