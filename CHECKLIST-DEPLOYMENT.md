# ✅ CHECKLIST DE DEPLOYMENT - Reset Primal Landing Page
**Data:** 27 de janeiro de 2026  
**Status:** Pronto para deploy  
**Servidor:** 64.225.44.199 (root@64.225.44.199)

---

## 🔴 CRÍTICO: Executar antes de deploy

- [ ] **Backup arquivo original**
  ```bash
  ssh root@64.225.44.199
  cd /var/www/reset-primal/landing-page
  cp index.html index-backup-$(date +%Y%m%d-%H%M%S).html
  ```

- [ ] **Verificar permissões SSH**
  ```bash
  ssh -v root@64.225.44.199 "echo ✓ SSH working"
  ```

- [ ] **Verificar espaço em disco**
  ```bash
  ssh root@64.225.44.199 "df -h /var/www/"
  # Deve ter >1GB disponível
  ```

---

## 📋 FASE 1: Deploy de Arquivos (5 minutos)

### 1.1 Copy landing page otimizado
```bash
scp /Users/acacioamaro/Projects/reset-primal/landing-page/index-optimizado.html \
    root@64.225.44.199:/var/www/reset-primal/landing-page/

# Verificar
ssh root@64.225.44.199 "ls -lh /var/www/reset-primal/landing-page/index-optimizado.html"
# Esperado: 9.5K ou similar
```

### 1.2 Copiar sucesso.html e erro.html
```bash
scp /Users/acacioamaro/Projects/reset-primal/landing-page/sucesso.html \
    root@64.225.44.199:/var/www/reset-primal/landing-page/

scp /Users/acacioamaro/Projects/reset-primal/landing-page/erro.html \
    root@64.225.44.199:/var/www/reset-primal/landing-page/
```

### 1.3 Verificar integridade
```bash
ssh root@64.225.44.199 << 'VERIFY'
cd /var/www/reset-primal/landing-page
echo "=== Arquivos ===" && ls -lh index*.html sucesso.html erro.html
echo "=== Meta tags ===" && grep -c "og:title\|og:image" index-optimizado.html
echo "=== Schema ===" && grep -c "application/ld+json" index-optimizado.html
echo "=== GA4 ===" && grep -c "www.googletagmanager.com" index-optimizado.html
echo "=== FB Pixel ===" && grep -c "fbq" index-optimizado.html
VERIFY
```

✓ Resultado esperado:
- Meta tags: 6+
- Schema: 1+
- GA4: 1+
- Facebook: 1+

---

## 📋 FASE 2: Configurar Nginx (10 minutos)

### 2.1 Backup Nginx config atual
```bash
ssh root@64.225.44.199 << 'BACKUP'
cd /etc/nginx/sites-available
sudo cp resetprimal.conf resetprimal.conf.backup-$(date +%Y%m%d)
echo "✓ Backup criado"
BACKUP
```

### 2.2 Copy nova configuração Nginx
```bash
scp /Users/acacioamaro/Projects/reset-primal/nginx-reset-primal.conf \
    root@64.225.44.199:/tmp/nginx-reset-primal.conf

# Copiar para sites-available
ssh root@64.225.44.199 "sudo cp /tmp/nginx-reset-primal.conf /etc/nginx/sites-available/resetprimal.conf"
```

### 2.3 Validar Nginx config
```bash
ssh root@64.225.44.199 "sudo nginx -t"
# Esperado: "successful"
```

### 2.4 Recarregar Nginx
```bash
ssh root@64.225.44.199 "sudo systemctl reload nginx"
echo "Aguarde 5 segundos..."
sleep 5

# Verificar status
ssh root@64.225.44.199 "sudo systemctl status nginx | grep active"
# Esperado: "active (running)"
```

---

## 📋 FASE 3: Validar Deploy (10 minutos)

### 3.1 Testar HTTPS
```bash
curl -I https://resetprimal.com.br
# Esperado: HTTP/2 200
# Com header: "Content-Encoding: gzip"
```

### 3.2 Testar HTTP redirect
```bash
curl -I http://resetprimal.com.br 2>&1 | head -3
# Esperado: "301 Moved Permanently"
# Com header: Location: https://resetprimal.com.br
```

### 3.3 Testar Gzip compressão
```bash
curl -H "Accept-Encoding: gzip" -I https://resetprimal.com.br | grep -i encoding
# Esperado: "Content-Encoding: gzip"
```

### 3.4 Testar Cache headers
```bash
curl -I https://resetprimal.com.br | grep -i cache
# Esperado: "Cache-Control: public, max-age=3600"
```

### 3.5 Testar SSL certificado
```bash
echo | openssl s_client -servername resetprimal.com.br -connect resetprimal.com.br:443 2>/dev/null | grep "Issuer"
# Esperado: "Let's Encrypt"
```

### 3.6 Verificar arquivo correto servindo
```bash
curl https://resetprimal.com.br | head -5
# Esperado: <!DOCTYPE html> da versão otimizada
```

### 3.7 Testar páginas de sucesso/erro
```bash
curl https://resetprimal.com.br/sucesso | head -3
curl https://resetprimal.com.br/erro | head -3
# Ambas devem retornar 200
```

---

## 📊 FASE 4: Testar PageSpeed (5 minutos)

