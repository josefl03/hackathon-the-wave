# AEMET fire-risk connection

Concise technical notes for the AEMET OpenData fire-risk endpoint.

## What was tested
- Endpoint: `GET /opendata/api/incendios/mapasriesgo/estimado/area/{area}`
- Area codes: `p` = Península y Baleares, `c` = Canarias
- Auth: header `api_key: <AEMET_API_KEY>`

## Result
- The API key was accepted.
- The live request returned `404` with `{"descripcion":"No hay datos que satisfagan esos criterios","estado":404}`.

## Files
- `API.md`: endpoint and response contract
- `TEST-REPORT.md`: live validation result
- `TROUBLESHOOTING.md`: common failure modes
- `resolve-aemet-guadalajara-or-alto-tajo.sh`: resolver that prefers Alto Tajo and falls back to Guadalajara
- `outputs/<script-name>/`: exact raw responses captured per script
