# Nginx Auth Request Configuration

Este documento descreve como configurar o Nginx para proteger recursos estáticos (e-books, cursos, etc.) usando o `auth_request` directive.

## Visão Geral

O fluxo funciona assim:

```
1. Usuário acessa: GET /ebook/index.html
2. Nginx intercepta e faz subrequest para: GET /api/auth/verify-access
3. Backend verifica JWT e compra do produto
4. Se 200 OK: Nginx serve o arquivo
5. Se 401/403: Nginx redireciona para login
```

## Arquivo de Configuração Nginx

### Localização padrão
- **Linux/Mac:** `/etc/nginx/sites-available/reset-primal`
- **Docker:** `/etc/nginx/conf.d/reset-primal.conf`

### Configuração Completa

```nginx
# ════════════════════════════════════════════════════════════════
# Reset Primal - Nginx Configuration with Auth Request
# ════════════════════════════════════════════════════════════════

upstream backend {
  server localhost:3000;
  keepalive 32;
}

server {
  listen 80;
  listen [::]:80;

  server_name resetprimal.com.br www.resetprimal.com.br;

  # Redirect HTTP to HTTPS (optional, recommended for production)
  # return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;

  server_name resetprimal.com.br www.resetprimal.com.br;

  # SSL Certificates
  ssl_certificate /etc/letsencrypt/live/resetprimal.com.br/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/resetprimal.com.br/privkey.pem;

  # ════════════════════════════════════════════════════════════════
  # Auth Request Subrequest Endpoint (INTERNAL ONLY)
  # ════════════════════════════════════════════════════════════════

  # This location handles the auth_request subrequest
  # It's only accessible internally from Nginx
  location = /api/auth/verify-access {
    internal;  # Mark as internal - not accessible from browser

    # Proxy to backend
    proxy_pass http://backend;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";

    # Pass original request info
    proxy_set_header X-Original-URI $request_uri;
    proxy_set_header X-Original-METHOD $request_method;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Forward Authorization header from request
    proxy_set_header Authorization $http_authorization;

    # Timeout for auth check (should be quick)
    proxy_connect_timeout 5s;
    proxy_send_timeout 5s;
    proxy_read_timeout 5s;
  }

  # ════════════════════════════════════════════════════════════════
  # Protected E-book Location
  # ════════════════════════════════════════════════════════════════

  location /ebook/ {
    # Check authentication before serving files
    auth_request /api/auth/verify-access;

    # Redirect to login if unauthorized
    auth_request_set $auth_status $upstream_status;
    error_page 401 = @error401;
    error_page 403 = @error403;

    # Serve files from document root
    root /var/www/reset-primal;

    # Try exact file, then directory, then 404
    try_files $uri $uri/ =404;

    # Add security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";

    # Enable gzip compression for PDFs
    gzip on;
    gzip_types application/pdf;
  }

  # ════════════════════════════════════════════════════════════════
  # Protected Courses Location (FUTURE)
  # ════════════════════════════════════════════════════════════════

  location /courses/ {
    auth_request /api/auth/verify-access;
    error_page 401 = @error401;
    error_page 403 = @error403;

    root /var/www/reset-primal;
    try_files $uri $uri/ =404;
  }

  # ════════════════════════════════════════════════════════════════
  # Protected Premium Content (FUTURE)
  # ════════════════════════════════════════════════════════════════

  location /premium/ {
    auth_request /api/auth/verify-access;
    error_page 401 = @error401;
    error_page 403 = @error403;

    root /var/www/reset-primal;
    try_files $uri $uri/ =404;
  }

  # ════════════════════════════════════════════════════════════════
  # Public Content (Not Protected)
  # ════════════════════════════════════════════════════════════════

  location / {
    # Proxy requests to backend
    proxy_pass http://backend;
    proxy_http_version 1.1;

    # Keep-alive headers
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }

  # ════════════════════════════════════════════════════════════════
  # Error Handlers
  # ════════════════════════════════════════════════════════════════

  location @error401 {
    # Redirect to login with return URL
    return 302 /login?redirect=$request_uri;
  }

  location @error403 {
    # Forbidden - user authenticated but no permission
    return 403 "Access Denied - You don't have permission to access this resource";
  }

  # ════════════════════════════════════════════════════════════════
  # API Backend Proxy
  # ════════════════════════════════════════════════════════════════

  location /api/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;

    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /webhook/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;

    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  # ════════════════════════════════════════════════════════════════
  # Static Files Cache
  # ════════════════════════════════════════════════════════════════

  location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 7d;
    add_header Cache-Control "public, immutable";
  }

  # ════════════════════════════════════════════════════════════════
  # Deny Access to Sensitive Files
  # ════════════════════════════════════════════════════════════════

  location ~ /\. {
    deny all;
  }

  location ~ ~$ {
    deny all;
  }
}
```

