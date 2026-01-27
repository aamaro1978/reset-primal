# INTEGRAÇÃO HOTMART - Reset Primal
## Landing Page → Hotmart Checkout → E-book

**Status:** CRÍTICO - Implementar ANTES do lançamento  
**Impacto:** Sem esta integração, LP tem 0% conversão  
**Tempo:** ~30-45 minutos para implementar e testar  

---

## 1. PASSO 1: OBTER LINK HOTMART CORRETO

### 1.1 Qual Link Usar?

Existem 3 possibilidades:

**OPÇÃO A: Link de Afiliado (REC.)****
```
https://pay.hotmart.com/S96024805Y
```
- ✅ Usa link do seu próprio produto
- ✅ Recebe 100% da comissão (você é produtor)
- ✅ Recomendado para landing page principal

**OPÇÃO B: Link de Afiliado Externo**
```
https://pay.hotmart.com/SEU-LINK-UNICO
```
- ❌ Para se você for afiliado de outro
- ❌ Recebe apenas comissão (não renda total)

**OPÇÃO C: Checkout Customizado (Avançado)**
```
https://pay.hotmart.com/PRODUCT_ID
```
- ⚠️ Requer API Hotmart
- ⚠️ Controle maior mas mais complexo

### 1.2 Onde Encontrar Seu Link

