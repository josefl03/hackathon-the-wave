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

resolve_municipio() {
  local meta_url="https://opendata.aemet.es/opendata/api/maestro/municipios"
  local meta_response datos_url payload match fallback

  meta_response="$(curl -sS -H "api_key: ${AEMET_API_KEY}" "$meta_url")"
  printf '%s' "$meta_response" > "$output_dir/municipios-meta.json"
  datos_url="$(echo "$meta_response" | jq -r '.datos // empty')"

  if [[ -z "$datos_url" || "$datos_url" == "null" ]]; then
    echo "$meta_response" | jq . >&2
    return 1
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
    | (.id | sub("^id"; ""))
  ' | head -n 1 || true)"

  if [[ -n "$match" ]]; then
    printf '%s\n' "$match"
    return 0
  fi

  fallback="$(echo "$payload" | jq -r --arg fallback "$fallback_name" '
    .[]
    | select((.nombre // "") == $fallback or (.capital // "") == $fallback)
    | (.id | sub("^id"; ""))
  ' | head -n 1 || true)"

  if [[ -n "$fallback" ]]; then
    printf '%s\n' "$fallback"
    return 0
  fi

  return 1
}

fetch_endpoint() {
  local label="$1"
  local path="$2"
  local file_label="${label// /-}"
  local response datos_url

  echo "== $label =="
  response="$(curl -sS -H "api_key: ${AEMET_API_KEY}" "https://opendata.aemet.es/opendata${path}")"
  printf '%s' "$response" > "$output_dir/${file_label}.json"
  echo "$response" | jq .

  datos_url="$(echo "$response" | jq -r '.datos // empty')"
  if [[ -n "$datos_url" && "$datos_url" != "null" ]]; then
    echo
    echo "-- datos --"
    curl -sS "$datos_url" | tee "$output_dir/${file_label}-datos.json" | jq .
  fi
}

municipio="$(resolve_municipio)"
echo "Resolved municipality code: $municipio"
echo

fetch_endpoint "Daily forecast" "/api/prediccion/especifica/municipio/diaria/${municipio}"
echo
fetch_endpoint "Hourly forecast" "/api/prediccion/especifica/municipio/horaria/${municipio}"
