#!/usr/bin/env bash
# Builds the Android release APK.
#
# Usage: bash scripts/build-apk.sh [--clean]
#
# Needs a JDK 17 and an Android SDK. They are read from the environment:
#   JAVA_HOME         JDK 17 (optional if `java` 17 is already on PATH)
#   ANDROID_HOME      Android SDK (or ANDROID_SDK_ROOT)
# Optional:
#   APK_OUT_DIR       where the final APK is copied (default: ./dist)
#   GRADLE_JVM_ARGS   JVM args for Gradle (default: -Xmx4g -XX:MaxMetaspaceSize=1g)
#   GRADLE_WORKERS    max Gradle workers (default: Gradle decides)
#   GRADLE_USER_HOME  Gradle cache directory (default: Gradle decides)
#
# If scripts/env.local.sh exists (it is git-ignored), it is sourced first, so you
# can keep your own paths there instead of exporting them every time.
set -euo pipefail
cd "$(dirname "$0")/.."
APP_DIR="$PWD"

if [[ -f scripts/env.local.sh ]]; then
  # shellcheck disable=SC1091
  source scripts/env.local.sh
fi

ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [[ -z "$ANDROID_HOME" ]]; then
  echo "Erro: defina ANDROID_HOME (ou ANDROID_SDK_ROOT) apontando para o Android SDK." >&2
  exit 1
fi
export ANDROID_HOME
export ANDROID_SDK_ROOT="$ANDROID_HOME"
if [[ -n "${JAVA_HOME:-}" ]]; then
  export JAVA_HOME
  export PATH="$JAVA_HOME/bin:$PATH"
fi
export PATH="$ANDROID_HOME/platform-tools:$PATH"
export NODE_ENV=production

if [[ "${1:-}" == "--clean" || ! -d android ]]; then
  CI=1 npx expo prebuild --platform android --no-install --clean
fi

echo "sdk.dir=$ANDROID_HOME" > android/local.properties

GRADLE_ARGS=(assembleRelease --no-daemon -x lint "-Dorg.gradle.jvmargs=${GRADLE_JVM_ARGS:--Xmx4g -XX:MaxMetaspaceSize=1g}")
if [[ -n "${GRADLE_WORKERS:-}" ]]; then
  GRADLE_ARGS+=("-Dorg.gradle.workers.max=$GRADLE_WORKERS")
fi

(cd android && ./gradlew "${GRADLE_ARGS[@]}")

APK="$APP_DIR/android/app/build/outputs/apk/release/app-release.apk"
OUT_DIR="${APK_OUT_DIR:-$APP_DIR/dist}"
mkdir -p "$OUT_DIR"
VERSION=$(node -p "require('$APP_DIR/app.json').expo.version")
cp "$APK" "$OUT_DIR/EngineerAcademy-v$VERSION.apk"
echo "APK pronto: $OUT_DIR/EngineerAcademy-v$VERSION.apk"
