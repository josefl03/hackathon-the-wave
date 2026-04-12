#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${AEMET_API_KEY:-}" ]]; then
  echo "AEMET_API_KEY is required in the environment" >&2
  exit 1
fi

url="https://opendata.aemet.es/opendata/api/maestro/municipios"
output_dir="outputs/$(basename "$0" .sh)"
mkdir -p "$output_dir"
response="$(curl -sS -H "api_key: ${AEMET_API_KEY}" "$url")"
printf '%s' "$response" > "$output_dir/response.json"

datos_url="$(echo "$response" | jq -r '.datos // empty')"
if [[ -z "$datos_url" || "$datos_url" == "null" ]]; then
  echo "$response" | jq .
  exit 0
fi

curl -sS "$datos_url" | tee "$output_dir/datos.json" | jq -r '
  .[]
  | select(
      (.nombre // "" | test("Guadalajara|Sig�enza|Sigüenza|Molina de Aragón|Cifuentes|Atienza|Jadraque|Brihuega|Pastrana|Tamajón|Orea|Peralejos de las Truchas|Corduente|Zaorejas|Arroyo de las Fraguas|Checa|Alcolea del Pinar"; "i"))
      or (.capital // "" | test("Guadalajara|Sig�enza|Sigüenza|Molina de Aragón|Cifuentes|Atienza|Jadraque|Brihuega|Pastrana|Tamajón|Orea|Peralejos de las Truchas|Corduente|Zaorejas|Arroyo de las Fraguas|Checa|Alcolea del Pinar"; "i"))
    )
  | [.id_old, .nombre, .capital, .url]
  | @tsv
' | sort
