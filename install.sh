#!/bin/sh
set -e

REPO="88xorg/ssh-manager"
INSTALL_DIR="/usr/local/bin"
BINARY="sshm"

# Detect OS and architecture
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
  x86_64|amd64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "Error: unsupported architecture $ARCH"; exit 1 ;;
esac

case "$OS" in
  darwin|linux) ;;
  *) echo "Error: unsupported OS $OS"; exit 1 ;;
esac

ASSET="sshm-${OS}-${ARCH}"
URL="https://github.com/${REPO}/releases/latest/download/${ASSET}"

echo "Downloading ${ASSET}..."
curl -fSL "$URL" -o "/tmp/${BINARY}"

chmod +x "/tmp/${BINARY}"

echo "Installing to ${INSTALL_DIR}/${BINARY} (may require sudo)..."
if [ -w "$INSTALL_DIR" ]; then
  mv "/tmp/${BINARY}" "${INSTALL_DIR}/${BINARY}"
else
  sudo mv "/tmp/${BINARY}" "${INSTALL_DIR}/${BINARY}"
fi

echo "✓ sshm installed! Run 'sshm' to get started."
