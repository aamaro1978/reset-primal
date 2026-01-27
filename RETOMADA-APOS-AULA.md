# 📚 RETOMADA APÓS AULA - Reset Primal

**👋 Bem-vindo de volta!**

---

## ⏱️ VOCÊ ESTÁ AQUI

```
Fase 1: Landing + Backend    ✅ COMPLETO
Fase 2: Deploy               ⏳ 95% PRONTO
├─ Código                    ✅ PRONTO
├─ Documentação              ✅ PRONTA
├─ Credenciais               ✅ CONFIGURADAS
├─ Deploy Script             ✅ PRONTO
└─ Copiar Projeto            ⏳ PRÓXIMO PASSO
Fase 3: Otimizações          📅 DOCUMENTADO
```

---

## 🎯 O QUE FAZER AGORA (30 MINUTOS)

### PASSO 1: Resolver GitHub (5 min)

**Você tem 3 opções:**

#### **Opção A: GitHub Token (MAIS FÁCIL)** ✅ Recomendado

Ler: `GITHUB-SETUP-RAPIDO.md`

```bash
# Gerar em: https://github.com/settings/tokens
# Token exemplo: ghp_abc123xyz...

# Depois clonar:
git clone https://ghp_abc123xyz@github.com/seu-usuario/reset-primal.git

# Copiar para servidor:
scp -r reset-primal/* root@64.225.44.199:/var/www/reset-primal/
```

#### **Opção B: TAR Comprimido (SEM GIT)**

```bash
# Aqui no seu computador:
tar -czf reset-primal.tar.gz /Users/acacioamaro/Projects/reset-primal/
scp reset-primal.tar.gz root@64.225.44.199:/var/www/

# No servidor:
cd /var/www
tar -xzf reset-primal.tar.gz
rm reset-primal.tar.gz
```

#### **Opção C: SSH Key**

Se já tem SSH key no GitHub:
```bash
git clone git@github.com:seu-usuario/reset-primal.git
```

---

### PASSO 2: Verificar Projeto (2 min)

**No servidor SSH:**

```bash
ssh root@64.225.44.199

# Verificar
ls -la /var/www/reset-primal/
cat /var/www/reset-primal/.env | grep HOTMART

# Deve aparecer:
# HOTMART_WEBHOOK_SECRET=upan5FYAJLzL2nA46gm9...
# GOOGLE_ANALYTICS_PROPERTY_ID=G-KKTGW6BEJP
# FACEBOOK_PIXEL_ID=1164114415287965
# GMAIL_USER=singullarco@gmail.com
# GMAIL_PASSWORD=oxluiocfahqgmojz
```

Se tudo aparecer, continue para o próximo passo! ✅

---

### PASSO 3: Deploy Automático (5 min)

**No servidor SSH:**

```bash
cd /var/www/reset-primal
chmod +x deploy-producao.sh
sudo bash deploy-producao.sh
```

O script vai fazer:
- ✅ Instalar Nginx
- ✅ Gerar SSL/HTTPS
- ✅ Start PM2 webhook
- ✅ Verificar tudo

**⏱️ Vai levar ~2-3 minutos**

Quando terminar, deve mostrar: `✅ DEPLOYMENT COMPLETADO!`

---

### PASSO 4: Configurar Hotmart (5 min) - MANUAL

**No navegador (não no servidor):**

1. Acesse: https://app.hotmart.com
2. Produtos → Reset Primal → Integrações → Webhooks
3. Clique "Criar novo webhook"
4. Preencha:
   ```
   URL: https://resetprimal.com.br/webhook/hotmart
   Eventos: ☑️ PURCHASE_COMPLETE
           ☑️ PURCHASE_APPROVED
   ```
5. Clique "Gerar Secret"
6. **COPIE o Secret** (se for diferente de `upan5FYAJLzL2nA46gm9...`)

Se for diferente, atualize no servidor:

```bash
ssh root@64.225.44.199
nano /var/www/reset-primal/.env
# Editar HOTMART_WEBHOOK_SECRET
# Salvar: Ctrl+X → Y → Enter

# Restart webhook:
pm2 restart hotmart-webhook
```

---

### PASSO 5: Primeira Compra Teste (10 min)

**No Hotmart (modo Sandbox):**

1. Ativar modo Sandbox
2. Ir para: https://resetprimal.com.br
3. Clicar "Comprar agora"
4. Fazer compra de teste (não precisa pagar de verdade)
5. Hotmart vai confirmar

**No servidor, verificar:**

