# 🔑 Configuração de Credenciais - Reset Primal

**Status:** ✅ Pronto para Produção
**Data:** 28 de janeiro de 2026
**Segurança:** 🔒 Credenciais protegidas (não commitadas)

---

## ⚠️ IMPORTANTE

**O arquivo `.env` contém credenciais sensíveis e NUNCA deve ser commitado ao Git.**

Este arquivo é mantido **APENAS LOCALMENTE** e está protegido pelo `.gitignore`.

---

## 📋 Credenciais Configuradas

### Account Principal
```
Email: seu_email_aqui@exemplo.com
```

⚠️ **Credenciais reais são mantidas apenas em `.env` local, nunca no Git**

### Hotmart
```
HOTMART_WEBHOOK_SECRET=seu_secret_aqui_gerado_no_hotmart
HOTMART_AFFILIATE_LINK=https://pay.hotmart.com/SEU_ID_AQUI
```
📝 Obter em: Hotmart > Integrações > Webhooks

### SendGrid
```
SENDGRID_API_KEY=SG.sua_chave_completa_aqui
SENDGRID_FROM_EMAIL=noreply@seu_dominio_verificado.com
```
📝 Obter em: SendGrid > Settings > API Keys (Mail Send permission)

### Google Analytics 4
```
GOOGLE_ANALYTICS_PROPERTY_ID=G-XXXXXXXXXX
GOOGLE_ANALYTICS_API_SECRET=seu_api_secret_aqui
```
📝 Obter em: GA4 Admin > Data Streams > API Secrets

### Facebook Pixel
```
FACEBOOK_PIXEL_ID=seu_pixel_id_aqui
FACEBOOK_PIXEL_TOKEN=seu_access_token_aqui
```
📝 Obter em: Facebook Business Manager > Events Manager

---

## ✅ Verificação de Segurança

- [x] `.env` está em `.gitignore`
- [x] `.env` nunca foi commitado ao Git
- [x] Credenciais são únicas por ambiente
- [x] SendGrid API key tem permissão limitada (Mail Send)
- [x] Hotmart secret foi validado
- [x] GitHub Push Protection detecta chaves vazadas

---

## 🚀 Deploy em Produção

### Em Servidor de Produção:

1. **Copiar arquivo `.env`** para servidor (via SSH/SCP, nunca via Git):
```bash
scp .env user@production-server:/var/www/reset-primal/.env
ssh user@production-server "chmod 600 /var/www/reset-primal/.env"
```

2. **Verificar permissões:**
```bash
ls -la .env
# Deve mostrar: -rw------- (600) - ninguém além do owner pode ler
```

3. **Testar credenciais em produção:**
```bash
npm start
curl http://localhost:3000/health
# Esperado: {"status":"ok",...}
```

4. **Verificar logs:**
```bash
tail -f logs/webhook-hotmart.log
# Esperado: Nenhum erro de credenciais
```

---

## 🔄 Rotação de Credenciais

Recomendado a cada **3 meses**:

### SendGrid
1. Ir em: https://app.sendgrid.com → Settings → API Keys
2. Gerar nova chave com nome "Reset Primal - [Data]"
3. Copiar chave para `.env` (HOTMART_API_KEY)
4. Remover chave antiga
5. Testar nova chave

### Hotmart
1. Ir em: https://app.hotmart.com → Integrações → Webhooks
2. Regenerar secret do webhook
3. Copiar novo secret para `.env` (HOTMART_WEBHOOK_SECRET)
4. Testar webhook

### Google Analytics 4
1. Ir em: https://analytics.google.com → Admin → Data Streams
2. Regenerar API Secret
3. Copiar para `.env` (GOOGLE_ANALYTICS_API_SECRET)

### Facebook
1. Ir em: https://business.facebook.com → Conversions → Manage Pixels
2. Gerar novo token de acesso
3. Copiar para `.env` (FACEBOOK_PIXEL_TOKEN)

---

## ⚠️ Se Credencial for Vazada

### IMEDIATAMENTE:

1. **Regenerar a credencial** na plataforma original
2. **Atualizar `.env` localmente**
3. **Fazer restart do servidor:**
```bash
npm start  # ou pm2 restart reset-primal-webhook
```

4. **Verificar GitHub:**
```bash
# Se credencial foi commitada por acaso:
git log --all --oneline | grep credencial
# Se encontrar, contatar suporte GitHub para remover do histórico
```

---

## 🔒 Segurança Checklist

- [x] `.env` nunca é commitado (protegido por .gitignore)
- [x] GitHub Push Protection está ativado (detecta secrets)
- [x] Credenciais são únicas (não reutilizadas entre ambientes)
- [x] SendGrid API key com permissões limitadas
- [x] Hotmart secret validado e funcional
- [x] GA4 rastreamento confirmado
- [x] Facebook Pixel ativo
- [x] Permissões do arquivo .env: 600 (somente owner)

---

## 📞 Referência Rápida

| Plataforma | Onde Obter | Validade | Ação |
|-----------|-----------|----------|------|
| Hotmart | Integrações > Webhooks | Indefinida | Regenerar se vazada |
| SendGrid | Settings > API Keys | Indefinida | Rotacionar a cada 3 meses |
| GA4 | Admin > Data Streams > API Secrets | Indefinida | Rotacionar a cada 3 meses |
| Facebook | Business Manager > Tokens | Até 60 dias* | Renovar antes do vencimento |

*Facebook tokens podem expirar - verificar regularmente

---

## 📝 Documentação Relacionada

- `RECOMENDACOES-SEGURANCA.md` - Guia completo de segurança
- `IMPLEMENTAR-CORRECOES.md` - Como implementar as correções
- `.env.template-COMPLETO` - Template de todas as variáveis
- `ANALISE-CODIGO-COMPLETA.md` - Análise detalhada de segurança

---

**Criado:** 28 de janeiro de 2026
**Status:** ✅ Credenciais Configuradas e Protegidas
**Última Atualização:** Agora
