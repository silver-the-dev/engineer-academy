#!/usr/bin/env bash
# Builds the release APK using the toolchain stored in ../Dependencias.
# Usage: bash scripts/build-apk.sh [--clean]
set -euo pipefail
cd "$(dirname "$0")/.."
APP_DIR="$PWD"
DEPS="$(cd .. && pwd)/Dependencias"

export JAVA_HOME="$DEPS/jdk17"
export ANDROID_HOME="$DEPS/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export GRADLE_USER_HOME="$DEPS/gradle-home"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
export NODE_ENV=production

if [[ "${1:-}" == "--clean" || ! -d android ]]; then
  CI=1 npx expo prebuild --platform android --no-install --clean
fi

echo "sdk.dir=$ANDROID_HOME" > android/local.properties

cd android
./gradlew assembleRelease --no-daemon -x lint \
  -Dorg.gradle.jvmargs="-Xmx6g -XX:MaxMetaspaceSize=1g" \
  -Dorg.gradle.workers.max=14

APK="$APP_DIR/android/app/build/outputs/apk/release/app-release.apk"
OUT_DIR="$(cd "$APP_DIR/.." && pwd)/Entregas"
mkdir -p "$OUT_DIR"
VERSION=$(node -p "require('$APP_DIR/app.json').expo.version")
cp "$APK" "$OUT_DIR/EngineerAcademy-v$VERSION.apk"
echo "APK pronto: $OUT_DIR/EngineerAcademy-v$VERSION.apk"
