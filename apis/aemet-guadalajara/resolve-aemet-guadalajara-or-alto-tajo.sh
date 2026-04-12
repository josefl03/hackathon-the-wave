#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${AEMET_API_KEY:-}" ]]; then
  echo "AEMET_API_KEY is required in the environment" >&2
  exit 1
fi

target_name="alto tajo"
fallback_name="Guadalajara"
output_dir="outputs/$(basename "$0" .sh)"
mkdir -p "$output_dir"

meta_url="https://opendata.aemet.es/opendata/api/maestro/municipios"
meta_response="$(curl -sS -H "api_key: ${AEMET_API_KEY}" "$meta_url")"
datos_url="$(echo "$meta_response" | jq -r '.datos // empty')"

if [[ -z "$datos_url" || "$datos_url" == "null" ]]; then
  echo "$meta_response" | jq .
  exit 1
fi

payload="$(curl -sS "$datos_url")"
printf '%s' "$payload" > "$output_dir/municipios.json"

match="$(echo "$payload" | jq -r --arg target "$target_name" '
    .[]
    | select(
      ((.nombre // "") | test($target; "i"))
      or ((.capital // "") | test($target; "i"))
      or ((.url // "") | test("alto-tajo"; "i"))
    )
    | [(.id | sub("^id"; "")), .nombre, .capital, .url]
    | @tsv
' | head -n 1 || true)"

if [[ -n "$match" ]]; then
  printf '%s\n' "$match"
  exit 0
fi

fallback="$(echo "$payload" | jq -r --arg fallback "$fallback_name" '
    .[]
    | select((.nombre // "") == $fallback or (.capital // "") == $fallback)
    | [(.id | sub("^id"; "")), .nombre, .capital, .url]
    | @tsv
' | head -n 1 || true)"

if [[ -n "$fallback" ]]; then
  printf '%s\n' "$fallback"
  exit 0
fi

echo "No Alto Tajo or Guadalajara match found" >&2
exit 1
