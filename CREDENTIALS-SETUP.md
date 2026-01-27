# 🔐 Setup de Credenciais - Reset Primal

**Tempo estimado:** 30 minutos
**Dificuldade:** Fácil
**Risco:** Nenhum (apenas config)

---

## 📋 Checklist de Credenciais

Preencha **NA ORDEM** abaixo. Cada uma tem link direto.

### 1️⃣ HOTMART WEBHOOK SECRET
**⏱️ 5 min**

```bash
# Login: https://app.hotmart.com
# Caminho: Integrações → Webhooks → Criar novo

1. Acesse app.hotmart.com
2. Menu → Integrações → Webhooks
3. Clique "Criar novo webhook"
4. Preencha:
   - URL: https://resetprimal.com.br/webhook/hotmart
   - Eventos: PURCHASE_COMPLETE, PURCHASE_APPROVED
5. Clique "Gerar Secret"
6. Copie o secret (fica em um pop-up)
7. Salve em: .env → HOTMART_WEBHOOK_SECRET=seu_secret_aqui
```

✅ Verificação:
```bash
grep "HOTMART_WEBHOOK_SECRET" .env | grep -v "seu_secret"
# Deve retornar: HOTMART_WEBHOOK_SECRET=abc123def456...
```

---

### 2️⃣ GOOGLE ANALYTICS 4
**⏱️ 10 min**

```bash
# Login: https://analytics.google.com

1. Acesse analytics.google.com
2. Selecione propriedade "Reset Primal"
3. Menu (⚙️) → Admin → Propriedade
4. Copie "ID da Propriedade" (formato: G-XXXXXXXXXX)
5. Salve em: .env → GOOGLE_ANALYTICS_PROPERTY_ID=G-XXXXXXXXXX

# IMPORTANTE: Também substitua no HTML
# Arquivo: landing-page/index.html
# Procure por: G-PLACEHOLDER
# Substitua por seu ID real
```

✅ Verificação:
```bash
grep "GOOGLE_ANALYTICS_PROPERTY_ID=G-" .env
# Deve retornar: GOOGLE_ANALYTICS_PROPERTY_ID=G-XXX...

grep "G-" landing-page/index.html | head -2
# Deve mostrar seu ID (não PLACEHOLDER)
```

---

### 3️⃣ FACEBOOK PIXEL
**⏱️ 10 min**

```bash
# Login: https://business.facebook.com

1. Acesse business.facebook.com
2. Menu → Events Manager
3. Selecione seu Pixel "Reset Primal"
4. Copie o ID do Pixel (número grande, ex: 123456789)
5. Salve em: .env → FACEBOOK_PIXEL_ID=123456789

# IMPORTANTE: Também substitua no HTML
# Arquivo: landing-page/index.html
# Procure por: PIXEL-PLACEHOLDER
# Substitua por seu ID real
```

✅ Verificação:
```bash
grep "FACEBOOK_PIXEL_ID=[0-9]" .env
# Deve retornar: FACEBOOK_PIXEL_ID=123456789

grep "fbq.*init" landing-page/index.html
# Deve mostrar seu ID (não PLACEHOLDER)
```

---

### 4️⃣ GMAIL APP-SPECIFIC PASSWORD
**⏱️ 5 min**

⚠️ **IMPORTANTE:** Precisa de 2FA ativado!

```bash
# Login: https://myaccount.google.com

1. Acesse myaccount.google.com
2. Security (Segurança) → 2-Step Verification
   - Se não tem, ative primeiro
3. Volte em Security
4. App passwords
5. Selecione:
   - App: Mail
   - Device: Windows PC (ou seu SO)
6. Google gera senha de 16 caracteres
7. Copie a senha INTEIRA
8. Salve em: .env →
   GMAIL_USER=seu-email@gmail.com
   GMAIL_PASSWORD=xyzabc123def456g

# Exemplo:
# GMAIL_USER=joao@gmail.com
# GMAIL_PASSWORD=xyzabc123def456g
```

