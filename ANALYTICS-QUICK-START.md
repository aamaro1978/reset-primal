# ANALYTICS QUICK START - 30 MINUTOS

**Objetivo:** Ativar GA4 dashboards + Facebook conversions
**Tempo:** ~30 minutos
**Dificuldade:** ⭐⭐ (Intermediária)

---

## ⚡ PARTE 1: GA4 DASHBOARD (10 min)

### PASSO 1: Acessar GA4
```
https://analytics.google.com
Login com sua conta Google
Propriedade: "Reset Primal"
```

### PASSO 2: Criar Dashboard
```
Menu esquerdo → Dashboards
Clique: "+ Create dashboard"
Nome: "Reset Primal - Landing Page"
```

### PASSO 3: Adicionar Cartões (Add Cards)

**Cartão 1: Visitantes Hoje**
- Tipo: Scoreboard
- Métrica: Active Users
- Título: "Visitantes"

**Cartão 2: Cliques CTA**
- Tipo: Scorecard
- Métrica: Event count
- Filtro: Event name = click_cta_button
- Título: "Cliques em CTA"

**Cartão 3: Conversões**
- Tipo: Scorecard
- Métrica: Event count
- Filtro: Event name = purchase
- Título: "Conversões"

**Cartão 4: Taxa de Conversão**
- Tipo: Scorecard
- Métrica: (purchase events / sessions) * 100
- Título: "Taxa Conversão (%)"

**Cartão 5: Origem do Tráfego**
- Tipo: Pie chart
- Métrica: Sessions
- Dimensão: Session source
- Título: "De onde vêm"

### PASSO 4: Salvar
```
Clique: Save (canto superior direito)
Dashboard salvo!
```

### ✅ GA4 PRONTO

---

## ⚡ PARTE 2: GA4 CONVERSIONS (5 min)

### PASSO 1: Admin
```
GA4 → ⚙️ Admin (canto inferior esquerdo)
```

### PASSO 2: Ir para Conversões
```
Data Collection and Modification → Conversions
```

### PASSO 3: Criar Conversão
```
Clique: "+ New conversion event"
Nome: purchase
Descrição: "Compra completada"
Clique: Save
```

### ✅ CONVERSÕES MARCADAS

---

## ⚡ PARTE 3: FACEBOOK CONVERSIONS (10 min)

### PASSO 1: Acessar Pixel
```
https://business.facebook.com
Tools → Events Manager
Seu Pixel: "Reset Primal Landing Page"
```

### PASSO 2: Criar Conversão
```
Aba: Conversions
Clique: "+ Create conversion"
Evento: Purchase
Nome: "Reset Primal Purchase"
```

### PASSO 3: Configurar Dados
```
Mapear para compra:
- Value: 97.00
- Currency: BRL
- Content name: "Reset Primal Protocol"
- Content type: product

Clique: Create
```

### ✅ FACEBOOK PRONTO

---

## ⚡ PARTE 4: INSTALAR PIXEL HELPER (5 min)

### PASSO 1: Chrome
```
Chrome Web Store → Buscar: "Meta Pixel Helper"
Clique: Add to Chrome
```

### PASSO 2: Testar
```
Abra: https://resetprimal.com.br
Clique no ícone da extensão (canto superior)
Deve mostrar:
  ✓ Pixel 1164114415287965 (verde)
  ✓ Eventos disparando
```

### ✅ PIXEL HELPER PRONTO

---

## 🧪 TESTE FINAL (Validar tudo funciona)

### Teste 1: GA4 Real-time
```
GA4 → Real-time
Abra: https://resetprimal.com.br
Scroll na página
✓ Deve aparecer eventos "scroll_depth"
```

### Teste 2: Clique CTA
```
GA4 → Real-time
Clique botão "COMEÇAR AGORA"
✓ Deve aparecer evento "click_cta_button"
```

### Teste 3: Pixel Helper
```
Abra: https://resetprimal.com.br
Clique extensão Meta Pixel Helper
✓ Deve mostrar eventos disparando
```

### Teste 4: Compra Teste (Opcional)
```
1. Clique CTA → Hotmart
2. Faça compra teste (cartão 4111 1111 1111 1111)
3. Verifique:
   - GA4: evento "purchase" aparece
   - Facebook: evento "Purchase" aparece em 5-10min
   - Email: recebe confirmação
```

---

## 📊 MONITORAR DIARIAMENTE

**Abrir GA4 Dashboard:**
```
https://analytics.google.com
Propriedade: Reset Primal
Clique no Dashboard criado
```

**Verificar:**
- ✓ Visitantes > 0?
- ✓ Cliques CTA > 0?
- ✓ Taxa conversão normal?

**Se algo estiver errado:**
- Verificar logs: `tail -f logs/webhook-hotmart.log`
- Verificar Node.js: `pm2 status`
- Verificar Pixel Helper: extensão Chrome

---

## 🔗 LINKS DIRETOS

| Ação | URL |
|------|-----|
| GA4 Dashboard | https://analytics.google.com |
| Facebook Pixel | https://business.facebook.com/events_manager |
| Landing Page | https://resetprimal.com.br |
| Hotmart Teste | https://go.hotmart.com/W103146395W |

---

## 📋 CHECKLIST FINAL

- [ ] GA4 Dashboard criado e salvo?
- [ ] GA4 Conversão "purchase" criada?
- [ ] Facebook Conversão "Purchase" criada?
- [ ] Pixel Helper instalado?
- [ ] Real-time mostra eventos?
- [ ] Teste manual passou?

---

**Tempo gasto:** ~30 min
**Status:** ✅ PRONTO PARA MONITORAR

Próximo: Fazer compra teste e validar rastreamento completo!

---

Quick Start por: Claude Code (Morgan)
Data: 28 janeiro 2026
