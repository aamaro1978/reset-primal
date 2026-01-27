# 🔧 A/B TESTING - IMPLEMENTAÇÃO PRÁTICA

**Guia passo-a-passo para rodar A/B tests no Reset Primal**

---

## 🚀 PASSO 1: CRIAR CONTA GOOGLE OPTIMIZE

### 1.1 Ir para Google Optimize

```
https://optimize.google.com/
```

### 1.2 Conectar com GA4

```
1. Clique em "Criar"
2. Selecione: "Google Analytics 4"
3. Selecione property: G-KKTGW6BEJP
4. Nome do container: "Reset Primal A/B Tests"
5. Nome da web property: "resetprimal.com.br"
6. Confirme
```

### 1.3 Copiar Optimize ID

```
Depois de criar, você receberá:
OPT-XXXXXXX

GUARDE ESTE ID! Você precisará em tudo.
```

---

## 🔧 PASSO 2: IMPLEMENTAR NO HTML

### 2.1 Adicionar Google Optimize Tag

**Arquivo:** `landing-page/index.html` (dentro de `<head>`)

```html
<!-- ADICIONAR APÓS GA4 SCRIPT -->

<!-- Google Optimize -->
<script src="https://www.googleoptimize.com/optimize.js?id=OPT-XXXXXXX"></script>

<!-- Hide snippet (evita flicker) -->
<style>
.optimize-hide { opacity: 0 !important; }
</style>
<script>
(function(a,s,y,n,c,h,i,d,e){s.className+=' '+y;h.start=1*new Date();
h.end=i=function(){s.className=s.className.replace(RegExp(' ?'+y),'')};
(a[n]=a[n]||[]).hide=h;setTimeout(function(){i();h.end=null},c);h.timeout=c;
})(window,document.documentElement,'optimize-loading','google-optimize','500',window.dataLayer);
</script>
```

### 2.2 Adicionar ID aos elementos

**No HTML, adicione IDs aos elementos que serão testados:**

```html
<!-- HEADLINE TEST -->
<h1 id="hero-headline" class="hero-headline">
    R$ 97 VS R$ 32.400 POR ANO: O PROTOCOLO QUE 1.847 HOMENS USARAM...
</h1>

<!-- CTA BUTTONS -->
<a id="hero-cta" href="https://pay.hotmart.com/W103146395W" class="btn btn-large">
    QUERO COMEÇAR MINHA TRANSFORMAÇÃO AGORA
</a>

<a id="stack-cta" href="https://pay.hotmart.com/W103146395W" class="btn btn-large btn-block">
    QUERO COMEÇAR MINHA TRANSFORMAÇÃO AGORA
</a>

<!-- PRICING SECTION -->
<div id="pricing-section">
    <!-- Stack items -->
</div>
```

### 2.3 Adicionar classe optimize-hide (opcional)

```html
<body class="optimize-hide">
    <!-- Conteúdo -->
</body>
```

Isso evita "flicker" (piscar) quando a página carrega enquanto Google Optimize decide qual variação mostrar.

---

## 📊 PASSO 3: CRIAR VARIAÇÕES NO GOOGLE OPTIMIZE

### 3.1 Novo Experimento

```
1. Google Optimize → "Criar experiência"
2. Nome: "A/B Test - Hero Headline V1"
3. Página: https://resetprimal.com.br
4. Tipo: A/B Test
5. Editor: Visual editor (ou Code editor se preferir)
```

### 3.2 Adicionar Variações (Visual Editor)

```
VARIAÇÃO A (Control - 50% traffic):
├─ Sem mudanças (mantém original)
└─ Destinatários: 50%

VARIAÇÃO B (50% traffic):
├─ Clique no elemento a testar (#hero-headline)
├─ Clique em "Editar conteúdo"
├─ Cole novo headline:
   "De 108kg Para 88kg Em 21 Dias —
    A Transformação Que a Indústria Farmacêutica NÃO Quer Que Você Saiba"
└─ Destinatários: 50%
```

### 3.3 Configurar Métrica

```
1. Objetivos
2. Selecione: "Eventos do GA4"
3. Escolha evento: "begin_checkout" (para CTA cliques)
   ou "purchase" (para vendas)
4. Tipo: Conversion
5. Objetivo principal: ✓ Marcar
```

