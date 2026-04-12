#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${AEMET_API_KEY:-}" ]]; then
  echo "AEMET_API_KEY is required in the environment" >&2
  exit 1
fi

dia="${1:-1}"
area="${2:-p}"
url="https://opendata.aemet.es/opendata/api/incendios/mapasriesgo/previsto/dia/${dia}/area/${area}"
output_dir="outputs/$(basename "$0" .sh)"
mkdir -p "$output_dir"

response="$(curl -sS -H "api_key: ${AEMET_API_KEY}" "$url")"
printf '%s' "$response" > "$output_dir/response.json"

echo "$response" | jq .

estado="$(echo "$response" | jq -r '.estado // empty')"

if [[ "$estado" == "200" ]]; then
  datos_url="$(echo "$response" | jq -r '.datos // empty')"
  if [[ -n "$datos_url" && "$datos_url" != "null" ]]; then
    echo
    echo "Fetching datos payload: $datos_url"
    curl -sS "$datos_url" > "$output_dir/datos.png"
    file "$output_dir/datos.png"
  fi
fi
