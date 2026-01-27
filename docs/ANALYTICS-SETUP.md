# ANALYTICS SETUP - Reset Primal
## GA4 + Facebook Pixel Installation & Configuration

**Status:** CRÍTICO - Implementar ANTES do lançamento  
**Impacto:** Sem analytics, você é cego. Não sabe o que funciona  
**Tempo:** ~45 minutos (instalação + configuração)  

---

## PARTE 1: GOOGLE ANALYTICS 4 (GA4)

### 1.1 Criar Propriedade GA4

1. Acesse: https://analytics.google.com
2. Login com sua conta Google
3. Clique: **"Criar"** ou **"+ Propriedade"**
4. Nome: `Reset Primal`
5. Fuso horário: `America/Sao_Paulo`
6. Moeda: `BRL`
7. Clique: **"Criar"**

### 1.2 Configurar Data Stream

1. Propriedade criada → Clique na aba **"Data Streams"**
2. Clique: **"Adicionar stream"**
3. Plataforma: **"Web"**
4. URL do site: `https://resetprimal.com.br`
5. Nome da stream: `Landing Page`
6. Clique: **"Criar stream"**

### 1.3 Obter Property ID e Measurement ID

**Data Stream criada**, você verá:
- **Measurement ID**: `G-XXXXXXXXX` (você precisa deste!)
- **Property ID**: `123456789` (você também precisa deste!)

**Copiar e colar em `.env`:**
```
GA4_PROPERTY_ID=123456789
GA4_MEASUREMENT_ID=G-XXXXXXXXX
```

### 1.4 Instalar Script GA4

**Opção A: Google Tag Manager (Recomendado)**

1. Acesse: https://tagmanager.google.com
2. Crie novo container
3. Container type: **Web**
4. Nome: `Reset Primal`
5. Adicione tag GA4
6. Copie o script GTM
7. Cole em `<head>` da LP:

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXX');</script>
<!-- End Google Tag Manager -->
```

**Opção B: Direto no HTML (Simples)**

1. Coloque no `<head>` de `/landing-page/grand-slam/index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXX', {
    'page_path': window.location.pathname,
    'page_title': document.title
  });
</script>
```

**Substitua `G-XXXXXXXXX` pelo seu Measurement ID.**

### 1.5 Configurar Eventos Customizados

**Adicione em `<script>` no final da LP:**

```javascript
// ════════════════════════════════════════════
// GOOGLE ANALYTICS 4 - EVENTOS CUSTOMIZADOS
// ════════════════════════════════════════════

// Evento 1: Clique em CTA
document.querySelectorAll('.cta-button').forEach((btn, index) => {
  btn.addEventListener('click', function() {
    gtag('event', 'click_cta_button', {
      'button_position': index + 1,
      'button_text': btn.innerText,
      'destination': 'hotmart'
    });
  });
});

// Evento 2: Scroll Depth (40%, 60%, 80%, 100%)
let scrollPercentagesTracked = new Set();

