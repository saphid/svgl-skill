#!/usr/bin/env bash
set -euo pipefail

name="${1:-}"
[[ -n "$name" ]] || { echo "Usage: ./svgl-simple.sh <name> [out.svg]" >&2; exit 1; }
out="${2:-$name.svg}"

url="$({
  curl -fsSL https://api.svgl.app |
    jq -r --arg name "$name" '
      .[]
      | select((.title | ascii_downcase) == ($name | ascii_downcase))
      | if (.route | type) == "string" then .route else (.route.light // .route.dark) end
    ' | head -n1
})"

[[ -n "$url" ]] || { echo "No SVGL icon found for \"$name\"" >&2; exit 1; }

curl -fsSL "$url" -o "$out"
echo "Saved $out"