### 3.4 Configurações Avançadas

```
1. Duração: 21 dias (ou até atingir 100 conversões/variação)
2. % de tráfego: 100% (mostrar para todos)
3. Distribuição: 50% Control, 50% Variação
4. Incluir: Todos os visitantes
5. Excluir: Nenhum (opcional: seu próprio IP)
```

### 3.5 Lançar Teste

```
Clique em "INICIAR"
↓
Google Optimize começa a coletar dados
↓
Aguarde 2-3 semanas (mínimo)
↓
Analise resultados
```

---

## 📈 PASSO 4: RASTREAR CONVERSÕES

### 4.1 GA4 Event para CTA Click

**Adicionar ao HTML (antes de `</body>`):**

```javascript
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Rastrear TODOS os cliques em links Hotmart
    document.querySelectorAll('a[href*="pay.hotmart.com"]').forEach(link => {
        link.addEventListener('click', function() {
            // GA4 Event
            gtag('event', 'begin_checkout', {
                'value': 97.00,
                'currency': 'BRL',
                'items': [{
                    'item_id': 'reset-primal-21days',
                    'item_name': 'Reset Primal - 21 Days Protocol',
                    'price': 97.00,
                    'quantity': 1
                }],
                'coupon': '' // Se houver cupom
            });

            // Facebook Pixel Event
            fbq('track', 'InitiateCheckout', {
                value: 97.00,
                currency: 'BRL',
                content_name: 'Reset Primal 21 Days'
            });

            console.log('✓ Conversion tracked');
        });
    });
});
</script>
```

### 4.2 GA4 Event para Purchase (Webhook)

**No webhook Hotmart (`api/webhook-hotmart.js`), adicionar:**

```javascript
// Rastrear venda em GA4
gtag('event', 'purchase', {
    'transaction_id': purchase.id,
    'value': purchase.price,
    'currency': 'BRL',
    'items': [{
        'item_id': 'reset-primal-21days',
        'item_name': 'Reset Primal',
        'price': purchase.price,
        'quantity': 1
    }]
});

// Facebook Pixel Event
fbq('track', 'Purchase', {
    value: purchase.price,
    currency: 'BRL',
    content_name: 'Reset Primal',
    content_type: 'product'
});
```

### 4.3 Validar Rastreamento

```
1. Abrir site em Chrome
2. F12 → Console
3. Fazer clique no CTA
4. Procure por: "✓ Conversion tracked"
5. Ir a Google Analytics 4 → Real-time
6. Procure por evento "begin_checkout"
```

---

## 🧪 TESTE 1: HERO HEADLINE

### Variação A (Control)

```text
R$ 97 VS R$ 32.400 POR ANO: O PROTOCOLO QUE 1.847 HOMENS USARAM
PARA PERDER 7-11KG EM 21 DIAS SEM DEPENDER DE OZEMPIC
```

**Características:**
- Lógica
- Comparativa (R$ vs R$)
- Números específicos
- Appeal: Racional

---

### Variação B (Emocional)

```text
De 108kg Para 88kg Em 21 Dias —
A Transformação Que a Indústria Farmacêutica NÃO Quer Que Você Saiba
```

**Características:**
- Narrativa pessoal
- Contrarian ("NÃO quer")
- Antes/depois claro
- Appeal: Emocional + curiosidade

---

### Variação C (Urgência)

```text
⏰ ÚLTIMOS 3 SLOTS ⏰
O Protocolo Que 1.847 Homens Usaram Para Perder 7-11kg Em 21 Dias
(Oferta Encerra em 48h)
```

**Características:**
- FOMO (escassez)
- Urgência (tempo)
- Prova social (1.847)
- Appeal: Urgência

---

### Implementar no HTML

```html
<h1 id="hero-headline" class="hero-headline">
    <!-- Original vai aqui (Google Optimize substituirá para variações) -->
    R$ 97 VS R$ 32.400 POR ANO: O PROTOCOLO QUE 1.847 HOMENS USARAM
    PARA PERDER 7-11KG EM 21 DIAS SEM DEPENDER DE OZEMPIC
</h1>
```

**No Google Optimize Visual Editor:**
1. Clique no headline
2. "Edit HTML" ou "Edit text"
3. Cole a variação B ou C
4. Salve

---

## 🎯 TESTE 2: CTA BUTTON

