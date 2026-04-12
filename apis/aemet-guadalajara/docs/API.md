# AEMET Fire-Risk API

## Base
- Spec: `https://opendata.aemet.es/AEMET_OpenData_specification.json`
- Server: `https://opendata.aemet.es/opendata`

## Endpoint
```http
GET /api/incendios/mapasriesgo/estimado/area/{area}
```

### Path params
- `area`:
  - `p` = Península y Baleares
  - `c` = Canarias

## Auth
Use the API key as a header, not as `Authorization`.

```http
api_key: <AEMET_API_KEY>
```

## Response pattern
- `200`: returns a JSON object with metadata and a `datos` URL to the actual payload.
- `404`: no data available for the request.
- `401`: invalid or missing key.
- `429`: rate limit exceeded.

## Example
```bash
curl -H 'api_key: <AEMET_API_KEY>' \
  'https://opendata.aemet.es/opendata/api/incendios/mapasriesgo/estimado/area/p'
```

## Follow-up fetch
If the first response is `200`, fetch the URL in `datos` to get the final dataset.
