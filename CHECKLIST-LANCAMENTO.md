# CHECKLIST DE LANÇAMENTO
## Reset Primal - Validação Final

**Data:** 27 jan 2026  
**Tempo total:** ~2 horas  
**Crítico?** SIM - Não lançar sem completar TUDO  

---

## ✅ SEÇÃO 1: CÓDIGO & CONFIGURAÇÃO (30min)

### Landing Page
- [ ] `landing-page/grand-slam/index.html` existe?
- [ ] HTML não tem erros de sintaxe?
- [ ] 3 botões CTA têm link Hotmart correto?
  - [ ] Hero section
  - [ ] Offer section
  - [ ] Final CTA section
- [ ] CSS está embarcado (não quebrado)?
- [ ] Responsive funciona (mobile)?
- [ ] Imagens carregam?

### Variáveis de Ambiente
- [ ] `.env.example` existe?
- [ ] `.env` existe e está em `.gitignore`?
- [ ] Todas variáveis estão preenchidas:
  - [ ] HOTMART_AFFILIATE_LINK
  - [ ] HOTMART_WEBHOOK_SECRET
  - [ ] GA4_PROPERTY_ID
  - [ ] GA4_MEASUREMENT_ID
  - [ ] FACEBOOK_PIXEL_ID
  - [ ] SENDGRID_API_KEY
  - [ ] TELEGRAM_BOT_TOKEN (opcional)

### Scripts & Analytics
- [ ] GA4 script está em `<head>`?
- [ ] FB Pixel script está em `<head>`?
- [ ] Google Tag Manager (se usar)?
- [ ] Eventos customizados configurados?

### Webhook
- [ ] Arquivo webhook existe (`/api/webhook.js` ou equiv)?
- [ ] Código valida signature Hotmart?
- [ ] Registra venda em BD?
- [ ] Envia email após venda?
- [ ] Notifica Telegram/Slack?

---

## ✅ SEÇÃO 2: HOTMART (15min)

### Produto & Link
- [ ] Produto está PUBLICADO (não rascunho)?
- [ ] Preço está R$ 97?
- [ ] Descrição do produto completa?
- [ ] Link de afiliado copiado corretamente?
- [ ] Link começa com `https://pay.hotmart.com/`?

### Webhook
- [ ] Webhook criado em Hotmart?
- [ ] URL exata: `https://resetprimal.com.br/webhook/hotmart`?
- [ ] Eventos selecionados:
  - [ ] Venda Realizada
  - [ ] Reembolso
  - [ ] Chargeback
- [ ] Token/Secret copiado para `.env`?
- [ ] Teste de webhook dispara?

### Email & Confirmação
- [ ] Email padrão do Hotmart é aceitável?
- [ ] Ou está customizado?
- [ ] Link do e-book no email funciona?

---

## ✅ SEÇÃO 3: SERVIDOR & INFRAESTRUTURA (30min)

### Domínio & DNS
- [ ] Domínio `resetprimal.com.br` aponta para seu IP?
- [ ] DNS propagado (verificar com `nslookup`)?
- [ ] TTL está baixo se mudar depois?

### SSL/HTTPS
- [ ] Certificado Let's Encrypt instalado?
- [ ] HTTPS está ativo (`https://resetprimal.com.br`)?
- [ ] Certificado é válido (não expirado)?
- [ ] Auto-renew configurado?
- [ ] Redirecionamento HTTP → HTTPS ativo?

### Nginx
- [ ] Nginx instalado e rodando?
- [ ] Config de `resetprimal.com.br` existe?
- [ ] Teste de config passou (`nginx -t`)?
- [ ] Nginx reiniciado após mudanças?
- [ ] Logs de erro vazios?

### Node.js (Webhook)
- [ ] Node.js instalado?
- [ ] Dependências instaladas (`npm install`)?
- [ ] Arquivo webhook rodando?
- [ ] PM2 configurado (auto-restart)?
- [ ] Logs estão sendo gravados?

### Banco de Dados (se usar)
- [ ] BD criado e acessível?
- [ ] Tabela de vendas existe?
- [ ] Connection string em `.env`?
- [ ] Backup automático configurado?

---

## ✅ SEÇÃO 4: GOOGLE ANALYTICS (15min)

