# 👨‍💻 IMPLEMENTAÇÃO FRONTEND - STEP BY STEP
## Reset Primal - Integração Hotmart + GA4 + Facebook Pixel

**Data:** 27 de janeiro de 2026  
**Status:** Pronto para começar  
**Tempo total:** 2h 30min  
**Arquivo principal:** `landing-page/grand-slam/index.html`  

---

## 📋 ANTES DE COMEÇAR

### Pré-requisitos:
- [ ] Arquivo `landing-page/grand-slam/index.html` aberto no editor
- [ ] Documentos de referência salvos (INTEGRACAO-HOTMART.md, ANALYTICS-SETUP.md)
- [ ] Link Hotmart recebido do Product Manager
- [ ] GA4_MEASUREMENT_ID recebido do Product Manager
- [ ] FACEBOOK_PIXEL_ID recebido do Product Manager

### Checklist de Preparação:
```
CREDENCIAIS NECESSÁRIAS (confirme com PM):

HOTMART_AFFILIATE_LINK = https://pay.hotmart.com/S96024805Y
GA4_MEASUREMENT_ID = G-XXXXXXXXX
FACEBOOK_PIXEL_ID = 123456789012345
```

---

## ✅ TASK 1: INTEGRAR LINK HOTMART NOS BOTÕES CTA
**Tempo:** 45 minutos  
**Resultado:** 2 botões atualizados com link Hotmart

### 1.1 - Localizar os Botões CTA Atuais

O arquivo já tem botões `.cta-button`. Vamos encontrá-los:

**No editor, procure por (Ctrl+F):**
```
<a href="#comprar"
```

**Resultado: Você vai encontrar 2 botões (em linhas aproximadas):**

**Botão 1 (Offer Section - linha ~800):**
```html
<a href="#comprar" class="cta-button">QUERO REVERTER AGORA</a>
```

**Botão 2 (CTA Final Section - linha ~1050):**
```html
<a href="#comprar" class="cta-button">COMEÇAR AGORA</a>
```

**Botão 3 (Final Message - linha ~1200):**
```html
<a href="#comprar" class="cta-button">COMEÇAR AGORA</a>
```

### 1.2 - Atualizar Botão 1 (Offer Section)

**ANTES:**
```html
<a href="#comprar" class="cta-button">QUERO REVERTER AGORA</a>
```

**DEPOIS:**
```html
<a href="https://pay.hotmart.com/S96024805Y" class="cta-button" id="cta-offer">
    QUERO REVERTER AGORA
</a>
```

**Como fazer:**
1. Procure por: `<a href="#comprar" class="cta-button">QUERO REVERTER AGORA</a>`
2. Selecione o `href="#comprar"`
3. Substitua por: `href="https://pay.hotmart.com/S96024805Y" id="cta-offer"`
4. **Salve (Ctrl+S)**

### 1.3 - Atualizar Botão 2 (CTA Final Section)

**ANTES:**
```html
<h2>SUA DECISÃO HOJE DEFINE OS PRÓXIMOS 10 ANOS</h2>
...
<a href="#comprar" class="cta-button">COMEÇAR AGORA</a>
```

**DEPOIS:**
```html
<a href="https://pay.hotmart.com/S96024805Y" class="cta-button" id="cta-final">
    COMEÇAR AGORA
</a>
```

**Como fazer:**
1. Procure por: `<h2>SUA DECISÃO HOJE DEFINE OS PRÓXIMOS 10 ANOS</h2>`
2. Logo após, encontre o botão CTA
3. Atualize o link para: `href="https://pay.hotmart.com/S96024805Y" id="cta-final"`
4. **Salve (Ctrl+S)**

### 1.4 - Atualizar Botão 3 (Final Message)

**ANTES:**
```html
<a href="#comprar" class="cta-button">COMEÇAR AGORA</a>
```

**DEPOIS:**
```html
<a href="https://pay.hotmart.com/S96024805Y" class="cta-button" id="cta-final-msg">
    COMEÇAR AGORA
</a>
```

**Como fazer:**
1. Procure por: `<p class="final-highlight">`
2. Logo após, encontre o botão
3. Atualize: `href="https://pay.hotmart.com/S96024805Y" id="cta-final-msg"`
4. **Salve (Ctrl+S)**

### 1.5 - Testar Localmente

**Teste:**
1. Abra o arquivo em navegador (live server ou duplo-clique)
2. Procure pelos 3 botões de CTA (verde, botom)
3. Clique em cada um
4. Deve abrir página Hotmart em nova aba
5. URL deve ser: `https://pay.hotmart.com/S96024805Y`