## Setup Passo a Passo

### 1. Criar arquivo de configuração

```bash
sudo nano /etc/nginx/sites-available/reset-primal
# Cole a configuração acima
```

### 2. Habilitar o site

```bash
sudo ln -s /etc/nginx/sites-available/reset-primal \
           /etc/nginx/sites-enabled/reset-primal
```

### 3. Testar sintaxe

```bash
sudo nginx -t
```

### 4. Recarregar Nginx

```bash
sudo systemctl reload nginx
```

## Testes Manuais

### Testar acesso sem autenticação (deve bloquear)

```bash
curl -v https://resetprimal.com.br/ebook/
# Esperado: 302 Redirect para /login
```

### Testar com token válido

```bash
TOKEN=$(curl -s -X POST https://resetprimal.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente1@example.com","password":"senha123"}' | jq -r '.token')

curl -v -H "Authorization: Bearer $TOKEN" \
     https://resetprimal.com.br/ebook/index.html
# Esperado: 200 OK (arquivo servido)
```

### Testar com token inválido

```bash
curl -v -H "Authorization: Bearer invalid_token" \
     https://resetprimal.com.br/ebook/
# Esperado: 401 Unauthorized → Redirect para /login
```

## Monitoramento

### Ver logs de auth_request

```bash
tail -f /var/log/nginx/error.log | grep auth_request
```

### Metrics Importantes

```bash
# Requests auth bem-sucedidos
grep "api/auth/verify-access.*200" /var/log/nginx/access.log | wc -l

# Requests auth falhados
grep "api/auth/verify-access.*403" /var/log/nginx/access.log | wc -l

# Requests bloqueados
grep "ebook.*401" /var/log/nginx/access.log | wc -l
```

## Troubleshooting

### Erro: "auth_request directive not compiled"

```bash
# Instalar Nginx com auth_request
sudo apt-get install nginx-extras
```

### Erro: "subrequest returns 500"

Verificar:
1. Backend está rodando? `ps aux | grep node`
2. Porta 3000 acessível? `curl localhost:3000/health`
3. JWT_SECRET definido no .env?
4. Logs do backend: `tail -f logs/error.log`

### Performance Lenta

Aumentar timeouts ou usar cache:

```nginx
location = /api/auth/verify-access {
  # ... config ...

  # Cache resultado por 10 segundos
  auth_request_set $auth_status $upstream_status;
  auth_request_set $auth_user $upstream_http_x_auth_user;

  proxy_cache api_cache;
  proxy_cache_valid 200 10s;
  proxy_cache_key "$http_authorization";
}
```

## Segurança

- ✅ `auth_request` é feito internamente (não exposto ao cliente)
- ✅ Token JWT validado a cada request
- ✅ Suporte a HTTPS/TLS
- ✅ Headers de segurança adicionados
- ✅ Fails closed (nega acesso em erro)

## Próximas Fases

- [ ] Cache de permissões para melhor performance
- [ ] Rate limiting no endpoint verify-access
- [ ] 2FA validation
- [ ] IP whitelisting (opcional)
- [ ] Geo-blocking (opcional)
