# ANALYTICS SETUP - RESET PRIMAL COMPLETO

**Status:** ✅ PRONTO PARA IMPLEMENTAÇÃO
**Data:** 28 janeiro 2026
**Landing Page:** https://resetprimal.com.br
**GA4 ID:** G-KKTGW6BEJP
**Facebook Pixel ID:** 1164114415287965

---

## PARTE 1: GOOGLE ANALYTICS 4 (GA4)

### 1.1 VERIFICAR PROPRIEDADE GA4

**Status Atual:**
- ✅ Propriedade criada: `Reset Primal`
- ✅ Measurement ID: `G-KKTGW6BEJP`
- ✅ Data Stream: `Landing Page`
- ✅ Scripts instalados na LP

**Verificar:**
1. Acesse: https://analytics.google.com
2. Propriedade: `Reset Primal`
3. Aba: **Data Streams**
4. Data Stream: `Landing Page` (resetprimal.com.br)

### 1.2 GERAR API SECRET (IMPORTANTE para webhook conversões)

⚠️ **CRÍTICO:** Sem isso, webhooks não rastreiam compras em GA4

**Passos:**

1. **GA4 → Admin (engrenagem)**
   ```
   Acesse: https://analytics.google.com
   Clique: ⚙️ (canto inferior esquerdo)
   Selecione: Sua propriedade "Reset Primal"
   ```

2. **Ir para API & Services**
   ```
   Admin → Data Collection and Modification → API & Services
   ```

3. **Habilitar Google Analytics 4 API**
   ```
   Se ainda não habilitada:
   - Clique: "Google Analytics 4 API"
   - Clique: "Enable"
   ```

4. **Criar Credential**
   ```
   Google Cloud Console:
   → APIs & Services → Credentials
   → Create Credentials → Service Account

   Nome: "Reset Primal Webhook"
   Descrição: "For tracking webhook conversions"

   → Create and Continue
   → Skip optional steps
   → Done
   ```

5. **Gerar API Secret**
   ```
   Service Account criada →
   Clique no nome da conta →
   Aba: "Keys"
   → Add Key → Create new key
   → JSON
   → Download (salvar em lugar seguro)

   Arquivo terá: "private_key"
   Use o valor da chave no .env
   ```

6. **Adicionar ao .env**
   ```
   GOOGLE_ANALYTICS_API_SECRET=your_private_key_from_json
   ```

7. **Restart Node.js**
   ```bash
   pm2 restart reset-primal
   ```

### 1.3 CRIAR EVENTOS CUSTOMIZADOS EM GA4

**Já implementado na landing page:**
- ✅ `click_cta_button` - quando clica em CTA
- ✅ `scroll_depth` - quando faz scroll (40%, 60%, 80%, 100%)

**Eventos no Webhook:**
- ✅ `purchase` - quando compra é confirmada

**Verificar em GA4 Real-time:**
1. GA4 → Real-time (lado esquerdo)
2. Acesse: https://resetprimal.com.br
3. Scroll na página → evento `scroll_depth` aparece
4. Clique botão CTA → evento `click_cta_button` aparece
5. Depois de compra teste → evento `purchase` aparece

---

## PARTE 2: GOOGLE ANALYTICS DASHBOARD

### 2.1 CRIAR DASHBOARD PERSONALIZADO

**Passo 1: Acessar Dashboards**
```
GA4 → Dashboards (lado esquerdo)
Clique: "+ Create new dashboard"
Nome: "Reset Primal - Landing Page"
```

**Passo 2: Adicionar Gráficos**

#### Gráfico 1: Visitantes Únicos (Scoreboard)
```
Clique: "Add card"
Tipo: "Scoreboard"
Métrica: "Active Users"
Dimensão: (none)
Filtro: (none)
Período: "Last 7 days"
Título: "Visitantes Únicos"
```

#### Gráfico 2: Fontes de Tráfego (Pie Chart)
```
Clique: "Add card"
Tipo: "Pie chart"
Métrica: "Sessions"
Dimensão: "Session source"
Filtro: (none)
Título: "De onde vêm os visitantes"
```

#### Gráfico 3: Cliques em CTA (Table)
```
Clique: "Add card"
Tipo: "Table"
Métrica: "Event count"
Dimensão: "Event name"
Filtro: "Event name = 'click_cta_button'"
Título: "Cliques em CTA"
```

