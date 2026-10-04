#!/usr/bin/env bash
# One-time install of the offline voice engine used by scripts/voice.mjs:
# sherpa-onnx (static Linux x64 binary) + Kokoro v1.0 (53 voices, Apache-2.0). ~400 MB, all from GitHub releases.
#   bash scripts/setup-tts.sh            -> ~/.cache/brand-motion/tts
#   TTS_DIR=/somewhere bash scripts/setup-tts.sh
set -euo pipefail
DIR="${TTS_DIR:-$HOME/.cache/brand-motion/tts}"
VER="${SHERPA_VERSION:-v1.12.15}"
mkdir -p "$DIR" && cd "$DIR"
if [ ! -x "sherpa-onnx-$VER-linux-x64-static/bin/sherpa-onnx-offline-tts" ]; then
  echo "downloading sherpa-onnx $VER ..."
  curl -fsSL "https://github.com/k2-fsa/sherpa-onnx/releases/download/$VER/sherpa-onnx-$VER-linux-x64-static.tar.bz2" | tar xj
fi
if [ ! -f kokoro-multi-lang-v1_0/model.onnx ]; then
  echo "downloading Kokoro v1.0 voices ..."
  curl -fsSL "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2" | tar xj
fi
echo "TTS ready in $DIR"