window.addEventListener('scroll', function() {
  const scrollPercentage = Math.round(
    (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
  );
  
  [40, 60, 80, 100].forEach(percent => {
    if (scrollPercentage >= percent && !scrollPercentagesTracked.has(percent)) {
      scrollPercentagesTracked.add(percent);
      gtag('event', 'scroll_depth', {
        'percent_scrolled': percent
      });
    }
  });
});

// Evento 3: Tempo na página (30s, 60s, 120s)
const timeTrackingPoints = [30, 60, 120]; // segundos
let timeTracked = new Set();

setInterval(function() {
  const timeOnPage = Math.round((Date.now() - window.pageLoadTime) / 1000);
  
  timeTrackingPoints.forEach(seconds => {
    if (timeOnPage >= seconds && !timeTracked.has(seconds)) {
      timeTracked.add(seconds);
      gtag('event', 'time_on_page', {
        'seconds': seconds
      });
    }
  });
}, 1000);

// Capturar tempo de carregamento
window.pageLoadTime = Date.now();
```

### 1.6 Testar GA4

1. Abra a LP: `https://resetprimal.com.br`
2. Acesse GA4: https://analytics.google.com
3. Propriedade → **Real-time** (lado esquerdo)
4. Você deve ver atividade em tempo real
5. Scroll na página → Evento `scroll_depth` aparece
6. Clique CTA → Evento `click_cta_button` aparece

---

## PARTE 2: FACEBOOK PIXEL

### 2.1 Criar Pixel

1. Acesse: https://business.facebook.com
2. Vá para: **Business Settings** → **Data Sources** → **Pixels**
3. Clique: **"Create Pixel"**
4. Nome: `Reset Primal Landing Page`
5. URL do site: `https://resetprimal.com.br`
6. Clique: **"Create Pixel"**

### 2.2 Obter Pixel ID

Facebook vai gerar um **Pixel ID** (ex: `123456789012345`)

**Colar em `.env`:**
```
FACEBOOK_PIXEL_ID=123456789012345
```

### 2.3 Instalar Código Pixel

**Adicione em `<head>` da LP:**

```html
<!-- Facebook Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '123456789012345'); // Substitua o ID
  fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=123456789012345&ev=PageView&noscript=1"
/></noscript>
<!-- End Facebook Pixel -->
```

### 2.4 Eventos Facebook Pixel

**Adicione em `<script>` no final da LP:**

```javascript
// ════════════════════════════════════════════
// FACEBOOK PIXEL - EVENTOS CUSTOMIZADOS
// ════════════════════════════════════════════

// Evento 1: Clique CTA (InitiateCheckout)
document.querySelectorAll('.cta-button').forEach(btn => {
  btn.addEventListener('click', function() {
    fbq('track', 'InitiateCheckout', {
      value: 97.00,
      currency: 'BRL',
      content_name: 'Reset Primal Protocol',
      content_type: 'product'
    });
  });
});

// Evento 2: Visualizar conteúdo chave (ViewContent)
// Quando chegar na seção de "Oferta"
window.addEventListener('scroll', function() {
  const offerSection = document.querySelector('.offer');
  if (offerSection) {
    const rect = offerSection.getBoundingClientRect();
    if (rect.top < window.innerHeight && !window.offerViewed) {
      window.offerViewed = true;
      fbq('track', 'ViewContent', {
        content_name: 'Offer Section',
        content_type: 'product',
        value: 97.00,
        currency: 'BRL'
      });
    }
  }
});

// Evento 3: Purchase (quando Hotmart confirma)
// Este é dispara quando webhook sucede (server-side ideal)
function trackPurchase(orderId, email) {
  fbq('track', 'Purchase', {
    value: 97.00,
    currency: 'BRL',
    content_name: 'Reset Primal',
    content_type: 'product',
    content_id: orderId
  });
}
```

### 2.5 Testar Facebook Pixel

1. Instale extensão: **Facebook Pixel Helper**
2. Abra a LP: `https://resetprimal.com.br`
3. Clique ícone da extensão
4. Deve aparecer: **"Pixel 123456789012345"** (verde)
5. Clique nele para ver eventos disparados
6. Scroll → evento `ViewContent` aparece
7. Clique CTA → evento `InitiateCheckout` aparece

---

## PARTE 3: INTEGRAÇÃO HOTMART COM ANALYTICS

### 3.1 Rastrear Conversão (Compra)

Quando webhook Hotmart dispara com sucesso, você precisa rastrear como conversão.

**No seu webhook (`/api/webhook.js`):**

```javascript
async function procesarVenda(event) {
  // ... código anterior ...
  
  // Rastrear conversão em GA4 e Facebook
  await rastrearConversao({
    email: event.buyer.email,
    sale_id: event.sale.id,
    price: event.sale.price
  });
}

async function rastrearConversao(dados) {
  // GA4 Measurement Protocol
  const ga4Response = await fetch(
    'https://www.google-analytics.com/mp/collect?measurement_id=G-XXXXXXXXX&api_secret=sua_api_secret',
    {
      method: 'POST',
      body: JSON.stringify({
        client_id: dados.email,
        events: [{
          name: 'purchase',
          params: {
            value: dados.price,
            currency: 'BRL',
            transaction_id: dados.sale_id
          }
        }]
      })
    }
  );

  // Facebook Conversion API
  const fbResponse = await fetch(
    'https://graph.facebook.com/v18.0/123456789012345/events?access_token=seu_token',
    {
      method: 'POST',
      body: JSON.stringify({
        data: [{
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          user_data: {
            em: crypto.createHash('sha256').update(dados.email).digest('hex'),
            ph: null
          },
          custom_data: {
            value: dados.price,
            currency: 'BRL',
            content_name: 'Reset Primal'
          }
        }]
      })
    }
  );
}
```

### 3.2 Criar Conversão no Facebook

1. Facebook Business → **Events Manager**
2. Clique no seu Pixel
3. **"Conversions"** → **"Create Conversion"**
4. Event source: `Pixel`
5. Conversion event: `Purchase`
6. Clique: **"Create"**

---

## PARTE 4: DASHBOARD E RELATÓRIOS

### 4.1 GA4 Dashboard

**Crie um dashboard personalizado:**

1. GA4 → **Dashboards** → **"Create new dashboard"**
2. Adicione gráficos:
   - **Users by source** (de onde vêm)
   - **Events count** (GA4 vs pageviews)
   - **Click CTA button** (quantas clicaram)
   - **Scroll depth** (quanto scrollam)
   - **Purchase conversion** (quantas vendas)

### 4.2 Facebook Analytics Dashboard

1. Facebook Ads Manager → **Analytics**
2. Veja:
   - Impressões na página
   - Cliques
   - Conversões (Purchase)
   - ROI se rodar anúncios

### 4.3 Planilha Google Sheets (Manual)

Crie planilha para rastrear vendas:

```
Data    | Email           | Hotmart ID | Valor | Status
--------|-----------------|------------|-------|-------
27/01   | joao@email.com  | ABC123     | 97    | ✅
28/01   | maria@email.com | DEF456     | 97    | ✅
```

---

## PARTE 5: CHECKLIST

- [ ] GA4 propriedade criada?
- [ ] Measurement ID copiado para `.env`?
- [ ] Script GA4 está em `<head>` da LP?
- [ ] GA4 mostra tráfego em tempo real?
- [ ] Eventos customizados disparando?
- [ ] Facebook Pixel criado?
- [ ] Pixel ID copiado para `.env`?
- [ ] Script Pixel está em `<head>` da LP?
- [ ] Pixel Helper mostra eventos?
- [ ] Webhook está rastreando conversões?
- [ ] Dashboard GA4 criado?
- [ ] Dashboard Facebook criado?

---

## PARTE 6: MÉTRICAS IMPORTANTES

| Métrica | GA4 | Facebook | Hotmart |
|---------|-----|----------|---------|
| **Visitantes únicos** | ✅ | ✅ | - |
| **Pageviews** | ✅ | - | - |
| **Scroll depth** | ✅ | - | - |
| **Cliques CTA** | ✅ | ✅ | - |
| **Vendas/Conversões** | ✅ | ✅ | ✅ |
| **Revenue** | ✅ | ✅ | ✅ |
| **CAC (Custo por cliente)** | - | ✅ | - |
| **ROI** | - | ✅ | - |

---

**Status:** ✅ Pronto para implementação  
**Próximo:** `docs/CONVERSAO-TRACKING.md`

Dúvidas? Ver `docs/TROUBLESHOOTING.md`