### Variação A (Control)

```html
<a href="https://pay.hotmart.com/W103146395W" class="btn btn-large btn-block">
    QUERO COMEÇAR MINHA TRANSFORMAÇÃO AGORA
</a>
```

---

### Variação B (Foco em Valor)

```html
<a href="https://pay.hotmart.com/W103146395W" class="btn btn-large btn-block">
    SIM, QUERO PERDER 7-11KG EM 21 DIAS — R$ 97
</a>
```

---

### Variação C (Urgência)

```html
<a href="https://pay.hotmart.com/W103146395W" class="btn btn-large btn-block"
   style="background: #FF0000;">
    NÃO DEIXE PASSAR — GARANTIA 2× SEU DINHEIRO
</a>
```

---

### Variação D (Simples)

```html
<a href="https://pay.hotmart.com/W103146395W" class="btn btn-large btn-block">
    COMEÇAR AGORA
</a>
```

---

## 💰 TESTE 3: PRICING

### Variação A (Stack - Control)

```html
<div class="value-stack">
    <div class="stack-item">
        <div class="stack-check">✓</div>
        <div class="stack-content">
            <h3 class="stack-title">O Protocolo Completo (192 páginas)</h3>
            <p class="stack-desc">...</p>
            <span class="stack-value">Valor standalone: R$ 297</span>
        </div>
    </div>
    <!-- x4 mais itens -->

    <div class="stack-total">
        <p class="total-strike">R$ 932</p>
        <p class="price-huge">R$ 97</p>
    </div>
</div>
```

---

### Variação B (Simples)

```html
<div style="text-align: center; padding: 60px;">
    <h3>Investimento Único</h3>
    <p style="font-size: 96px; font-weight: 900; color: #FF5722; margin: 20px 0;">
        R$ 97
    </p>
    <p style="font-size: 16px; color: #CCC;">
        Acesso vitalício • Sem mensalidade • Atualizações grátis
    </p>
    <div style="background: #4CAF50; color: black; padding: 8px 20px;
                display: inline-block; font-weight: 900; margin-top: 20px;">
        DESCONTO DE 90%
    </div>
</div>
```

---

### Variação C (Payment Plan)

```html
<div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 30px; padding: 40px;">
    <div style="text-align: center;">
        <h4 style="color: #FF5722; margin-bottom: 10px;">PAGAMENTO ÚNICO</h4>
        <p style="font-size: 48px; font-weight: 900;">R$ 97</p>
        <p style="font-size: 13px; color: #999;">Sem mensalidade</p>
    </div>

    <div style="font-size: 36px; color: #666;">OU</div>

    <div style="text-align: center; border: 2px solid #4CAF50; padding: 20px;">
        <h4 style="color: #4CAF50; margin-bottom: 10px;">3x SEM JUROS</h4>
        <p style="font-size: 48px; font-weight: 900; color: #4CAF50;">R$ 33</p>
        <p style="font-size: 13px; color: #999;">3 parcelas</p>
    </div>
</div>
```

---

## 📊 PASSO 5: MONITORAR RESULTADOS

### 5.1 Google Analytics Dashboard

```
GA4 → Explore → Criar Exploration

Dimensões:
├─ experiment.name
├─ experiment.variant_id
└─ Device type

Métricas:
├─ Event count (begin_checkout)
├─ Conversion rate
└─ Revenue (se rastrear purchase)

Filtro:
└─ Last 7 days, 14 days, 21 days
```

### 5.2 Google Optimize Results

```
Google Optimize → [Seu teste] → Results

Ver:
├─ Conversion rate por variação
├─ Lift %
├─ Confiança estatística
├─ Duração restante
└─ Winner (quando >95% confiança)
```

### 5.3 Relatório Manual (Planilha)

```
Data:        2026-01-27
Teste:       Hero Headline
Dias:        7
Visitantes:  5,000
├─ Variação A (Control):    2,500 | Conv: 50 | Rate: 2.0%
├─ Variação B (Emocional):  2,500 | Conv: 70 | Rate: 2.8% (+40%)
└─ Confiança:               87%

Status:      ⏳ Rodando (14 dias restantes)
```

---

## ✅ CHECKLIST DE SETUP

