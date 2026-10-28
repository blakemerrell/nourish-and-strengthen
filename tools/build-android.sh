#!/usr/bin/env bash
# Builds the Nourish & Strengthen web bundle into android/app/src/main/assets/public/
# and compiles both the sideloadable Release APK and Google Play Store AAB bundle.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "1. Building minified web app into android/app/src/main/assets/public..."
node tools/build-site.js android/app/src/main/assets/public

echo "2. Building Android APK & Play Store AAB..."
cd "$ROOT/android"
if command -v gradle >/dev/null 2>&1; then
  gradle assembleRelease bundleRelease --no-daemon
elif [ -x "./gradlew" ]; then
  ./gradlew assembleRelease bundleRelease --no-daemon
else
  echo "Note: Gradle / Android SDK not installed locally. Run in GitHub Actions (android/android.yml) or install Android Studio."
  exit 0
fi

echo "Done:"
echo "  APK: android/app/build/outputs/apk/release/app-release.apk"
echo "  AAB: android/app/build/outputs/bundle/release/app-release.aab"