#### Gráfico 4: Scroll Depth (Bar Chart)
```
Clique: "Add card"
Tipo: "Bar chart"
Métrica: "Event count"
Dimensão: "Event parameter > percent_scrolled"
Filtro: "Event name = 'scroll_depth'"
Título: "Profundidade de Scroll"
```

#### Gráfico 5: Conversões (Scoreboard)
```
Clique: "Add card"
Tipo: "Scoreboard"
Métrica: "Event count"
Filtro: "Event name = 'purchase'"
Título: "Conversões (Compras)"
```

#### Gráfico 6: Taxa de Conversão (Scorecard)
```
Clique: "Add card"
Tipo: "Scorecard"
Métrica: "(Event count where Event name = 'purchase') / (Sessions) * 100"
Título: "Taxa de Conversão (%)"
```

### 2.2 SALVAR DASHBOARD

```
Clique: "Save" (canto superior direito)
Dashboard salvo e pronto para monitoramento contínuo
```

### 2.3 CONFIGURAR CONVERSÕES EM GA4

⚠️ **IMPORTANTE:** Marcar `purchase` como conversão oficial

**Passos:**

1. **GA4 → Admin → Conversions**
   ```
   Vá em: ⚙️ (Admin)
   Selecione: Sua propriedade
   Menu: "Data Collection and Modification" → "Conversions"
   ```

2. **Criar Conversão**
   ```
   Clique: "+ New conversion event"
   Nome: "purchase"
   Descrição: "Compra completada do Reset Primal"
   ```

3. **Salvar**
   ```
   Clique: "Save"
   Agora "purchase" é uma métrica oficial de conversão
   ```

---

## PARTE 3: FACEBOOK PIXEL & CONVERSIONS

### 3.1 VERIFICAR PIXEL

**Status Atual:**
- ✅ Pixel criado: `Reset Primal Landing Page`
- ✅ Pixel ID: `1164114415287965`
- ✅ Script instalado na LP
- ✅ Evento PageView rastreando

**Verificar:**
1. Facebook Business: https://business.facebook.com
2. Eventos Manager → seu Pixel
3. Status: "Active"
4. Últimos eventos: Deve mostrar `PageView`

### 3.2 INSTALAR PIXEL HELPER (Verificar)

**Para testar se Pixel está funcionando:**

1. **Chrome:** Adicionar extensão "Meta Pixel Helper"
   - https://chrome.google.com/webstore/detail/meta-pixel-helper/
   - Procure por: "Meta Pixel Helper"
   - Clique: "Adicionar ao Chrome"

2. **Usar:**
   - Abra: https://resetprimal.com.br
   - Clique ícone da extensão
   - Deve mostrar: "Pixel 1164114415287965" (verde)
   - Scroll → evento `ViewContent` dispara
   - Clique CTA → evento `InitiateCheckout` dispara

### 3.3 CRIAR CONVERSÕES NO FACEBOOK

**Passo 1: Events Manager**
```
Facebook Business → Tools → Events Manager
Ou direto: https://business.facebook.com/events_manager/
```

**Passo 2: Configurar Dados**
```
Lado esquerdo: Seu Pixel
Aba: "Conversions"
Clique: "+ Create conversion"
```

**Passo 3: Configurar Evento Purchase**
```
Evento: "Purchase"
Nome: "Reset Primal Purchase"
Descrição: "Compra do protocolo Reset Primal"
Categoria: "Purchase"

Mapear dados:
- Value: 97.00
- Currency: BRL
- Content name: "Reset Primal Protocol"
- Content type: "product"

Clique: "Create"
```

### 3.4 CRIAR AUDIENCE (Opcional)

**Para remarketing depois:**

```
Seu Pixel → Audiences → "+ Create Audience"
Tipo: "Website visitors"
Nome: "Reset Primal - Website Visitors"
Padrão: "Anyone who visited your website"
Lookback window: "Last 180 days"
Clique: "Create"
```

---

## PARTE 4: INTEGRAÇÃO WEBHOOK COM ANALYTICS

### 4.1 RASTREAMENTO AUTOMÁTICO (Webhook)

**O que já está implementado em `/api/webhook-hotmart.js`:**

```javascript
async function processPurchase(event) {
  // 1. Enviar email
  await sendEbookEmail(buyer.email, buyer.name);

  // 2. Rastrear em GA4
  await trackConversionGA4(buyer.email, purchase.price);

  // 3. Rastrear em Facebook
  await trackConversionFacebook(buyer.email);
}
```

