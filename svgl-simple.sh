#!/usr/bin/env bash
set -euo pipefail

# Invariant: resolve one SVGL item, pick one asset URL, then hand off the rest
# to existing CLI primitives (curl, jq, imgcat/kitten, qlmanage, sips).

API='https://api.svgl.app'
UA='svgl-skill-simple/0.1 (+https://github.com/saphid/svgl-skill)'
CMD="${1:-help}"
shift || true

usage() {
  cat <<'EOF'
svgl-simple.sh

Usage:
  svgl-simple.sh search <query> [limit]
  svgl-simple.sh inspect <query>
  svgl-simple.sh show <query> [theme:auto|light|dark] [icon|wordmark]
  svgl-simple.sh download <query> [svg|png|jpg|gif] [out]
  svgl-simple.sh convert <query> [png|jpg|gif] [out]
  svgl-simple.sh categories
EOF
}

need() { command -v "$1" >/dev/null || { echo "missing dependency: $1" >&2; exit 1; }; }
need curl
need jq

slug() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

json() { curl -fsSL -H "User-Agent: $UA" "$1"; }

ranked() {
  local query="$1" limit="${2:-5}"
  json "$API" | jq --arg q "$query" --argjson limit "$limit" '
    def lc: ascii_downcase;
    map(. + {
      _score: (
        (if (.title|lc) == ($q|lc) then 1000 else 0 end) +
        (if (.title|lc|contains($q|lc)) then 200 else 0 end) +
        (if ((.url // "")|lc|contains($q|lc)) then 20 else 0 end) +
        (if ((.brandUrl // "")|lc|contains($q|lc)) then 10 else 0 end)
      )
    })
    | map(select(._score > 0))
    | sort_by(-._score, .title)
    | .[:$limit]
    | map(del(._score))
  '
}

pick() {
  local query="$1"
  ranked "$query" 10 | jq 'first'
}

asset_url() {
  local item="$1" theme="${2:-auto}" kind="${3:-icon}"
  jq -rn --argjson item "$item" --arg theme "$theme" --arg kind "$kind" '
    (if $kind == "wordmark" and $item.wordmark != null then $item.wordmark else $item.route end) as $asset
    | if $asset == null then error("no asset")
      elif ($asset|type) == "string" then $asset
      elif $theme != "auto" and $asset[$theme] != null then $asset[$theme]
      else ($asset.light // $asset.dark // ($asset | to_entries[0].value))
      end
  '
}

save_svg() {
  local item="$1" theme="${2:-auto}" kind="${3:-icon}" out="$4"
  local url title
  url="$(asset_url "$item" "$theme" "$kind")"
  title="$(jq -r '.title' <<<"$item")"
  mkdir -p "$(dirname "$out")"
  curl -fsSL -H "User-Agent: $UA" "$url" > "$out"
  echo "Saved $title -> $out"
}

render_raster() {
  local svg="$1" format="$2" out="$3" size="${4:-512}"
  need qlmanage
  need sips
  local tmp png
  tmp="$(mktemp -d)"
  qlmanage -t -s "$size" -o "$tmp" "$svg" >/dev/null 2>&1
  png="$tmp/$(basename "$svg").png"
  mkdir -p "$(dirname "$out")"
  if [[ "$format" == png ]]; then
    cp "$png" "$out"
  else
    sips -s format "$format" "$png" --out "$out" >/dev/null
  fi
}

case "$CMD" in
  search)
    query="${1:?query required}"
    limit="${2:-5}"
    ranked "$query" "$limit" | jq -r '.[] | "\(.title) [\((.category|if type=="array" then join(", ") else . end))]\n  url: \(.url)\n  icon: \(.route|tojson)\n  wordmark: \((.wordmark // "")|tojson)\n"'
    ;;
  inspect)
    query="${1:?query required}"
    pick "$query" | jq .
    ;;
  show)
    query="${1:?query required}"
    theme="${2:-auto}"
    kind="${3:-icon}"
    item="$(pick "$query")"
    [[ "$item" != null ]] || { echo "no match for $query" >&2; exit 1; }
    svg="$(mktemp /tmp/svgl-show-XXXXXX.svg)"
    save_svg "$item" "$theme" "$kind" "$svg" >/dev/null
    if command -v imgcat >/dev/null && { [[ -n "${ITERM_SESSION_ID:-}" ]] || [[ "${TERM_PROGRAM:-}" == iTerm.app ]]; }; then
      imgcat "$svg"
    elif command -v kitten >/dev/null && { [[ -n "${KITTY_WINDOW_ID:-}" ]] || [[ "${TERM:-}" == xterm-kitty ]]; }; then
      kitten icat "$svg"
    else
      echo "$svg"
    fi
    ;;
  download|convert)
    query="${1:?query required}"
    format="${2:-$([[ "$CMD" == convert ]] && echo png || echo svg)}"
    item="$(pick "$query")"
    [[ "$item" != null ]] || { echo "no match for $query" >&2; exit 1; }
    title="$(jq -r '.title' <<<"$item")"
    base="$(slug "$title")"
    out="${3:-./$base.$format}"
    if [[ "$format" == svg ]]; then
      save_svg "$item" auto icon "$out"
    else
      tmp_svg="$(mktemp /tmp/svgl-src-XXXXXX.svg)"
      save_svg "$item" auto icon "$tmp_svg" >/dev/null
      render_raster "$tmp_svg" "$format" "$out" 512
      echo "Converted $title -> $out"
    fi
    ;;
  categories)
    json "$API/categories" | jq -r '.[] | "\(.category): \(.total)"'
    ;;
  help|--help|-h|'')
    usage
    ;;
  *)
    echo "unknown command: $CMD" >&2
    usage
    exit 1
    ;;
esac