**Se não abrir:**
- [ ] Link está corrigido no HTML?
- [ ] Link começa com `https://pay.hotmart.com/`?
- [ ] Sem espaços extras no href?
- [ ] Arquivo foi salvo?

✅ **TASK 1 CONCLUÍDA**

---

## ✅ TASK 2: INSTALAR GOOGLE ANALYTICS 4
**Tempo:** 45 minutos  
**Resultado:** GA4 rastreando pageviews e eventos

### 2.1 - Localizar a Seção `<head>`

**Procure por (Ctrl+F):**
```
</head>
```

**Resultado:** Você vai encontrar a tag de fechamento `</head>` (aproximadamente linha 180-200)

Coloque o cursor **ANTES** da tag `</head>` (deixe um espaço acima dela)

### 2.2 - Inserir Script GA4

**Adicione este código (copie e cole) ANTES de `</head>`:**

```html
    <!-- Google Analytics 4 -->
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

### 2.3 - Substituir o ID GA4

**IMPORTANTE:** Substitua `G-XXXXXXXXX` pelo ID real que PM passou:

**ANTES:**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXX"></script>
...
gtag('config', 'G-XXXXXXXXX', {
```

**DEPOIS (exemplo):**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ"></script>
...
gtag('config', 'G-ABC123XYZ', {
```

### 2.4 - Testar GA4

**Teste:**
1. Salve o arquivo (Ctrl+S)
2. Abra em navegador
3. Abra **DevTools** (F12)
4. Vá para **Console**
5. Execute: `console.log(window.gtag ? '✅ GA4' : '❌ Sem GA4')`
6. Deve aparecer: ✅ GA4

**Se vir ❌ Sem GA4:**
- [ ] ID GA4 foi corrigido?
- [ ] Script está dentro de `<head>`?
- [ ] Arquivo foi salvo?
- [ ] Está usando o navegador certo?

### 2.5 - Validação Final GA4

**No console do navegador:**
```javascript
// Verificar que GA4 está pronto
if (window.gtag) {
  console.log('✅ GA4 PRONTO');
  gtag('event', 'page_view');
  console.log('✅ Evento enviado');
} else {
  console.log('❌ GA4 NÃO DETECTADO');
}
```

✅ **TASK 2 CONCLUÍDA**

---

## ✅ TASK 3: INSTALAR FACEBOOK PIXEL
**Tempo:** 45 minutos  
**Resultado:** Facebook Pixel rastreando visitas e cliques

### 3.1 - Localizar a Seção `<head>` (novamente)

**Procure por (Ctrl+F):**
```
</head>
```

**Resultado:** A mesma tag `</head>` (linha ~180-200)

Coloque o cursor **DEPOIS** do script GA4, mas **ANTES** de `</head>`

### 3.2 - Inserir Script Facebook Pixel

**Adicione este código ANTES de `</head>`:**

```html
    <!-- Facebook Pixel -->
    <script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '123456789012345'); // SUBSTITUIR PELO SEU PIXEL ID
      fbq('track', 'PageView');
    </script>
    <noscript><img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=123456789012345&ev=PageView&noscript=1"
    /></noscript>
    <!-- End Facebook Pixel -->
```

### 3.3 - Substituir o Pixel ID

**IMPORTANTE:** Substitua `123456789012345` (DUAS VEZES) pelo ID real que PM passou:

**ANTES:**
```javascript
fbq('init', '123456789012345'); // SUBSTITUIR PELO SEU PIXEL ID
...
src="https://www.facebook.com/tr?id=123456789012345&ev=PageView&noscript=1"
```

**DEPOIS (exemplo):**
```javascript
fbq('init', 'ABC123456789012'); // Seu pixel ID
...
src="https://www.facebook.com/tr?id=ABC123456789012&ev=PageView&noscript=1"
```

### 3.4 - Testar Facebook Pixel

**Teste com extensão:**
1. Instale extensão: **Facebook Pixel Helper** (Chrome Web Store)
2. Recarregue a página (F5)
3. Clique no ícone da extensão (canto superior direito)
4. Deve aparecer: **"Pixel ABC123... Ativo"** (verde)
5. Clique nele para ver eventos

**Se não aparecer o Pixel:**
- [ ] Pixel ID foi corrigido (em ambos os locais)?
- [ ] Arquivo foi salvo?
- [ ] Extensão está instalada?
- [ ] Está em modo incógnito? (extensão não funciona lá)

### 3.5 - Validação Final Facebook Pixel

**No console:**
```javascript
console.log(window.fbq ? '✅ Pixel' : '❌ Sem Pixel');
```

✅ **TASK 3 CONCLUÍDA**

---

## ✅ TASK 4: CONFIGURAR EVENTOS CUSTOMIZADOS
**Tempo:** 30 minutos  
**Resultado:** Rastreamento de cliques, scroll e tempo

### 4.1 - Localizar a Seção `<script>` Final

**Procure por (Ctrl+F):**
```
<!-- ═══════════════════════════════════════════════════════
     JAVASCRIPT
```

**Resultado:** Você vai encontrar a seção de scripts (linha ~1350)

Vamos **ANTES** do `</body>` final, adicionar eventos customizados.

### 4.2 - Adicionar Eventos GA4

**Procure por:**
```javascript
// Smooth scroll for CTA buttons
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
```

**ANTES desse trecho, adicione:**

```javascript
        // ════════════════════════════════════════════════════════
        // EVENTOS GA4 CUSTOMIZADOS
        // ════════════════════════════════════════════════════════
        
        // Evento 1: Clique em CTA
        document.querySelectorAll('.cta-button').forEach((btn, index) => {
          btn.addEventListener('click', function() {
            gtag('event', 'click_cta_button', {
              'button_position': index + 1,
              'button_text': btn.innerText.trim(),
              'destination': 'hotmart'
            });
            console.log('✅ GA4: click_cta_button');
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
              console.log('✅ GA4: scroll_depth ' + percent + '%');
            }
          });
        });

        // Evento 3: Tempo na página (30s, 60s, 120s)
        const timeTrackingPoints = [30, 60, 120];
        let timeTracked = new Set();
        const pageLoadTime = Date.now();

        setInterval(function() {
          const timeOnPage = Math.round((Date.now() - pageLoadTime) / 1000);
          
          timeTrackingPoints.forEach(seconds => {
            if (timeOnPage >= seconds && !timeTracked.has(seconds)) {
              timeTracked.add(seconds);
              gtag('event', 'time_on_page', {
                'seconds': seconds
              });
              console.log('✅ GA4: time_on_page ' + seconds + 's');
            }
          });
        }, 1000);
