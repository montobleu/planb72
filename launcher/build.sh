#!/usr/bin/env bash
# Bouwt de PlanB72-startprogramma's voor alle ondersteunde platforms naar dist/.
set -euo pipefail
cd "$(dirname "$0")"
rm -rf dist
mkdir -p dist

# doel-OS/arch -> bestandsnaam
doelen=(
  "linux amd64 planb72-start-linux-amd64"
  "linux arm64 planb72-start-linux-arm64"
  "darwin amd64 planb72-start-mac-amd64"
  "darwin arm64 planb72-start-mac-arm64"
  "windows amd64 planb72-start-windows-amd64.exe"
  "windows arm64 planb72-start-windows-arm64.exe"
)

for d in "${doelen[@]}"; do
  read -r goos goarch naam <<<"$d"
  echo "Bouwen: $naam"
  CGO_ENABLED=0 GOOS="$goos" GOARCH="$goarch" \
    go build -trimpath -ldflags "-s -w" -o "dist/$naam" .
done

echo
echo "Groottes:"
for f in dist/*; do
  bytes=$(wc -c <"$f" | tr -d ' ')
  printf '  %-36s %6.2f MB\n' "$(basename "$f")" "$(echo "$bytes" | awk '{print $1/1048576}')"
done