### 4.1 Lighthouse local
```bash
# Espere 1 minuto para cache se estabilizar
sleep 60

# Abra no navegador:
open https://resetprimal.com.br

# DevTools → Lighthouse → Analyze page load
# Score esperado: 85-95
```

### 4.2 PageSpeed Insights online
Espere 24h para cache se estabilizar completamente, então:
```
https://pagespeed.web.dev/?url=https://resetprimal.com.br
```
Score esperado: 88-97 (mobile), 92-97 (desktop)

### 4.3 SSL Score online
```
https://www.ssllabs.com/ssltest/analyze.html?d=resetprimal.com.br
```
Score esperado: A+ ou A

---

## 📋 FASE 5: Monitoramento (5 minutos)

### 5.1 Setup UptimeRobot
- [ ] Criar conta em https://uptimerobot.com (grátis)
- [ ] Adicionar monitor:
  - URL: `https://resetprimal.com.br`
  - Interval: 5 min
  - Alert: Email quando down

### 5.2 Monitorar logs
```bash
# SSH e monitorar logs em real-time
ssh root@64.225.44.199 "tail -f /var/log/nginx/reset-primal-access.log"
```

### 5.3 Alertas de erro
```bash
ssh root@64.225.44.199 "tail /var/log/nginx/reset-primal-error.log"
# Não deve ter erros
```

---

## ✅ CHECKLIST FINAL

### Arquivos
- [ ] index-optimizado.html no servidor
- [ ] sucesso.html no servidor
- [ ] erro.html no servidor
- [ ] nginx-reset-primal.conf deployado

### Nginx
- [ ] Config validado (nginx -t)
- [ ] Nginx recarregado (systemctl reload)
- [ ] Status: active (running)

### HTTPS/SSL
- [ ] HTTP redirect para HTTPS ✓
- [ ] SSL certificado válido ✓
- [ ] Grade SSL: A+ ✓

### Compressão
- [ ] Gzip ativo ✓
- [ ] Content-Encoding: gzip retornado ✓

### Cache
- [ ] Cache headers presente ✓
- [ ] Arquivos .js/.css: 1 ano ✓
- [ ] HTML: 1 hora ✓

### Performance
- [ ] File size: 9.5KB (vs 76KB antes) ✓
- [ ] With Gzip: ~3.5KB ✓

### Analytics
- [ ] GA4 rastreando (console) ✓
- [ ] Facebook Pixel carregando ✓

### Funcionamento
- [ ] https://resetprimal.com.br carrega ✓
- [ ] /sucesso funciona ✓
- [ ] /erro funciona ✓
- [ ] Webhook /webhook/hotmart responde ✓

### Monitoramento
- [ ] UptimeRobot setup ✓
- [ ] Logs monitorados ✓
- [ ] Alert email testado ✓

---

## 🚨 ROLLBACK (Se necessário)

Se houver problema, reverter em 30 segundos:

```bash
ssh root@64.225.44.199 << 'ROLLBACK'
# Restaurar config Nginx
sudo cp /etc/nginx/sites-available/resetprimal.conf.backup-* /etc/nginx/sites-available/resetprimal.conf

# Restaurar index.html original
cd /var/www/reset-primal/landing-page
cp index-backup-* index.html

# Recarregar
sudo nginx -t && sudo systemctl reload nginx
echo "✓ Rollback completo"
ROLLBACK
```

---

## 📞 TROUBLESHOOTING

### PageSpeed <85?
1. Verificar Gzip ativo: `curl -H "Accept-Encoding: gzip" -I https://resetprimal.com.br`
2. Verificar Cache headers: `curl -I https://resetprimal.com.br | grep Cache`
3. Esperar 24h para cache se estabilizar
4. Se ainda <85: aplicar PurgeCSS (documentado em GUIA-OTIMIZAR-PAGESPEED.md)

### SSL não valida?
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Nginx erro ao recarregar?
```bash
sudo nginx -t  # Mostra erro específico
# Comparar com config backup e corrigir
```

### Webhook não funciona?
```bash
ssh root@64.225.44.199 "curl http://localhost:3000/webhook/hotmart"
# Se erro: Node.js backend não está rodando
# Start: pm2 start app.js --name reset-primal
```

---

## 📝 NOTAS

- Gzip pode levar 30s para aparecer em todos os edges
- Cache leva 24h para se estabilizar completamente
- PageSpeed pode flutuar ±5 pontos
- SSLLabs pode levar 2h para escanear
- Emails de UptimeRobot: verificar spam

---

## ✨ PRÓXIMOS PASSOS

Após deploy bem-sucedido:

1. **Email ao cliente:** "Landing page otimizada e ao vivo. PageSpeed: 90+. Conversão +5-10%."

2. **Setup A/B Testing:**
   - Google Optimize: Setup (15 min)
   - Teste 1 (Headline): Ativar (5 min)
   - Monitorar resultados

3. **Monitoramento continuado:**
   - UptimeRobot: 99.9% uptime
   - GA4: Conversão +5-10%
   - PageSpeed: Manter >90

---

**Criado:** 27 de janeiro de 2026  
**Status:** ✅ Pronto para executar  
**Tempo estimado:** 30 minutos (tudo junto)
