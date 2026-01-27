# 🧪 A/B TESTING SETUP - Reset Primal

**Objetivo:** Aumentar conversão testando variações de Headlines, CTAs e Pricing

**Duração:** 3-4 horas (setup + implementação)
**Impacto esperado:** +10-30% melhoria na métrica testada
**Status:** Pronto para implementar

---

## 📊 ESTRATÉGIA A/B TESTING

### Testes Recomendados (em ordem de impacto)

```
TESTE 1: HEADLINE PRINCIPAL
├─ Impacto: +15-25% conversão
├─ Duração: 2-3 semanas
├─ Visitantes mínimos: 100 conversões por variação
└─ Winner criteria: >10% lift vs controle

TESTE 2: CTA BUTTON
├─ Impacto: +8-15% conversão
├─ Duração: 1-2 semanas
├─ Visitantes mínimos: 50-100 conversões por variação
└─ Winner criteria: >5% lift vs controle

TESTE 3: PRICING PRESENTATION
├─ Impacto: +5-12% conversão (ou revenue)
├─ Duração: 2-3 semanas
├─ Visitantes mínimos: 100 conversões por variação
└─ Winner criteria: >3% lift vs controle
```

---

## 🎯 TESTE 1: HEADLINE PRINCIPAL

### Variação A (CONTROLE - Atual)

```html
<h1 class="hero-headline">
    <span class="highlight">R$ 97 VS R$ 32.400 POR ANO:</span>
    O PROTOCOLO QUE <span class="highlight">1.847 HOMENS</span>
    USARAM PARA PERDER <span class="highlight">7-11KG EM 21 DIAS</span>
    <span class="underline">SEM DEPENDER DE OZEMPIC</span>
</h1>
```

**Característica:** Lógica, comparativa, números
**Appeal:** Racional, ROI, prova social
**Meta:** Comunicar valor + credibilidade

---

### Variação B (EMOCIONAL)

```html
<h1 class="hero-headline">
    De 108kg Para 88kg Em 21 Dias —
    <span class="highlight">A Transformação Que a Indústria Farmacêutica NÃO Quer Que Você Saiba</span>
</h1>
```

**Característica:** Narrativa pessoal, mistério
**Appeal:** Emocional, curiosidade, contrarian
**Meta:** Engajar + provocar leitura

---

### Variação C (URGÊNCIA)

```html
<h1 class="hero-headline">
    <span class="highlight">ÚLTIMOS 3 SLOTS</span>:
    O Protocolo Que 1.847 Homens Usaram Para Perder 7-11kg Em 21 Dias
    — <span style="color: var(--laranja);">Oferta Encerra em 48h</span>
</h1>
```

**Característica:** Escassez + urgência
**Appeal:** FOMO (fear of missing out)
**Meta:** Aumentar taxa de clique

---

### Como Implementar (Google Optimize)

```html
<!-- 1. Adicionar Google Optimize Tag (após GA4) -->
<script src="https://www.googleoptimize.com/optimize.js?id=OPT-XXXXXXX"></script>

<!-- 2. Adicionar hide snippet (evita flicker) -->
<style>
.optimize-hide { opacity: 0 !important; }
</style>
<script>
(function(a,s,y,n,c,h,i,d,e){s.className+=' '+y;h.start=1*new Date();
h.end=i=function(){s.className=s.className.replace(RegExp(' ?'+y),'')};
(a[n]=a[n]||[]).hide=h;setTimeout(function(){i();h.end=null},c);h.timeout=c;
})(window,document.documentElement,'optimize-loading','google-optimize','500',window.dataLayer);
</script>

<!-- 3. Headline com ID para Google Optimize -->
<h1 id="hero-headline" class="hero-headline">
    <!-- Variações aqui -->
</h1>
```

---

## 🎯 TESTE 2: CTA BUTTON

### Variação A (CONTROLE - Atual)

```html
<a href="https://pay.hotmart.com/W103146395W" class="btn btn-large btn-block">
    QUERO COMEÇAR MINHA TRANSFORMAÇÃO AGORA
</a>
```

**Text:** Ação + emocional
**Color:** Laranja (contraste alto)
**Size:** Grande (48px altura)

---

### Variação B (FOCO EM VALOR)

```html
<a href="https://pay.hotmart.com/W103146395W" class="btn btn-large btn-block">
    SIM, QUERO PERDER 7-11KG EM 21 DIAS — R$ 97
</a>
```

**Text:** Resultado + preço
**Color:** Laranja (mantém)
**Meta:** Deixar claro o resultado esperado

---

### Variação C (URGÊNCIA)

```html
<a href="https://pay.hotmart.com/W103146395W" class="btn btn-large btn-block" style="background: #FF0000;">
    NÃO DEIXE PASSAR — GARANTIA 2× SEU DINHEIRO
</a>
```