⚠️ **NÃO use sua senha normal do Gmail!**
Use APENAS a app-specific password.

✅ Verificação:
```bash
grep "GMAIL_USER\|GMAIL_PASSWORD" .env | grep -v "seu-email"
# Deve retornar ambas preenchidas
```

---

### 5️⃣ HOTMART AFFILIATE LINK (OPCIONAL)
**⏱️ 2 min**

```bash
# Se quiser customizar o link de afiliado

.env → HOTMART_AFFILIATE_LINK=https://pay.hotmart.com/YOUR_LINK_HERE

# Padrão está OK:
# https://pay.hotmart.com/W103146395W
```

---

## 🔄 SUBSTITUIÇÕES NO HTML

Depois de preencher `.env`, você PRECISA substituir os IDs no HTML também:

```bash
# Arquivo: landing-page/index.html

# 1. Substituir GA4
sed -i 's/G-PLACEHOLDER/G-SEU-ID-AQUI/g' landing-page/index.html

# 2. Substituir Facebook Pixel
sed -i 's/PIXEL-PLACEHOLDER/123456789/g' landing-page/index.html
```

Ou manualmente (em um editor):
- Abra: `landing-page/index.html`
- Procure: `G-PLACEHOLDER` → Substitua seu ID
- Procure: `PIXEL-PLACEHOLDER` → Substitua seu ID
- Salve

---

## ✅ VERIFICAÇÃO FINAL

```bash
# Verificar se .env está completo
cat .env | grep -v "^#" | grep -v "^$"

# Deve mostrar TODOS esses (sem placeholders):
# HOTMART_WEBHOOK_SECRET=abc123...
# HOTMART_AFFILIATE_LINK=https://...
# GOOGLE_ANALYTICS_PROPERTY_ID=G-...
# FACEBOOK_PIXEL_ID=12345...
# GMAIL_USER=seu-email@gmail.com
# GMAIL_PASSWORD=xyzabc...
```

```bash
# Verificar se HTML foi atualizado
grep -c "G-" landing-page/index.html
# Deve retornar > 0 (seus IDs estão lá)

grep -c "fbq('init'" landing-page/index.html
# Deve retornar > 0 (seu pixel está lá)
```

---

## 🎯 Checklist Final

- [ ] Hotmart webhook secret em `.env`
- [ ] GA4 ID em `.env`
- [ ] GA4 ID substituído em HTML
- [ ] Facebook Pixel ID em `.env`
- [ ] Facebook Pixel ID substituído em HTML
- [ ] Gmail user + password em `.env`
- [ ] Verificou que não há "PLACEHOLDER" no HTML
- [ ] Rodou `npm install` (dependências)

---

## 🆘 Problemas Comuns

### "Não acho o Google Analytics ID"
```
Analytics.google.com
  ↓
Selecione propriedade (Reset Primal)
  ↓
Admin (⚙️) → Propriedade
  ↓
ID da Propriedade (lado direito, em azul)
```

### "Facebook Pixel ID não aparece"
```
business.facebook.com
  ↓
Events Manager (ícone de pixel)
  ↓
Seu Pixel
  ↓
Settings
  ↓
Pixel ID (grande número)
```

### "Gmail está rejeitando a senha"
1. ✅ Ativou 2FA em myaccount.google.com?
2. ✅ Gerou app-specific password? (não usa senha normal)
3. ✅ Copiou a senha INTEIRA (16 caracteres)?
4. ✅ Testou: `npm install && node test-email.js`

---

## 🚀 Próximo Passo

Depois de completar tudo aqui:

```bash
bash deploy-quick.sh
```

Ele verificará se tudo está OK antes de fazer deploy!

---

**Criado:** 2025-01-27
**Status:** Ready for use
**Tempo:** ~30 min para completar