```

### 4.3 - Adicionar Eventos Facebook Pixel

**APÓS os eventos GA4, adicione:**

```javascript
        // ════════════════════════════════════════════════════════
        // EVENTOS FACEBOOK PIXEL CUSTOMIZADOS
        // ════════════════════════════════════════════════════════
        
        // Evento 1: Clique CTA (InitiateCheckout)
        document.querySelectorAll('.cta-button').forEach(btn => {
          btn.addEventListener('click', function() {
            fbq('track', 'InitiateCheckout', {
              value: 97.00,
              currency: 'BRL',
              content_name: 'Reset Primal Protocol',
              content_type: 'product'
            });
            console.log('✅ FB Pixel: InitiateCheckout');
          });
        });

        // Evento 2: ViewContent (quando scroll para oferta)
        window.addEventListener('scroll', function() {
          const offerSection = document.querySelector('.offer');
          if (offerSection && !window.offerViewed) {
            const rect = offerSection.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
              window.offerViewed = true;
              fbq('track', 'ViewContent', {
                content_name: 'Offer Section',
                content_type: 'product',
                value: 97.00,
                currency: 'BRL'
              });
              console.log('✅ FB Pixel: ViewContent');
            }
          }
        });
```

### 4.4 - Testar Eventos

**Teste GA4 events:**
1. Abra DevTools (F12) → Console
2. Scroll na página
3. Deve aparecer mensagens:
   - `✅ GA4: scroll_depth 40%`
   - `✅ GA4: scroll_depth 60%`
   - Etc.

**Teste FB Pixel events:**
1. Instale Facebook Pixel Helper
2. Clique em um botão CTA
3. Clique na extensão
4. Deve aparecer: `InitiateCheckout`

**Se não ver eventos:**
- [ ] Código foi adicionado corretamente?
- [ ] DevTools console está aberto?
- [ ] Arquivo foi salvo e recarregado?

### 4.5 - Commit dos Eventos

```bash
git add landing-page/grand-slam/index.html
git commit -m "feat: add GA4 and Facebook Pixel events"
```

✅ **TASK 4 CONCLUÍDA**

---

## 📋 VALIDAÇÃO FINAL - CHECKLIST FRONTEND

### Código HTML
- [ ] 3 botões CTA têm link Hotmart correto?
  - [ ] Botão Offer: `href="https://pay.hotmart.com/S96024805Y"`
  - [ ] Botão CTA: `href="https://pay.hotmart.com/S96024805Y"`
  - [ ] Botão Final Message: `href="https://pay.hotmart.com/S96024805Y"`

### GA4
- [ ] Script GA4 está em `<head>`?
- [ ] Measurement ID substituído?
- [ ] Sem erro de sintaxe?
- [ ] Console mostra ✅ GA4?

### Facebook Pixel
- [ ] Script Pixel está em `<head>`?
- [ ] Pixel ID substituído (em AMBOS os locais)?
- [ ] Sem erro de sintaxe?
- [ ] Pixel Helper detecta o Pixel (verde)?

### Eventos
- [ ] Scroll dispara eventos `scroll_depth`?
- [ ] Clique CTA dispara `click_cta_button` (GA4)?
- [ ] Clique CTA dispara `InitiateCheckout` (FB)?
- [ ] Tempo dispara `time_on_page` a cada 30s?

### Geral
- [ ] Responsividade OK (mobile + desktop)?
- [ ] Sem erros no console?
- [ ] Arquivo salvo (Ctrl+S)?
- [ ] Git commit feito?

---

## 🧪 TESTES PONTA-A-PONTA

### Teste 1: Clique CTA
```
1. Abra: landing-page/grand-slam/index.html
2. DevTools → Console
3. Abra Facebook Pixel Helper
4. Clique em botão CTA
5. Esperado:
   ✅ Nova aba abre com Hotmart
   ✅ Console mostra: "✅ GA4: click_cta_button"
   ✅ Console mostra: "✅ FB Pixel: InitiateCheckout"
   ✅ Pixel Helper mostra: "InitiateCheckout" ✓