**Text:** Garantia + segurança
**Color:** Vermelho (mais urgente)
**Meta:** Reduzir risco percebido

---

### Variação D (SIMPLIFICADO)

```html
<a href="https://pay.hotmart.com/W103146395W" class="btn btn-large btn-block">
    COMEÇAR AGORA
</a>
```

**Text:** Simples e direto
**Color:** Laranja
**Meta:** Testar se simplicidade converte melhor

---

## 💰 TESTE 3: PRICING PRESENTATION

### Variação A (CONTROLE - Stack)

```html
<div class="stack-item">
    <div class="stack-check">✓</div>
    <div class="stack-content">
        <h3 class="stack-title">O Protocolo Completo (192 páginas)</h3>
        <p class="stack-desc">3 fases detalhadas...</p>
        <span class="stack-value">Valor standalone: R$ 297</span>
    </div>
</div>

<!-- x5 items -->

<div class="stack-total">
    <p class="total-label">VALOR TOTAL SE COMPRADO SEPARADAMENTE:</p>
    <p class="total-strike">R$ 932</p>
    <p class="total-today">SEU INVESTIMENTO HOJE:</p>
    <p class="price-huge">R$ 97</p>
</div>
```

**Formatação:** Stack de itens (valor individual de cada um)
**Meta:** Comunicar economias

---

### Variação B (TABLE FORMAT)

```html
<table style="width: 100%; border-collapse: collapse;">
    <tr style="background: var(--cinza-medio);">
        <th style="padding: 12px; border: 1px solid #444;">Item</th>
        <th style="padding: 12px; border: 1px solid #444;">Valor</th>
    </tr>
    <tr>
        <td style="padding: 12px; border: 1px solid #444;">Protocolo Completo</td>
        <td style="padding: 12px; border: 1px solid #444; color: var(--laranja);">R$ 297</td>
    </tr>
    <!-- x5 itens -->
    <tr style="background: var(--laranja); font-weight: 900;">
        <td style="padding: 12px;">TOTAL BUNDLE</td>
        <td style="padding: 12px;">R$ 97</td>
    </tr>
</table>
```

**Formatação:** Tabela (mais estruturada)
**Meta:** Melhorar compreensão

---

### Variação C (SIMPLE PRICE)

```html
<div class="stack-total">
    <p class="total-label">INVESTIMENTO ÚNICO:</p>
    <p class="price-huge" style="font-size: 96px;">R$ 97</p>
    <p class="price-desc">
        Acesso vitalício • Sem mensalidade • Atualizações grátis
    </p>
    <div class="discount-badge">DESCONTO DE 90% (Só nesta página)</div>
</div>
```

**Formatação:** Minimalista (foco no preço)
**Meta:** Testar se simplicidade é melhor

---

### Variação D (PAYMENT PLAN)

```html
<div class="guarantee-grid">
    <div class="guarantee-option">
        <p class="guarantee-badge">PAGAMENTO ÚNICO</p>
        <h4 class="guarantee-result">R$ 97</h4>
        <p class="guarantee-details">Acesso vitalício • Sem mensalidade</p>
    </div>

    <div class="guarantee-vs">OU</div>

    <div class="guarantee-option">
        <p class="guarantee-badge">3x SEM JUROS</p>
        <h4 class="guarantee-result">R$ 33</h4>
        <p class="guarantee-details">3 parcelas • Acesso imediato</p>
    </div>
</div>
```

**Formatação:** Payment options
**Meta:** Reduzir friction de preço

---

## 🔧 SETUP TÉCNICO

### Passo 1: Criar Conta Google Optimize

```bash
# 1. Ir para: https://optimize.google.com
# 2. Conectar com mesma conta GA4
# 3. Criar novo container
# 4. Copiar ID: OPT-XXXXXXX
# 5. Adicionar ao HTML (veja acima)
```

### Passo 2: Criar Experiment no Optimize

```
1. Nova experiência
2. Nome: "A/B Test - Hero Headline"
3. Selecionar página: https://resetprimal.com.br
4. Tipo: A/B Test
5. Adicionar variações:
   - Variação A: Control (0% traffic)
   - Variação B: Emocional (50% traffic)
   - Variação C: Urgência (50% traffic)
6. Métrica: Conversão (definir evento GA4)
```

### Passo 3: Definir Eventos de Conversão

```javascript
// Em GA4, rastrear cliques nos CTAs
document.querySelectorAll('a[href*="pay.hotmart.com"]').forEach(link => {
    link.addEventListener('click', function() {
        gtag('event', 'begin_checkout', {
            'items': [{
                'item_id': 'reset-primal-21days',
                'item_name': 'Reset Primal',
                'price': 97.00,
                'quantity': 1
            }],
            'value': 97.00,
            'currency': 'BRL'
        });
    });
});

// Ou rastrear quando Hotmart confirma venda
gtag('event', 'purchase', {
    'transaction_id': '...',
    'value': 97.00,
    'currency': 'BRL',
    'items': [{...}]
});
```

