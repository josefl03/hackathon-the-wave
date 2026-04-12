# Fuentes de Datos

## AVAMET Estaciones
URL: `https://terramapas.icv.gva.es/0508_AVAMET`

| Campo | Valor exacto | Unidad habitual | Rango normal orientativo |
|---|---|---:|---:|
| `temp` | Temperatura actual | `°C` | `-10` a `40` |
| `hrel` | Humedad relativa | `%` | `0` a `100` |
| `pres` | Presión atmosférica | `hPa` | `980` a `1035` |
| `prec` | Precipitación acumulada del día | `mm` | `0` a `100+` |
| `vent_vel` | Velocidad del viento actual | `m/s` o `km/h` según estación | `0` a `20` |
| `vent_dir` | Dirección del viento | grados cardinales/texto | `0` a `360` |
| `vent_dir_360` | Dirección del viento normalizada | grados (`0-360`) | `0` a `360` |
| `vent_max` | Racha máxima del día | `m/s` o `km/h` según estación | `0` a `30+` |
| `webcam` | URL de webcam asociada | URL | no aplica |
| `urlmxo` | Enlace a la estación en AVAMET | URL | no aplica |
| `actualitzacio` | Fecha/hora de última actualización | timestamp | no aplica |

## RVVCCA ICA
URL: `https://terramapas.icv.gva.es/0503_CalidadAire`

| Campo | Valor exacto | Unidad habitual | Rango normal orientativo |
|---|---|---:|---:|
| `stvalue` | Índice de calidad del aire | índice ICA | `1` a `5` |
| `so2value` | Dióxido de azufre | `µg/m³` | `0` a `350+` |
| `no2value` | Dióxido de nitrógeno | `µg/m³` | `0` a `200+` |
| `pm25value` | Partículas finas PM2.5 | `µg/m³` | `0` a `50+` |
| `pm10value` | Partículas PM10 | `µg/m³` | `0` a `100+` |
| `o3value` | Ozono | `µg/m³` | `0` a `180+` |
| `timeinstant` | Momento de medición | timestamp | no aplica |
| `url_cas` | Ficha de estación en castellano | URL | no aplica |
| `url_val` | Ficha de estación en valenciano | URL | no aplica |

Nota: los rangos son orientativos para lectura rápida, no límites normativos.
