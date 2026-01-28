#!/bin/bash

# ════════════════════════════════════════════════════════════════
# SCRIPT: Testar Webhook Hotmart localmente
# Uso: bash scripts/test-webhook.sh [localhost|production]
# ════════════════════════════════════════════════════════════════

TARGET=${1:-localhost}
PORT=${2:-3000}

if [ "$TARGET" = "localhost" ]; then
    URL="http://localhost:$PORT/webhook/hotmart"
    ECHO_PREFIX="[DEV]"
else
    URL="https://resetprimal.com.br/webhook/hotmart"
    ECHO_PREFIX="[PROD]"
fi

echo "$ECHO_PREFIX Testando webhook Hotmart"
echo "$ECHO_PREFIX URL: $URL"
echo ""

# Gerar payload de teste
PAYLOAD=$(cat <<'PAYLOAD'
{
  "status": "completed",
  "buyer": {
    "name": "João Silva",
    "email": "joao@example.com",
    "cpf": "12345678901"
  },
  "sale": {
    "id": "12345",
    "price": 97.00
  }
}
PAYLOAD
)

echo "$ECHO_PREFIX Payload:"
echo "$PAYLOAD"
echo ""

# Testar sem assinatura (deve retornar 401)
echo "$ECHO_PREFIX Teste 1: POST sem assinatura (esperado: 401)"
curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\nHTTP Status: %{http_code}\n\n" \
  2>/dev/null

# Testar com assinatura inválida (deve retornar 401)
echo "$ECHO_PREFIX Teste 2: POST com assinatura inválida (esperado: 401)"
curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "x-hotmart-signature: invalidsignature" \
  -d "$PAYLOAD" \
  -w "\nHTTP Status: %{http_code}\n\n" \
  2>/dev/null

# Teste GET (deve retornar 200 com health check)
echo "$ECHO_PREFIX Teste 3: GET / (health check)"
curl -X GET "http://localhost:3000/" \
  -w "\nHTTP Status: %{http_code}\n\n" \
  2>/dev/null

echo "$ECHO_PREFIX ✅ Testes de webhook completos"