### Passo 4: Configurar Duração e Amostra

```
Google Optimize:
├─ Tamanho da amostra: 50% traffic (50% A, 50% B)
├─ Duração: 2-3 semanas (mínimo 100 conversões por variação)
├─ Critério de parada: >10% lift com 95% confiança
└─ Métrica: Conversion rate ou Revenue
```

---

## 📊 IMPLEMENTAÇÃO PRÁTICA

### Arquivo: `landing-page/ab-testing.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <!-- Google Analytics 4 -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-KKTGW6BEJP"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-KKTGW6BEJP');
    </script>

    <!-- Google Optimize -->
    <script src="https://www.googleoptimize.com/optimize.js?id=OPT-XXXXXXX"></script>
    <style>
        .optimize-hide { opacity: 0 !important; }
    </style>
    <script>
    (function(a,s,y,n,c,h,i,d,e){s.className+=' '+y;h.start=1*new Date();
    h.end=i=function(){s.className=s.className.replace(RegExp(' ?'+y),'')};
    (a[n]=a[n]||[]).hide=h;setTimeout(function(){i();h.end=null},c);h.timeout=c;
    })(window,document.documentElement,'optimize-loading','google-optimize','500',window.dataLayer);
    </script>
</head>
<body class="optimize-hide">

<!-- Usar index.html como base -->
<!-- Google Optimize criará variações a partir do editor visual -->

<script>
// Rastrear qual variação o usuário está vendo
gtag('event', 'view_item', {
    'items': [{
        'item_id': 'reset-primal-ab-test',
        'item_name': 'Reset Primal A/B Test',
        'item_variant': window.google_optimize ?
            window.google_optimize.get('OPT-XXXXXXX') : 'control'
    }]
});

// Rastrear CTA cliques
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href*="pay.hotmart.com"]').forEach(link => {
        link.addEventListener('click', function() {
            gtag('event', 'begin_checkout', {
                'items': [{
                    'item_id': 'reset-primal-21days',
                    'item_name': 'Reset Primal',
                    'price': 97.00,
                    'quantity': 1
                }],
                'value': 97.00,
                'currency': 'BRL'
            });
        });
    });
});
</script>

</body>
</html>
```

---

## 📈 ACOMPANHAMENTO DE RESULTADOS

### Dashboard Google Analytics

```
Segmentação:
├─ Experiment Variant: A / B / C
├─ Métrica: Conversion Rate
├─ Filtro: Last 7 days, 14 days, 21 days
└─ Dimensões: Device, Source, Country
```

### Relatório de Progresso

```
TESTE 1: Hero Headline
├─ Variação A (Control):      Conversion: 2.1%  | Visits: 5,231
├─ Variação B (Emocional):    Conversion: 2.8%  | Visits: 4,950  ✓ +33% lift
├─ Variação C (Urgência):     Conversion: 2.3%  | Visits: 5,100
├─ Confiança estatística:     87% (2 semanas)
└─ Status: ⏳ Rodando (faltam 8 dias)

TESTE 2: CTA Button
├─ Variação A (Control):      CTR: 18.5% | Clicks: 847
├─ Variação B (Valor):        CTR: 22.1% | Clicks: 956  ✓ +19% lift
├─ Variação C (Urgência):     CTR: 16.2% | Clicks: 734
├─ Variação D (Simples):      CTR: 19.8% | Clicks: 884
├─ Confiança estatística:     92%
└─ Status: ✅ VENCEDOR: Variação B (+19% lift)

TESTE 3: Pricing
├─ Variação A (Stack):        Conversion: 2.4% | Revenue: R$ 2.424
├─ Variação B (Table):        Conversion: 2.0% | Revenue: R$ 1.940
├─ Variação C (Simples):      Conversion: 2.7% | Revenue: R$ 2.673  ✓ +12%
├─ Variação D (Payment Plan): Conversion: 2.9% | Revenue: R$ 2.821  ✓ +20%
├─ Confiança estatística:     78%
└─ Status: ⏳ Rodando (faltam 5 dias)
```

---

## 🎯 CRITÉRIO DE VITÓRIA

### Teste é Válido Quando:

```
✓ Mínimo 100 conversões por variação (ou 2 semanas)
✓ Lift estatístico >5% (preferência: >10%)
✓ Confiança estatística >95%
✓ Nenhuma anomalia externa (promos, press, etc)
```

### Exemplo: Teste Válido

```
Variação A (Control): 2.0% conversion = 100 conversões
Variação B (Teste):   2.2% conversion = 110 conversões

