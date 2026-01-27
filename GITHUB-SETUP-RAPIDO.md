# 🔐 GitHub Setup Rápido - Reset Primal

**Para quando você retornar da aula!**

---

## ⏱️ TEMPO: 5 minutos

---

## Opção 1: Usar Personal Access Token (MAIS FÁCIL) ✅

### Passo 1: Gerar Token

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token" → "Generate new token (classic)"
3. Nome: `Reset Primal Deploy`
4. Permissões (marque):
   - ☑️ `repo` (Full control of private repositories)
5. Clique "Generate token"
6. **COPIE o token** (começa com `ghp_...`)

### Passo 2: Clonar com Token

**No seu computador local:**

```bash
# Usar o token como senha
git clone https://seutoken@github.com/seu-usuario/reset-primal.git

# Exemplo real:
git clone https://ghp_abc123xyz@github.com/singullarco/reset-primal.git /var/www/reset-primal
```

---

## Opção 2: SSH Key (MAIS SEGURO)

Se você já tem SSH key configurada no GitHub:

```bash
git clone git@github.com:seu-usuario/reset-primal.git
```

---

## Opção 3: TAR Comprimido (SEM GIT)

Se não quer usar Git agora:

```bash
# No seu computador local:
cd /Users/acacioamaro/Projects
tar -czf reset-primal.tar.gz reset-primal/
scp reset-primal.tar.gz root@64.225.44.199:/var/www/

# No servidor:
cd /var/www
tar -xzf reset-primal.tar.gz
rm reset-primal.tar.gz
```

---

## ✅ Depois de Clonar/Copiar

```bash
# Verificar
ls -la /var/www/reset-primal/
cat /var/www/reset-primal/.env | grep HOTMART

# Deve mostrar as credenciais (não placeholders)
# HOTMART_WEBHOOK_SECRET=upan5FYAJLzL2nA46gm9...
# GOOGLE_ANALYTICS_PROPERTY_ID=G-KKTGW6BEJP
# FACEBOOK_PIXEL_ID=1164114415287965
# GMAIL_USER=singullarco@gmail.com
# GMAIL_PASSWORD=oxluiocfahqgmojz
```

Se tudo OK, execute:

```bash
cd /var/www/reset-primal
chmod +x deploy-producao.sh
sudo bash deploy-producao.sh
```

---

**Quando retornar, siga uma dessas 3 opções acima e retome!** ✅
