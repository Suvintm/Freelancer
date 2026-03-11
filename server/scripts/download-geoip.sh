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
curl -s "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-Country&license_key=${MAXMIND_LICENSE_KEY}&suffix=tar.gz" -o geoip.tar.gz

# Extract the .mmdb file from the tarball
# The tarball contains a folder like GeoLite2-Country_20240311/GeoLite2-Country.mmdb
tar -xzf geoip.tar.gz --strip-components=1 -C $GEOIP_DIR --wildcards "*.mmdb"

# Cleanup
rm geoip.tar.gz

echo "✅ GeoIP database downloaded and extracted successfully to $GEOIP_DIR"
