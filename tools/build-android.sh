#!/usr/bin/env bash
# Builds the Nourish & Strengthen web bundle into android/app/src/main/assets/public/
# and compiles both the sideloadable Release APK and Google Play Store AAB bundle.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -d "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
  export PATH="$JAVA_HOME/bin:/opt/homebrew/bin:$PATH"
fi
if [ -d "/opt/homebrew/share/android-commandlinetools" ]; then
  export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
fi
if [ -f "$HOME/.android/nourish-release.jks" ]; then
  export ANDROID_KEYSTORE_PATH="$HOME/.android/nourish-release.jks"
  export ANDROID_KEYSTORE_PASSWORD="${ANDROID_KEYSTORE_PASSWORD:-nourish123}"
  export ANDROID_KEY_ALIAS="${ANDROID_KEY_ALIAS:-nourish}"
  export ANDROID_KEY_PASSWORD="${ANDROID_KEY_PASSWORD:-nourish123}"
fi

echo "1. Building minified web app into android/app/src/main/assets/public..."
node tools/build-site.js android/app/src/main/assets/public

echo "2. Building signed Android APK & Play Store AAB..."
cd "$ROOT/android"
if [ -x "./gradlew" ]; then
  ./gradlew assembleRelease bundleRelease --no-daemon
elif command -v gradle >/dev/null 2>&1; then
  gradle assembleRelease bundleRelease --no-daemon
else
  echo "Error: Gradle not found."
  exit 1
fi

cp app/build/outputs/apk/release/app-release.apk "$HOME/Downloads/nourish-and-strengthen.apk"
cp app/build/outputs/bundle/release/app-release.aab "$HOME/Downloads/nourish-and-strengthen.aab"
rm -rf "$ROOT/android/app/src/main/assets/public"

echo "Done:"
echo "  APK: $HOME/Downloads/nourish-and-strengthen.apk"
echo "  AAB: $HOME/Downloads/nourish-and-strengthen.aab"
