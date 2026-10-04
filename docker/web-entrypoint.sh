#!/bin/sh
set -eu

: "${API_URL:?API_URL is required for container runtime configuration}"
case "$API_URL" in
  *[![:print:]]*) echo "API_URL contains non-printable characters" >&2; exit 1 ;;
esac
escaped=$(printf '%s' "$API_URL" | sed 's/\\/\\\\/g; s/"/\\"/g')
printf 'window.__API_URL__ = "%s";\n' "$escaped" > /usr/share/nginx/html/config.js
exit 0