```

### Teste 2: Scroll
```
1. Abra: landing-page/grand-slam/index.html
2. Console
3. Scroll na página (40%, 60%, 80%, 100%)
4. Esperado:
   ✅ Console mostra: "✅ GA4: scroll_depth 40%"
   ✅ Console mostra: "✅ GA4: scroll_depth 60%"
   ✅ Continua até 100%
```

### Teste 3: Tempo
```
1. Abra: landing-page/grand-slam/index.html
2. Console
3. Aguarde 30s
4. Esperado:
   ✅ Console mostra: "✅ GA4: time_on_page 30s"
```

---

## 📊 RESULTADO ESPERADO

Quando terminar, você terá:

✅ **Landing Page 100% integrada com:**
- Botões CTA redirecionando para Hotmart
- Google Analytics 4 rastreando visitas e eventos
- Facebook Pixel rastreando cliques e conversões
- Eventos customizados em GA4 e Facebook

✅ **Git commit feito:**
```
feat: integrate hotmart, GA4, Facebook Pixel, and custom events
```

✅ **Pronto para:**
- Backend Dev implementar webhook
- DevOps configurar Nginx
- Product Manager testar fluxo completo

---

## ⚠️ TROUBLESHOOTING

### Problema: Botão CTA abre #comprar em vez de Hotmart
**Solução:** 
- [ ] Verificar que href foi alterado de `#comprar` para `https://pay.hotmart.com/...`
- [ ] Confirmar URL está completa (sem espaços)
- [ ] Salvar e recarregar

### Problema: GA4 não aparece
**Solução:**
- [ ] Verificar que ID GA4 foi substituído em AMBOS os locais
- [ ] Verificar script está em `<head>` (antes de `</head>`)
- [ ] Abrir console e procurar por erros
- [ ] Recarregar page (Ctrl+Shift+R para limpar cache)

### Problema: Facebook Pixel não detecta eventos
**Solução:**
- [ ] Verificar Pixel ID foi substituído em AMBOS os locais
- [ ] Verificar Facebook Pixel Helper está instalado
- [ ] Procurar por erros no console
- [ ] Tentar incógnito (Ctrl+Shift+N) - extensão não funciona lá

### Problema: Responsividade quebrou
**Solução:**
- [ ] Não mexer em CSS (deixar como está)
- [ ] Testar em mobile (F12 → Toggle device)
- [ ] Se quebrou, reverter mudanças do HTML

---

## 🎯 PRÓXIMO PASSO

Quando terminar esta task:

1. ✅ **Commit seus changes:**
   ```bash
   git add landing-page/grand-slam/index.html
   git commit -m "feat: integrate hotmart, GA4, FB Pixel, events"
   ```

2. ✅ **Notificar Backend Dev:**
   - "Frontend terminou, podem começar webhook"

3. ✅ **Aguardar Backend + DevOps:**
   - Você vai precisar do link `https://resetprimal.com.br/webhook/hotmart` para testar fluxo completo

---

**Status:** Pronto para começar  
**Tempo total:** 2h 30min  
**Próximo:** TASK 2 (Backend Dev) — Webhook

Boa sorte! 🚀

— Morgan, planejando o futuro 📊