### Setup
- [ ] Propriedade GA4 criada?
- [ ] Data stream configurada?
- [ ] Property ID obtido?
- [ ] Measurement ID obtido?

### Instalação
- [ ] Script GA4 está em `<head>` da LP?
- [ ] Sem erros de sintaxe?
- [ ] Google Tag Manager (se usar) funcionando?

### Eventos
- [ ] PageView automático ativo?
- [ ] Evento `click_cta_button` dispara?
- [ ] Evento `scroll_depth` dispara?
- [ ] Dashboard mostra eventos?

### Validação
- [ ] Acessar GA4 → Real-time
- [ ] Ver visitantes em tempo real?
- [ ] Eventos aparecem quando dispara?
- [ ] Conversão rastreada?

---

## ✅ SEÇÃO 5: FACEBOOK PIXEL (15min)

### Setup
- [ ] Pixel criado?
- [ ] Pixel ID obtido?
- [ ] ID copiado para `.env`?

### Instalação
- [ ] Script Pixel está em `<head>` da LP?
- [ ] Pixel ID correto no script?

### Eventos
- [ ] PageView rastreado automaticamente?
- [ ] Evento `InitiateCheckout` dispara ao clicar CTA?
- [ ] Evento `ViewContent` dispara ao scroll?

### Validação
- [ ] Instalar extensão: Facebook Pixel Helper
- [ ] Acessar LP
- [ ] Pixel Helper mostra "Pixel detectado"?
- [ ] Eventos aparecem quando dispara?

---

## ✅ SEÇÃO 6: FLUXO COMPLETO (1h)

### Teste Ponta a Ponta

**PASSO 1: Visitante**
- [ ] Acessar `https://resetprimal.com.br`
- [ ] Página carrega rápido (< 3s)?
- [ ] Design parece profissional?
- [ ] Texto legível (tipografia boa)?
- [ ] Responsivo no mobile?

**PASSO 2: Navegação**
- [ ] Scroll funciona suave?
- [ ] Imagens carregam?
- [ ] Vídeos (se houver) funcionam?
- [ ] Links internos funcionam?

**PASSO 3: CTA**
- [ ] 3 botões CTA estão visíveis?
- [ ] Hover funciona (muda cor)?
- [ ] Clique abre Hotmart?
- [ ] GA4 rastreia clique?
- [ ] Facebook rastreia clique?

**PASSO 4: Hotmart**
- [ ] Checkout carrega?
- [ ] Produto é o correto?
- [ ] Preço é R$ 97?
- [ ] Botão "Pagar" está ativo?

**PASSO 5: Pagamento Simulado**
- [ ] Usar cartão de teste (se suportado)
- [ ] Ou completar com dados reais (se for fazer)
- [ ] Mensagem de sucesso aparece?
- [ ] Hotmart redireciona?

**PASSO 6: Webhook**
- [ ] Webhook dispara (ver logs)?
- [ ] Dados de venda registrados em BD?
- [ ] Email de confirmação enviado?
- [ ] Email chega na caixa (ou spam)?
- [ ] Link do e-book no email funciona?

**PASSO 7: E-book**
- [ ] Acessar `https://resetprimal.com.br/ebook`
- [ ] E-book carrega?
- [ ] Todos os capítulos acessíveis?
- [ ] Navegação funciona?
- [ ] Imagens do e-book carregam?

**PASSO 8: Analytics**
- [ ] GA4 mostra nova sessão?
- [ ] Evento `click_cta_button` registrado?
- [ ] Evento `purchase` registrado?
- [ ] FB Pixel mostra conversão?

---

## ✅ SEÇÃO 7: SEGURANÇA (15min)

### Variáveis & Credenciais
- [ ] `.env` está em `.gitignore`?
- [ ] Nenhuma credencial no código?
- [ ] Nenhuma senha commitada no git?
- [ ] Token webhook não está visível?

### HTTPS & SSL
- [ ] HTTPS obrigatório (redireciona)?
- [ ] Certificado é válido?
- [ ] Sem avisos de "conexão insegura"?

### Rate Limiting
- [ ] Webhook tem proteção contra DDoS?
- [ ] Limite de requisições configurado?
- [ ] IP whitelist do Hotmart (opcional)?

