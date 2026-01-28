# Production Deployment Checklist

Complete este checklist antes de fazer deploy em produção.

## Pre-Deployment (1-2 dias antes)

### Code Review
- [ ] Todos os testes passam: `npm test`
- [ ] Linting limpo: `npm run lint`
- [ ] Type checking ok: `npm run typecheck`
- [ ] Sem console.log ou debug code
- [ ] Commits descritivos
- [ ] Git push para branch main

### Database
- [ ] Todas as migrations criadas
- [ ] Schema.prisma revisado
- [ ] Backup anterior testado
- [ ] Migration script testado localmente
- [ ] Índices de performance criados

### Security
- [ ] .env.production criado com valores reais
- [ ] JWT_SECRET tem 32+ caracteres aleatórios
- [ ] Database password tem 20+ caracteres
- [ ] CORS_ORIGIN correto (https://resetprimal.com.br)
- [ ] Sem secrets no .gitignore
- [ ] Nenhuma hardcoded password no código

### Infrastructure
- [ ] Servidor Linux preparado
- [ ] Docker instalado
- [ ] Docker Compose instalado
- [ ] SSL certificate gerado (Let's Encrypt)
- [ ] Nginx configurado
- [ ] Firewall rules configuradas (abrir 80, 443)

### Documentation
- [ ] README atualizado
- [ ] PRODUCTION_DEPLOYMENT.md revisado
- [ ] NGINX_AUTH_REQUEST.md disponível
- [ ] Runbook criado para rollback
- [ ] Credenciais armazenadas seguramente (1Password, Vault, etc)

## Day of Deployment

### Morning (T-60 min)

- [ ] Notificar time sobre deployment
- [ ] Criar branch de release
- [ ] Final code review
- [ ] Preparar rollback procedure
- [ ] Abrir janela de manutenção (se necessário)

### Pre-Deployment (T-15 min)

- [ ] Backup completo do banco
- [ ] Export customer data (se necessário)
- [ ] Screenshot dos metrics atuais
- [ ] SSH acesso testado ao servidor
- [ ] Docker credentials configuradas

### Deployment (T-0)

```bash
# 1. SSH para o servidor
ssh user@resetprimal.com.br

# 2. Verificar espaço em disco
df -h

# 3. Fazer backup
cd /opt/reset-primal
./scripts/backup.sh

# 4. Pull código mais recente
git pull origin main

# 5. Review .env.production
cat .env.production | grep -E "JWT_SECRET|DATABASE_URL|SENDGRID"

# 6. Deploy
./scripts/deploy.sh production

# 7. Monitorar logs
docker-compose -f docker-compose.production.yml logs -f
```

- [ ] Deployment script executado sem erros
- [ ] Containers estão rodando: `docker ps`
- [ ] Database migrations completadas
- [ ] Health check passa: `curl https://resetprimal.com.br/health`

### Post-Deployment Tests (T+10 min)

- [ ] **Health Check**
  ```bash
  curl -H "Accept: application/json" \
       https://resetprimal.com.br/health
  ```
  Esperado: `{"status":"ok","database":"connected"}`

- [ ] **Registration**
  ```bash
  curl -X POST https://resetprimal.com.br/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test-'$(date +%s)'@example.com","password":"Test123!","name":"Test User"}'
  ```
  Esperado: 201 Created

- [ ] **Login**
  ```bash
  curl -X POST https://resetprimal.com.br/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password"}'
  ```
  Esperado: 200 OK com JWT token

- [ ] **E-book Access Control**
  ```bash
  # Sem token (deve rejeitar)
  curl https://resetprimal.com.br/ebook/
  # Esperado: 401 ou redirect para login

  # Com token (deve aceitar se tem compra)
  curl -H "Authorization: Bearer $TOKEN" \
       https://resetprimal.com.br/api/auth/products
  # Esperado: 200 com lista de produtos
  ```

- [ ] **Analytics Dashboard**
  ```bash
  curl -H "Authorization: Bearer $ADMIN_TOKEN" \
       https://resetprimal.com.br/api/analytics/dashboard
  # Esperado: 200 com dashboard data
  ```

- [ ] **Webhook**
  ```bash
  curl -X POST https://resetprimal.com.br/webhook/hotmart \
    -H "Content-Type: application/json" \
    -H "X-Hotmart-Signature: fake_signature" \
    -d '{"test":"data"}'
  # Esperado: 401 Invalid signature (normal, signature inválida)
  ```

- [ ] **Customer Endpoints**
  ```bash
  curl -H "Authorization: Bearer $ADMIN_TOKEN" \
       https://resetprimal.com.br/api/customers
  # Esperado: 200 com lista de clientes
  ```

### Monitoring (T+30 min)

- [ ] CPU usage normal (<30%)
- [ ] Memory usage normal (<50%)
- [ ] Database connections healthy
- [ ] No error logs spike
- [ ] Response times normal (<200ms)
- [ ] No 5xx errors in logs

```bash
# Verificar stats
docker stats

# Verificar logs de erro
docker-compose -f docker-compose.production.yml logs backend | grep ERROR | tail -20
```

- [ ] Webhook do Hotmart funcionando (se houver tráfego)
- [ ] Emails enviados corretamente (verificar SendGrid)
- [ ] Google Analytics rastreando (verificar GA4)
- [ ] Facebook Pixel disparando (verificar Ads Manager)

### Communicate Status

- [ ] Notificar time que deployment foi bem-sucedido
- [ ] Update status page (se houver)
- [ ] Tweet/anúncio (se aplicável)
- [ ] Log deployment no Slack/Discord

## Post-Deployment (1-2 horas)

### Monitor Closely

- [ ] A cada 15 minutos nos primeiros 2 horas:
  - [ ] Health check
  - [ ] Error logs
  - [ ] Performance metrics
  - [ ] User reports

### Run Smoketest Suite

```bash
# Rodar suite completa de testes
npm run test:e2e

# Rodar performance tests
npm run test:perf
```

- [ ] Todos os testes passam
- [ ] Performance está dentro do esperado
- [ ] Sem degradação de funcionalidade

### Data Integrity Checks

```bash
# Verificar integridade dos dados
docker-compose exec postgres psql -U reset_primal_user -d reset_primal << EOF
  SELECT COUNT(*) as user_count FROM users;
  SELECT COUNT(*) as purchase_count FROM purchases;
  SELECT COUNT(*) as session_count FROM sessions;
  SELECT COUNT(*) as audit_log_count FROM audit_logs;
EOF
```

- [ ] Contagem de registros está correta
- [ ] Nenhuma corrupção de dados
- [ ] Histórico preservado

### Backup Verification

```bash
# Verificar backup foi criado
ls -lh /opt/reset-primal/backups/ | head -5
```

- [ ] Arquivo de backup criado
- [ ] Tamanho do backup é razoável (>1MB)

## Rollback Plan (se necessário)

### If Everything Breaks

```bash
cd /opt/reset-primal

# 1. Stop containers
docker-compose -f docker-compose.production.yml down

# 2. Get latest backup
LATEST_BACKUP=$(ls -t /opt/reset-primal/backups/*.dump | head -1)

# 3. Restore
docker-compose -f docker-compose.production.yml up -d postgres

# 4. Wait for DB
sleep 30

# 5. Restore data
docker-compose exec postgres \
  pg_restore -U reset_primal_user -d reset_primal -c \
  < "$LATEST_BACKUP"

# 6. Start backend with previous version
git checkout HEAD~1
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# 7. Verify
curl https://resetprimal.com.br/health
```

- [ ] Rollback executado sem erros
- [ ] Health check passa após rollback
- [ ] Dados restaurados corretamente
- [ ] Notificar team sobre rollback

## Post-Rollback

- [ ] Investigar causa do problema
- [ ] Fix issues locally
- [ ] Criar test case para prevenir regressão
- [ ] Agendar novo deployment

## Success Criteria

O deployment foi bem-sucedido se:

- ✅ Todos os health checks passaram
- ✅ Nenhum erro crítico nos logs
- ✅ Todos os endpoints respondendo
- ✅ Webhook funcionando
- ✅ Emails sendo enviados
- ✅ Analytics rastreando
- ✅ Sem reclamações de usuários
- ✅ Performance dentro do esperado
- ✅ Backup testado e funcional

## Team Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| DevOps Lead | [Name] | [Phone] | [Email] |
| Backend Lead | [Name] | [Phone] | [Email] |
| On-Call | [Name] | [Phone] | [Email] |

## Post-Deployment Sync

- [ ] Reunião de retrospectiva agendada
- [ ] Documentação atualizada
- [ ] Lições aprendidas capturadas
- [ ] Automation sugerida para próximos deploys

---

**Deployment Date**: _______________
**Started at**: _______________
**Completed at**: _______________
**Status**: ☐ Success ☐ Partial ☐ Rollback

**Notes**:
```
[Adicione notas aqui]
```

**Signed by**: _______________ (DevOps/Tech Lead)