1. Acesse: https://app.hotmart.com
2. Faça login
3. Vá em: **Meus Produtos** → Seu produto → **Dados do Produto**
4. Procure por: **"Link de Acesso"** ou **"URL de Acesso"**
5. Copie o link completo (que começa com https://pay.hotmart.com/)

**IMPORTANTE:** Este link é público. Depois de clicar nele, leva ao checkout do Hotmart.

---

## 2. PASSO 2: INTEGRAR LINK NA LANDING PAGE

### 2.1 Onde Colocar os Botões CTA?

A landing page `landing-page/grand-slam/index.html` deve ter **3 botões CTA**:

#### ✅ SEÇÃO HERO (Topo)
```html
<a href="https://pay.hotmart.com/S96024805Y" class="cta-button">
    QUERO COMEÇAR MINHA TRANSFORMAÇÃO AGORA
</a>
```

**Localizar:** Procure por `<section class="hero">` → final desta seção

#### ✅ SEÇÃO OFERTA (Meio da página)
```html
<a href="https://pay.hotmart.com/S96024805Y" class="cta-button">
    SIM, QUERO O RESET PRIMAL AGORA — R$ 97
</a>
```

**Localizar:** Procure por `<section class="offer">` → dentro de `<div class="package-price">`

#### ✅ SEÇÃO CTA FINAL (Fundo)
```html
<a href="https://pay.hotmart.com/S96024805Y" class="cta-button">
    EU QUERO REVERTER MINHA SÍNDROME METABÓLICA AGORA — R$ 97
</a>
```

**Localizar:** Procure por `<section class="cta">` → final da página

### 2.2 Código HTML Exato

Se os botões ainda NÃO estão no arquivo, adicione este código:

```html
<!-- Botão CTA -->
<a href="https://pay.hotmart.com/S96024805Y" 
   class="cta-button" 
   id="cta-button-main">
    SIM, QUERO O RESET PRIMAL AGORA — R$ 97
</a>
```

**CSS já existe** em `<style>` (procure por `.cta-button`):
```css
.cta-button {
    display: inline-block;
    background: #4CAF50;
    color: #fff;
    font-size: 28px;
    font-weight: 900;
    padding: 24px 64px;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 2px;
    transition: all 0.3s ease;
    margin-top: 32px;
}

.cta-button:hover {
    background: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(76, 175, 80, 0.3);
}
```

### 2.3 Rastreamento de Cliques (Opcional mas Recomendado)

Adicione ID único e JavaScript para rastrear cliques:

```html
<!-- Código dentro de <script> no final do body -->
<script>
document.querySelectorAll('.cta-button').forEach((btn, index) => {
    btn.addEventListener('click', function() {
        // GA4 tracking
        if (window.gtag) {
            gtag('event', 'click_cta', {
                'button_position': index + 1,
                'destination': 'hotmart'
            });
        }
        
        // Facebook Pixel tracking
        if (window.fbq) {
            fbq('track', 'InitiateCheckout', {
                value: 97,
                currency: 'BRL'
            });
        }
    });
});
</script>
```

---

## 3. PASSO 3: TESTAR LOCALMENTE

### 3.1 Teste no Navegador

1. Abra arquivo local: `landing-page/grand-slam/index.html`
2. Procure por um botão verde (CTA buttons são #4CAF50)
3. Clique nele
4. Deve abrir nova aba com checkout Hotmart
5. **NÃO complete a compra** (teste com produto real após, se quiser)

### 3.2 Teste o Link Direto

Copie e cole em uma aba:
```
https://pay.hotmart.com/S96024805Y
```

Deve abrir o checkout. Se não abrir:
- [ ] Link está correto? (copiar direto do Hotmart)
- [ ] Produto está PUBLICADO no Hotmart? (não pode estar em rascunho)
- [ ] Produto está com preço R$ 97? (conferir)

---

## 4. PASSO 4: CONFIGURAR WEBHOOK HOTMART

**Webhook = Notificação automática quando venda acontece**

Sem webhook, você não sabe quando alguém comprou.

### 4.1 Aonde Configurar

1. Acesse: https://app.hotmart.com
2. Vá em: **Meus Dados** → **Webhooks**
3. Clique em: **"Novo Webhook"** ou **"Adicionar"**

### 4.2 URL do Webhook

Coloque esta URL exata:
```
https://resetprimal.com.br/webhook/hotmart
```

⚠️ **IMPORTANTE:** Substitua `resetprimal.com.br` pelo seu domínio real se for diferente.

### 4.3 Eventos a Rastrear

Marque APENAS estes eventos (recomendado):
- [ ] ✅ **Venda Realizada** (sale.completed)
- [ ] ✅ **Venda Cancelada** (sale.canceled)
- [ ] ✅ **Chargeback** (sale.chargeback)
- [ ] ❌ Desmarcar os outros por enquanto

### 4.4 Gerar Token/Secret

1. Hotmart vai gerar um **Token** ou **Webhook Secret**
2. Copie este token
3. Salve em `.env`:
```
HOTMART_WEBHOOK_SECRET=seu_token_aqui
```

### 4.5 Testar Webhook

1. Na página de webhook, procure por **"Testar Webhook"**
2. Clique para enviar um evento de teste
3. Verifique se chegou nos seus logs/servidor

---

## 5. PASSO 5: FLUXO COMPLETO (O que acontece)

```
VISITANTE
    ↓
Acessa: https://resetprimal.com.br
    ↓
Lê landing page (90 segundos)
    ↓
Clica botão CTA "Quero Começar"
    ↓
GA4 rastreia: evento "click_cta"
Facebook Pixel rastreia: "InitiateCheckout"
    ↓
Abre novo ABA → Hotmart Checkout
    ↓
Preenche: email, CPF, cartão
    ↓
Clica "Comprar"
    ↓
Hotmart processa pagamento
    ↓
SE SIM (compra aprovada):
    ├─ Webhook dispara para: /webhook/hotmart
    ├─ Seu servidor recebe: dados da compra (email, valor, etc)
    ├─ Você registra em BD ou planilha
    ├─ Hotmart redireciona para: sua página de sucesso
    ├─ GA4 rastreia: evento "purchase"
    └─ Facebook Pixel rastreia: "Purchase"
    
SE NÃO (compra rejeitada):
    ├─ Hotmart mostra erro no checkout
    └─ Visitante pode tentar novamente
```

---

## 6. O QUE HOTMART ENVIA NO WEBHOOK

Quando venda é confirmada, Hotmart faz POST para sua URL com JSON assim:

```json
{
  "status": "completed",
  "buyer": {
    "email": "cliente@email.com",
    "name": "João Silva",
    "cpf": "123.456.789-00"
  },
  "product": {
    "id": "S96024805Y",
    "name": "Reset Primal",
    "price": 97
  },
  "sale": {
    "id": "ABC123XYZ",
    "date": "2026-01-27T14:30:00Z",
    "payment_method": "credit_card"
  }
}
```

**Você deve:**
1. Validar token/secret (segurança)
2. Registrar vendedor em DB
3. Enviar email de confirmação com link do e-book
4. Dar acesso ao e-book

---

## 7. TROUBLESHOOTING

### ❌ Problema: Botão CTA não aparece
**Solução:** 
1. Verifique se `class="cta-button"` está correto
2. Verifique se CSS tem `.cta-button` (está logo no começo do `<style>`)
3. Teste em outro navegador
4. Limpe cache: Ctrl+Shift+Delete

### ❌ Problema: Clica botão mas não vai para Hotmart
**Solução:**
1. Verifique se `href="https://pay.hotmart.com/..."` está completo
2. Link está com typo? Copie direto do Hotmart
3. Produto está publicado no Hotmart? (não rascunho)
4. Teste o link direto em navegador

### ❌ Problema: Vai para Hotmart mas página de erro 404
**Solução:**
1. Link copiado está errado
2. Vá em Hotmart → Meus Produtos → Copie link exato novamente
3. Compare: deve começar com `https://pay.hotmart.com/`

### ❌ Problema: Webhook não está funcionando
**Solução:**
1. URL está correta? `https://resetprimal.com.br/webhook/hotmart`
2. Teste webhook: Hotmart → Webhooks → Enviar teste
3. Verifique logs do servidor
4. HTTPS está ativo? (webhook requer https)
5. Servidor está respondendo HTTP 200?

### ❌ Problema: Compra não chega (webhook não dispara)
**Solução:**
1. Espere 5-10 minutos (Hotmart processa)
2. Verifique Hotmart → Minhas Vendas (venda aparece lá?)
3. Se apareça em Hotmart mas não no webhook → problema no seu servidor
4. Se não apareça em Hotmart → problema no Hotmart (contatar suporte)

---

## 8. CHECKLIST DE LANÇAMENTO

Antes de publicar, verifique TUDO:

### Código HTML
- [ ] Botão CTA tem `href="https://pay.hotmart.com/S96024805Y"` (seu link)?
- [ ] Botão tem classe `class="cta-button"`?
- [ ] Tem 3 botões CTA (topo, meio, final)?
- [ ] Texto do botão é claro: "Quero Começar" ou similar?

### Testando Localmente
- [ ] Abrir arquivo em navegador
- [ ] Clicar botão CTA
- [ ] Abre nova aba com Hotmart?
- [ ] Página de checkout carrega?

### Hotmart Setup
- [ ] Link é de seu PRÓPRIO produto (não afiliado)?
- [ ] Produto está PUBLICADO (não rascunho)?
- [ ] Preço está R$ 97?
- [ ] Webhook está configurado: `https://resetprimal.com.br/webhook/hotmart`?
- [ ] Token/Secret webhook está em `.env`?

### Analytics
- [ ] GA4 instalado na LP?
- [ ] Rastreamento de clique CTA configurado?
- [ ] Facebook Pixel instalado?
- [ ] Evento "InitiateCheckout" rastreado?

### Segurança
- [ ] Link Hotmart é públic (ok, é para vender)
- [ ] Token webhook NÃO está no código (está em .env)?
- [ ] .env está no .gitignore?

### Teste Completo
- [ ] Entrar na LP
- [ ] Scroll até fundo
- [ ] Clicar CTA
- [ ] Hotmart abre
- [ ] GA4 registra evento
- [ ] Facebook Pixel dispara

---

## 9. URLS FINAIS

```
Landing Page: https://resetprimal.com.br
Hotmart Link: https://pay.hotmart.com/S96024805Y
Webhook: https://resetprimal.com.br/webhook/hotmart
Sucesso: https://resetprimal.com.br/sucesso
E-book: https://resetprimal.com.br/ebook
```

---

## 10. REFERÊNCIAS

- Documentação Hotmart: https://docs.hotmart.com/
- Webhooks Hotmart: https://docs.hotmart.com/webhooks
- Test Hotmart Link: Clique em `https://pay.hotmart.com/S96024805Y`

---

**Status:** ✅ Pronto para implementação  
**Próximo passo:** Ir para `docs/WEBHOOKS-SETUP.md`

Dúvidas? Ver `docs/TROUBLESHOOTING.md`