Lift = (2.2 - 2.0) / 2.0 = +10%
Confiança = 96% (válido!)

✓ RESULTADO: Implementar Variação B
```

### Exemplo: Teste Inválido

```
Variação A (Control): 2.0% conversion = 50 conversões
Variação B (Teste):   2.8% conversion = 70 conversões

Lift = (2.8 - 2.0) / 2.0 = +40%
Confiança = 67% (NÃO válido)

✗ RESULTADO: Continuar testando (precisa mais amostra)
```

---

## 📊 ROADMAP 6 SEMANAS

### Semana 1-2: Teste 1 (Headline)

```
✓ Setup Google Optimize
✓ Criar 3 variações
✓ Coletar 300+ conversões (min 100 por variação)
✓ Analisar resultado
```

**Se vencedor (>10% lift):** Implementar
**Se empate (<5% lift):** Manter original

---

### Semana 3-4: Teste 2 (CTA Button)

```
✓ Criar 4 variações
✓ Medir CTR (click-through rate) ou Conversion
✓ Coletar 400+ eventos
✓ Escolher vencedor
```

**Se vencedor:** Implementar
**Se empate:** Continuar com Teste 3

---

### Semana 5-6: Teste 3 (Pricing)

```
✓ Criar 4 variações
✓ Medir Revenue ou Conversion Rate
✓ Coletar 400+ conversões
✓ Escolher vencedor
```

**Resultado:** Variação com maior Revenue

---

## 💡 DICAS DE SUCESSO

### O que NÃO fazer:

```
❌ Mudar múltiplas variáveis ao mesmo tempo
❌ Parar teste antes de atingir mínimo de amostra
❌ Olhar resultados diariamente (causa "peeking bias")
❌ Implementar baseado em visitante único que falou
❌ Confundir correlação com causação
```

### O que FAZER:

```
✓ Testar UMA variável por vez
✓ Deixar rodando 2-3 semanas mínimo
✓ Usar critério estatístico (não intuição)
✓ Documentar todos os testes
✓ Replicar testes vencedores em outras páginas
```

---

## 🧮 CALCULATOR: Impacto Financeiro

```javascript
// Cálculo de impacto em conversão/revenue

const baseline = {
    visitors: 1000,        // Visitantes/mês
    conversionRate: 0.02,  // 2%
    conversions: 20,
    price: 97,
    revenue: 1940
};

const testResult = {
    lift: 0.20,            // +20% lift
    newConversionRate: 0.024,
    newConversions: 24,
    newRevenue: 2328
};

const impact = {
    extraConversions: testResult.newConversions - baseline.conversions,
    extraRevenue: testResult.newRevenue - baseline.revenue,
    annualRevenue: testResult.newRevenue * 12 - baseline.revenue * 12
};

console.log(`
  Extra conversions/mês: ${impact.extraConversions}
  Extra revenue/mês:     R$ ${impact.extraRevenue}
  Extra revenue/ano:     R$ ${impact.annualRevenue}
`);

// Output:
// Extra conversions/mês: 4
// Extra revenue/mês:     R$ 388
// Extra revenue/ano:     R$ 4.656
```

---

## 🚀 PRÓXIMOS PASSOS

### HOJE (Agora)
- [ ] Ler este guia
- [ ] Definir 3 testes prioritários

### TOMORROW
- [ ] Criar conta Google Optimize
- [ ] Setup ID (OPT-XXXXXXX)
- [ ] Implementar em index.html

### SEMANA 1
- [ ] Lançar Teste 1 (Headline)
- [ ] Monitorar métricas
- [ ] Documentar resultados

### SEMANA 3+
- [ ] Lançar Teste 2 e 3 sequencialmente
- [ ] Implementar vencedores
- [ ] Medir impacto acumulado

---

## 📚 RECURSOS

### Google Optimize Docs
```
https://support.google.com/optimize/
```

### GA4 Events
```
https://developers.google.com/analytics/devguides/collection/ga4/events
```

### Statistical Significance Calculator
```
https://www.optimizely.com/sample-size-calculator/
```

---

## ✅ CHECKLIST

- [ ] Google Optimize account criada
- [ ] ID (OPT-XXXXXXX) copiado
- [ ] HTML tag adicionada
- [ ] Hide snippet implementado
- [ ] GA4 eventos configurados
- [ ] 3 testes definidos
- [ ] Variações criadas
- [ ] Teste 1 lançado
- [ ] Métricas sendo rastreadas
- [ ] Resultado documentado

---

**Status:** ✅ Pronto para lançar A/B tests

**Impacto esperado:** +10-30% conversão
**Timeline:** 6 semanas para 3 testes
**ROI:** Potencial +R$ 500-2.000/mês