### Setup Inicial
- [ ] Conta Google Optimize criada
- [ ] ID (OPT-XXXXXXX) copiado
- [ ] Google Optimize script adicionado ao HTML
- [ ] Hide snippet implementado
- [ ] IDs adicionados aos elementos

### GA4 Configuration
- [ ] GA4 event "begin_checkout" configurado
- [ ] GA4 event "purchase" configurado (webhook)
- [ ] Facebook Pixel eventos adicionados
- [ ] Rastreamento validado no console

### Teste 1: Hero Headline
- [ ] Variação A definida (control)
- [ ] Variação B criada (emocional)
- [ ] Variação C criada (urgência)
- [ ] Métrica: "begin_checkout" ou "conversion"
- [ ] Teste lançado

### Monitoramento
- [ ] Dashboard GA4 criado
- [ ] Google Optimize results acompanhado
- [ ] Planilha de resultados criada
- [ ] Alerta configurado para quando terminar

---

## 🎬 EXEMPLO: Teste Passo-a-Passo

### Dia 1: Setup

```
1. Acessar Google Optimize
2. Criar experiência "Hero Headline Test"
3. Copiar ID: OPT-12345678
4. Adicionar script ao HTML
5. Criar 2 variações no visual editor
6. Configurar métrica de conversão
7. Lançar teste
```

### Dia 2-7: Coleta de dados

```
Google Optimize coletando dados
↓
Analytics registrando eventos
↓
Visitantes vendo variações aleatoriamente:
├─ 50% veem Control (headline original)
└─ 50% veem Variação (headline novo)
```

### Dia 14: Análise Intermediária

```
Acessar Google Optimize → Results

Variação A (Control):    2.0% conversion (100 conversões)
Variação B (Emocional):  2.8% conversion (140 conversões) ✓ +40%!

Confiança: 87%
Status: Rodando (7 dias restantes)
```

### Dia 21: Resultado Final

```
Variação A (Control):    2.1% conversion (210 conversões)
Variação B (Emocional):  2.75% conversion (275 conversões) ✓ +31%

Confiança: 96% ✓ VÁLIDO!
Status: ✅ WINNER: Variação B

Ação: Implementar Variação B permanentemente
```

---

## 💾 CÓDIGO PRONTO PARA USAR

### ga4-events.js

```javascript
// Arquivo: scripts/ga4-events.js
// Copiar para landing-page/index.html

(function() {
    'use strict';

    // Ratracker CTA clicks
    function trackCTAClick() {
        document.querySelectorAll('a[href*="pay.hotmart.com"]').forEach(link => {
            link.addEventListener('click', function() {
                gtag('event', 'begin_checkout', {
                    'value': 97.00,
                    'currency': 'BRL',
                    'items': [{
                        'item_id': 'reset-primal-21days',
                        'item_name': 'Reset Primal Protocol',
                        'price': 97.00,
                        'quantity': 1,
                        'category': 'Digital Product'
                    }]
                });

                fbq('track', 'InitiateCheckout', {
                    value: 97.00,
                    currency: 'BRL',
                    content_name: 'Reset Primal'
                });

                console.log('✓ Conversion event tracked');
            });
        });
    }

    // Ratracker scroll depth
    function trackScrollDepth() {
        let scrollDepths = { 25: false, 50: false, 75: false, 100: false };

        window.addEventListener('scroll', function() {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );

            Object.keys(scrollDepths).forEach(percent => {
                if (scrollPercent >= percent && !scrollDepths[percent]) {
                    scrollDepths[percent] = true;

                    gtag('event', 'scroll', {
                        'percent_scrolled': percent
                    });

                    console.log(`✓ Scroll tracked: ${percent}%`);
                }
            });
        });
    }

    // Inicialize
    document.addEventListener('DOMContentLoaded', function() {
        trackCTAClick();
        trackScrollDepth();
    });
})();
```

---

## 🚀 PRÓXIMOS PASSOS

1. **Hoje:** Ler este guia + criar conta Google Optimize
2. **Amanhã:** Implementar ID + eventos GA4
3. **Semana 1:** Lançar Teste 1 (Headline)
4. **Semana 3:** Lançar Teste 2 (CTA Button)
5. **Semana 5:** Lançar Teste 3 (Pricing)

---

**Status:** ✅ Pronto para implementar

**Impacto esperado:** +10-30% conversão