### Logs
- [ ] Logs não salvam dados sensíveis?
- [ ] Logs têm rotação (não crescem infinito)?
- [ ] Acesso a logs é restrito?

---

## ✅ SEÇÃO 8: PERFORMANCE (10min)

### Tempo de Carregamento
- [ ] Landing page < 3 segundos?
- [ ] Teste com: https://pagespeed.web.dev
- [ ] Mobile score > 80?
- [ ] Desktop score > 85?

### Otimização
- [ ] Imagens otimizadas (comprimidas)?
- [ ] CSS/JS minificado?
- [ ] Cache habilitado no Nginx?
- [ ] CDN (opcional)?

---

## ✅ SEÇÃO 9: MONITORAMENTO (10min)

### Logs & Alertas
- [ ] Nginx logs existem e estão salvando?
- [ ] Node.js logs existem?
- [ ] Webhook logs existem?
- [ ] Alertas configurados (se houver erro)?

### Backups
- [ ] BD tem backup automático?
- [ ] Arquivo .env tem backup?
- [ ] Arquivos estáticos têm backup?

### Health Check
- [ ] Endpoint `/` responde 200?
- [ ] Endpoint `/webhook/hotmart` responde 200?
- [ ] GA4 conectando?
- [ ] Hotmart webhook respondendo?

---

## ✅ SEÇÃO 10: DOCUMENTAÇÃO (5min)

### Arquivos Críticos
- [ ] `README.md` atualizado?
- [ ] `SETUP.md` atualizado?
- [ ] `.env.example` preenchido?
- [ ] Docs em `/docs/` acessíveis?

### Processo
- [ ] Documentação de rollback?
- [ ] Contato de suporte definido?
- [ ] Responsável on-call?

---

## 🚀 ANTES DE CLICAR "PUBLICAR"

### Validação Final (5 minutos)
- [ ] Todas seções acima completadas?
- [ ] Nenhuma [ ] vazia?
- [ ] Responsável assinou?
- [ ] Backup feito?

### Aprovações
- [ ] Dev aprovou funcionalidade?
- [ ] Product aprovou fluxo?
- [ ] Marketing aprovou copy?
- [ ] Segurança aprovou setup?

### Contingência
- [ ] Plano B se Hotmart cair?
- [ ] Contato Hotmart suporte?
- [ ] Número de escalação?

---

## DURANTE O LANÇAMENTO (Primeiras 24h)

### Monitoramento 24/7
- [ ] Alguém de on-call?
- [ ] Alertas configurados?
- [ ] Logs sendo monitorados?

### Métricas a Verificar
- [ ] Visitantes: quantos chegam?
- [ ] Taxa de bounce: quantos saem?
- [ ] Cliques CTA: quantos clicam?
- [ ] Conversões: quantas vendas?
- [ ] Erros: há algum erro?

### Ações se Problema
- [ ] Rollback plan pronto?
- [ ] Comunicação com cliente pronta?
- [ ] Suporte disponível?

---

## PÓS-LANÇAMENTO (Primeira Semana)

### Análise
- [ ] Métricas: está bom, acima, ou abaixo do esperado?
- [ ] Tempo médio na página?
- [ ] Taxa de conversão?
- [ ] ROI (se tráfego pago)?

### Otimizações
- [ ] A/B test resultados?
- [ ] Copy pode melhorar?
- [ ] Design pode melhorar?

### Documentação
- [ ] Aprendizados documentados?
- [ ] Runbook atualizado?
- [ ] Troubleshooting expanded?

---

## ASSINATURA DE APROVAÇÃO

```
Desenvolvedor:
Nome: _________________________
Data: __________________________
Assinatura: ____________________

Product Manager:
Nome: _________________________
Data: __________________________
Assinatura: ____________________

DevOps/Responsável:
Nome: _________________________
Data: __________________________
Assinatura: ____________________
```

---

## STATUS FINAL

**Total de Itens:** 150+  
**Completados:** ___  
**Faltando:** ___  

**Taxa de Conclusão:** ___% 

⚠️ **NÃO LANÇAR SE HOUVER ITENS COM [ ]**

---

**Criado:** 27 jan 2026  
**Versão:** 1.0  
**Status:** Pronto para uso