**O que precisa ser testado:**
1. Fazer uma compra teste em Hotmart
2. Verificar se chegou em GA4 (evento `purchase`)
3. Verificar se chegou em Facebook (evento `Purchase`)

### 4.2 TESTAR RASTREAMENTO

**Teste 1: GA4 em Tempo Real**
```
GA4 → Real-time
Faça compra teste em Hotmart
Deve aparecer evento "purchase" em 5-10 segundos
```

**Teste 2: Facebook Conversion**
```
Eventos Manager → Seu Pixel → Dados
Faça compra teste em Hotmart
Deve aparecer evento "Purchase" em 5-10 minutos
```

**Teste 3: Verificar Logs**
```bash
# No servidor
tail -f /var/www/reset-primal/logs/webhook-hotmart.log

# Saída esperada:
{"timestamp":"2026-01-28T15:30:00Z","level":"info","event":"ga4_tracked"}
{"timestamp":"2026-01-28T15:30:01Z","level":"info","event":"facebook_tracked"}
```

---

## PARTE 5: DASHBOARDS & RELATÓRIOS

### 5.1 GA4 RELATÓRIOS IMPORTANTES

#### Relatório 1: Audiência
```
GA4 → Reports → Life cycle → Acquisition → User acquisition
Mostra: De onde vêm os usuários
Filtro por: Source, Medium, Campaign
```

#### Relatório 2: Engajamento
```
GA4 → Reports → Life cycle → Engagement → Pages and screens
Mostra: Quais páginas mais acessadas
Métrica: Users, Sessions, Scroll depth
```

#### Relatório 3: Conversões
```
GA4 → Reports → Life cycle → Monetization → Conversions
Mostra: Taxa de conversão, quantidade de compras
Quebra por: Source, Device, Location
```

#### Relatório 4: Funnel (opcional)
```
GA4 → Reports → Explore → Funnel exploration
Passos:
1. Sessão inicia (Landing Page View)
2. Clica CTA (click_cta_button)
3. Vai para Hotmart (Event)
4. Volta com compra (purchase)

Mostra: Onde os visitantes desistem
```

### 5.2 FACEBOOK INSIGHTS

#### Insight 1: Conversões por Origem
```
Eventos Manager → Seu Pixel
Aba: "Conversions"
Filtrar: Por data, país, dispositivo
```

#### Insight 2: CAC (Custo de Aquisição)
```
Se rodar anúncios depois:
Ads Manager → Relatórios → Relatórios por campanhas
Métrica: CPL (Cost Per Lead)
```

---

## PARTE 6: ALERTS & MONITORAMENTO

### 6.1 CONFIGURAR ALERTAS GA4

**Passo 1: Ir em Admin**
```
GA4 → ⚙️ Admin → Property Settings → Alerts
```

**Passo 2: Criar Alerta 1 - Tráfego Zero**
```
Métrica: "Sessions"
Condição: "Is less than"
Valor: 1
Período: "Hourly"
Notificação: Email
```

**Passo 3: Criar Alerta 2 - Muitos Erros**
```
Métrica: "Event count (exception)"
Condição: "Is greater than"
Valor: 10
Período: "Hourly"
Notificação: Email
```

### 6.2 MONITORAMENTO DIÁRIO (Checklist)

**Cada dia, verificar:**
- [ ] Visitantes > 0
- [ ] Cliques CTA > 0
- [ ] Taxa de conversão > 0.5%
- [ ] Nenhum erro no webhook
- [ ] Emails sendo enviados
- [ ] GA4 rastreando eventos
- [ ] Facebook Pixel rastreando eventos

---

## PARTE 7: RELATÓRIOS RECOMENDADOS

### 7.1 RELATÓRIO SEMANAL

**Segunda-feira de manhã:**

1. **Total de Visitantes**
   - Semana passada vs semana anterior
   - Crescimento esperado?

2. **Cliques em CTA**
   - Total de cliques
   - Taxa de clique por visitante

3. **Conversões**
   - Quantas compras
   - Valor total
   - Taxa de conversão

4. **Fonte de Tráfego**
   - Qual fonte manda mais visitantes?
   - Qual gera mais conversões?

5. **Tempo na Página**
   - Média de tempo de visitante
   - Scroll depth médio

### 7.2 TEMPLATE DE RELATÓRIO