```bash
ssh root@64.225.44.199

# Ver logs
tail -50 /var/www/reset-primal/logs/webhook-hotmart.log

# Deve mostrar:
# [COMPRA] seu-email@example.com
# [EMAIL] Enviado para seu-email@example.com
# [GA4] Conversão rastreada
# [FACEBOOK] Conversão rastreada
```

---

## ✅ VALIDAR TUDO

Se chegou até aqui, **validar:**

- [ ] Webhook respondendo? `curl http://localhost:3000/health`
- [ ] Nginx ativo? `sudo systemctl status nginx`
- [ ] PM2 online? `pm2 status`
- [ ] Email chegou? Procure em singullarco@gmail.com
- [ ] GA4 rastreou? analytics.google.com → Real-time
- [ ] Facebook rastreou? business.facebook.com → Events Manager

---

## 🎉 SE TUDO OK

**PARABÉNS!** Reset Primal está **LIVE em produção**! 🚀

```
https://resetprimal.com.br ✅ LIVE
singullarco@gmail.com       ✅ EMAIL OK
GA4 rastreando              ✅ ANALYTICS OK
Facebook rastreando         ✅ PIXEL OK
Webhook processando         ✅ BACKEND OK
```

---

## 🆘 SE TIVER PROBLEMA

### Problema 1: Projeto não existe no servidor

```bash
# Solução: Copiar usando TAR
# (Ver PASSO 1 - Opção B acima)
```

### Problema 2: Nginx não inicia

```bash
# Ver erro:
sudo nginx -t

# Ver logs:
sudo tail -20 /var/log/nginx/error.log
```

**Mais troubleshooting:** Ver `TROUBLESHOOTING-PRODUCAO.md`

---

## 📖 DOCUMENTOS IMPORTANTES

Salve esses links para referência:

1. **DEPLOY-INSTRUCOES-FINAIS.md** ← Passo-a-passo visual
2. **TROUBLESHOOTING-PRODUCAO.md** ← Se tiver erro
3. **FASE3-OTIMIZACOES.md** ← Próximas semanas
4. **RESUMO-SESSAO-FINAL.md** ← Tudo que foi feito

---

## ⏰ TIMELINE ESPERADO

```
Agora:        5 min  → Resolver GitHub/TAR
              2 min  → Verificar projeto
              5 min  → Deploy automático
              5 min  → Configurar Hotmart
             10 min  → Teste de compra
             ─────────────────────
TOTAL:       ~30 min até LIVE! 🚀
```

---

## 💡 DICAS RÁPIDAS

```bash
# Ver logs em tempo real
pm2 logs hotmart-webhook

# Restart webhook se der problema
pm2 restart hotmart-webhook

# Ver todos serviços
pm2 status

# Testar SSL
curl -I https://resetprimal.com.br
```

---

## 🎊 VOCÊ CONSEGUE!

Tudo está pronto. Você só precisa:

1. ✅ Resolver GitHub/TAR (5 min)
2. ✅ Rodar o script deploy (5 min)
3. ✅ Testar compra (10 min)
4. ✅ 🎉 LIVE!

**Quando terminar, você tem:** ✨
- Landing page funcionando
- Webhook processando vendas
- Email enviando automaticamente
- GA4 rastreando conversões
- Facebook Pixel ativo

**Tudo 100% automático e pronto para escalar!**

---

## 📞 PRÓXIMAS AÇÕES (DEPOIS)

Depois que tiver LIVE:

1. **Monitorar primeira semana** (logs, emails, conversões)
2. **Implementar Fase 3** (ver `FASE3-OTIMIZACOES.md`)
3. **A/B Testing** (Headlines, CTAs, Pricing)
4. **Email Campaigns** (Day 1, 7, 14, 21)
5. **Remarketing Ads** (Facebook, Google Ads)

---

## 🎯 RESUMO

| O que | Onde | Status |
|------|------|--------|
| Código | `/var/www/reset-primal/` | ✅ Pronto |
| .env | Credenciais no servidor | ✅ Configurado |
| Nginx | Automático via script | ✅ Pronto |
| SSL | Let's Encrypt automático | ✅ Pronto |
| PM2 | Webhook autostart | ✅ Pronto |
| Deploy | `deploy-producao.sh` | ✅ Pronto |

---

**Aproveita! Quando estiver pronto, me avisa!** 🚀

Você tem tudo que precisa para ter sucesso! 💪

---

*Criado: 2025-01-27*
*Próximo passo: Retomar com `PASSO 1` acima*
