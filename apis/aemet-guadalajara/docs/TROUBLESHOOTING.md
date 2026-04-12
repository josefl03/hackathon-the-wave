# Troubleshooting

## 401 Unauthorized
- Check the `api_key` header value.
- Do not use `Authorization: Bearer ...`.
- Ensure the key has not been revoked.

## 404 No data
- This can mean the request is valid but the product is not currently available.
- Try the other area code (`c` if you used `p`).

## 429 Too many requests
- Slow down requests or add retry/backoff.

## Two-step data flow
1. Call the endpoint.
2. If `estado` is `200`, fetch the URL in `datos`.