```markdown
# Relatório Analytics - Reset Primal
**Semana:** 28 jan - 3 fev 2026

## 📊 Resumo Executivo
- Visitantes: 1.234 (+15% vs semana anterior)
- Cliques CTA: 456 (36.9% de taxa)
- Conversões: 12 (2.6% de taxa)
- Valor: R$ 1.164 (+25% vs semana anterior)

## 📈 Top 3 Fontes de Tráfego
1. Organic Search: 450 visitantes (36%)
2. Direct: 350 visitantes (28%)
3. Social Media: 434 visitantes (36%)

## 🎯 Eventos Rastreados
- PageView: 1.234
- click_cta_button: 456
- scroll_depth_40%: 890
- scroll_depth_80%: 450
- purchase: 12

## 🔔 Alertas
- Nenhum alerta
- Sistema funcionando normalmente

## 💡 Insights
- Visitantes de organic search converter 3.2% (melhor)
- Scroll depth alto (73% scrollam até 80%)
- Taxa de clique em CTA estável (37%)

## 🚀 Próximos Passos
1. Aumentar tráfego de organic search (SEO)
2. Testar copy dos CTAs
3. Rodar anúncios em Facebook (teste A/B)
```

---

## CHECKLIST COMPLETO - ANALYTICS SETUP

### Google Analytics 4
- [ ] Propriedade "Reset Primal" criada?
- [ ] Measurement ID: G-KKTGW6BEJP correto?
- [ ] Data Stream: "Landing Page" criada?
- [ ] Scripts GA4 instalados na LP?
- [ ] API Secret gerado e adicionado ao .env?
- [ ] Eventos customizados rastreando (real-time)?
- [ ] Dashboard personalizado criado?
- [ ] Conversão "purchase" configurada?
- [ ] Alerts configurados?

### Facebook Pixel
- [ ] Pixel "Reset Primal Landing Page" criado?
- [ ] Pixel ID: 1164114415287965 correto?
- [ ] Script instalado na LP?
- [ ] Pixel Helper mostrando eventos?
- [ ] Eventos customizados rastreando?
- [ ] Conversão "Purchase" configurada?
- [ ] Audience para remarketing criada?

### Webhook Integration
- [ ] API Secret GA4 em .env?
- [ ] Node.js webhook rodando?
- [ ] Logs de webhook funcionando?
- [ ] Teste de compra rastreando em GA4?
- [ ] Teste de compra rastreando em Facebook?
- [ ] Email sendo enviado após compra?

### Monitoramento
- [ ] Dashboard GA4 criado e salvo?
- [ ] Alerts GA4 configurados?
- [ ] Relatório semanal definido?
- [ ] Responsável por monitoramento designado?

---

## 🔗 LINKS IMPORTANTES

| Link | Descrição |
|------|-----------|
| https://analytics.google.com | Google Analytics 4 |
| https://business.facebook.com/events_manager | Facebook Pixel & Conversions |
| https://resetprimal.com.br | Landing Page (com GA4 + FB Pixel) |
| https://go.hotmart.com/W103146395W | Hotmart (para teste) |
| https://chrome.google.com/webstore/detail/meta-pixel-helper | Meta Pixel Helper (Chrome extension) |

---

## 📋 MÉTRICAS-CHAVE A ACOMPANHAR

| Métrica | Objetivo | Ação se ↓ |
|---------|----------|-----------|
| Visitantes/dia | 50+ | Aumentar tráfego (SEO/Ads) |
| Taxa de clique em CTA | 35%+ | Otimizar copy/design |
| Taxa de conversão | 2%+ | Otimizar Hotmart checkout |
| Tempo na página | 2min+ | Melhorar conteúdo |
| Scroll depth (80%+) | 60%+ | LP está bom, manter |

---

## 🎓 PRÓXIMAS OTIMIZAÇÕES (Fase 2)

- [ ] A/B Testing de títulos da LP
- [ ] A/B Testing de cores CTA
- [ ] Teste de 3 landing pages diferentes
- [ ] Anúncios pagos no Facebook
- [ ] Anúncios no Google Ads
- [ ] Email marketing (sequência de follow-up)
- [ ] Análise de chargeback
- [ ] Rastreamento de CLV (customer lifetime value)

---

**Status:** ✅ PRONTO PARA IMPLEMENTAÇÃO

Implementado por: Claude Code (Morgan - PM)
Data: 28 janeiro 2026
Versão: 1.0
