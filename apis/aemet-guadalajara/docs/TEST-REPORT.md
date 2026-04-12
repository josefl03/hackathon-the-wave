# Connection Test Report

## Tested request
```bash
curl -H 'api_key: <AEMET_API_KEY>' \
  'https://opendata.aemet.es/opendata/api/incendios/mapasriesgo/estimado/area/p'
```

## Observed response
```json
{
  "descripcion": "No hay datos que satisfagan esos criterios",
  "estado": 404
}
```

## Interpretation
- Authentication works.
- The endpoint is reachable.
- The current query returned no dataset for `area=p` at test time.

## Notes
- A valid AEMET response may still be `404` if there is no current product available.
- This is different from `401`, which would indicate a key/auth problem.
