# DESIGNAÇÃO DE AGENTES - PRÓXIMAS FASES

**Data:** 28 janeiro 2026
**Época:** Pós-FASE 1 Completa
**Responsável:** Aria (System Architect)

---

## 🎯 VISÃO GERAL

Reset Primal completou **FASE 1 (Hotmart Integration)** com sucesso.

Agora você tem:
- ✅ Landing page com GA4 + Facebook Pixel
- ✅ Webhook automático (Node.js)
- ✅ Email system (SendGrid)
- ✅ Nginx production-ready
- ✅ Documentação completa

**Próximo:** Validar em produção + iniciar FASE 2 (Testes & Qualidade)

---

## 📋 AGENTES RECOMENDADOS POR FASE

### FASE 2: TESTES & QUALIDADE (1-2 semanas)

```
┌─────────────────────────────────────────────────────────────┐
│              FASE 2: TESTES & CI/CD PIPELINE                 │
│                     (1-2 SEMANAS)                             │
└─────────────────────────────────────────────────────────────┘
```

#### 🧪 @QA (QA Agent) - **Principal**

**Responsabilidades:**
```
1. UNIT TESTS (API)
   ├─ Webhook endpoint tests
   ├─ HMAC validation tests
   ├─ Email dispatch tests
   ├─ Analytics tracking tests
   └─ Error handling tests

2. INTEGRATION TESTS
   ├─ Hotmart webhook → Database
   ├─ Email → SendGrid
   ├─ GA4 → Analytics
   ├─ Facebook → Conversions
   └─ Full flow tests

3. E2E TESTS (Landing Page)
   ├─ Load landing page
   ├─ Scroll depth tracking
   ├─ CTA click tracking
   ├─ GA4 events
   ├─ Facebook Pixel events
   └─ Mobile responsiveness

4. PERFORMANCE TESTS
   ├─ Lighthouse audit
   ├─ Core Web Vitals
   ├─ Webhook latency <500ms
   └─ API response time <200ms
```

**Ferramenta:** Jest, Cypress, Lighthouse
**Tempo:** 3-5 dias
**Deliverable:** Test report + Coverage >80%

---

#### 🔄 @GITHUB-DEVOPS (DevOps Agent) - **Secundário**

**Responsabilidades:**
```
1. CI/CD PIPELINE
   ├─ GitHub Actions setup
   ├─ Run tests on every push
   ├─ Auto-deploy to staging
   ├─ Deploy to production (manual approval)
   └─ Rollback automation

2. TESTING INFRASTRUCTURE
   ├─ Test database (separate from prod)
   ├─ Staging environment
   ├─ Production environment
   └─ Environment variables per stage

3. CODE QUALITY
   ├─ ESLint enforcement
   ├─ Prettier formatting
   ├─ TypeScript checking
   └─ Security scanning (CodeQL)

4. RELEASE MANAGEMENT
   ├─ Version bumping (semver)
   ├─ Changelog automation
   ├─ Release notes
   └─ Tag management
```

**Ferramenta:** GitHub Actions, Act (local testing)
**Tempo:** 2-3 dias
**Deliverable:** Full CI/CD pipeline + automatic deployments

---

#### 🏛️ @ARCHITECT (Você agora) - **Revisão**

**Responsabilidades:**
```
1. CODE REVIEW (Architectural)
   ├─ API patterns consistency
   ├─ Error handling patterns
   ├─ Security patterns
   └─ Performance patterns

2. PERFORMANCE AUDIT
   ├─ Landing page performance
   ├─ Webhook latency
   ├─ Database queries (N+1)
   └─ Asset sizes

3. SECURITY AUDIT
   ├─ HMAC validation
   ├─ Input sanitization
   ├─ Rate limiting
   └─ HTTPS enforcement

4. ARCHITECTURE DECISION LOG (ADL)
   ├─ Document decisions
   ├─ Rationales
   └─ Trade-offs
```

**Tempo:** 1-2 dias
**Deliverable:** Architecture review document

---

### FASE 3: BANCO DE DADOS (1-2 semanas)

```
┌─────────────────────────────────────────────────────────────┐
│            FASE 3: BANCO DE DADOS PRODUÇÃO                   │
│                    (1-2 SEMANAS)                              │
└─────────────────────────────────────────────────────────────┘
```

#### 🗄️ @DATA-ENGINEER - **Principal**

**Responsabilidades:**
```
1. SCHEMA DESIGN
   ├─ Users table
   ├─ Purchases table
   ├─ Webhooks log table
   ├─ Email delivery table
   ├─ Analytics events table
   └─ Relationships + indexes

2. MIGRATION SCRIPTS
   ├─ Create tables
   ├─ Add indices
   ├─ Foreign keys
   ├─ Constraints
   └─ Rollback procedures

3. OPTIMIZATION
   ├─ Index strategy
   ├─ Query optimization
   ├─ Partitioning strategy
   ├─ Archive strategy
   └─ Performance baseline

4. BACKUP & RECOVERY
   ├─ Automated daily backups
   ├─ Point-in-time recovery
   ├─ Failover procedure
   ├─ RTO target: 1 hour
   └─ RPO target: 15 minutes
```

**Ferramenta:** PostgreSQL 15+, Prisma, pg_dump
**Tempo:** 3-5 dias
**Deliverable:** Production database ready + backup strategy

---

#### 🔄 @GITHUB-DEVOPS - **Secundário**

**Responsabilidades:**
```
1. DATABASE INFRASTRUCTURE
   ├─ PostgreSQL hosting (Railway/Render/AWS RDS)
   ├─ Connection pooling (PgBouncer)
   ├─ Backup automation
   ├─ Monitoring setup
   └─ Alerting for slow queries

2. ENVIRONMENT SETUP
   ├─ Dev database
   ├─ Staging database
   ├─ Production database
   ├─ Secrets management
   └─ .env configuration

3. MIGRATION PIPELINE
   ├─ Automated migrations on deploy
   ├─ Rollback capabilities
   ├─ Zero-downtime migrations
   └─ Schema versioning
```

**Tempo:** 2-3 dias
**Deliverable:** Production database infrastructure

---

### FASE 4: DEPLOY & MONITORING (1 semana)

```
┌─────────────────────────────────────────────────────────────┐
│         FASE 4: DEPLOY & MONITORAMENTO 24/7                  │
│                    (1 SEMANA)                                 │
└─────────────────────────────────────────────────────────────┘
```

#### 🚀 @GITHUB-DEVOPS - **Principal**

**Responsabilidades:**
```
1. DEPLOYMENT
   ├─ Docker containerization
   ├─ Kubernetes or Docker Swarm
   ├─ Service discovery
   ├─ Health checks
   ├─ Rolling updates
   ├─ Canary deployments
   └─ Zero-downtime deploys

2. MONITORING INFRASTRUCTURE
   ├─ Prometheus metrics collection
   ├─ Grafana dashboards
   ├─ Alert rules (PagerDuty)
   ├─ Log aggregation (ELK or Loki)
   ├─ Distributed tracing (Jaeger)
   └─ APM (Application Performance Monitoring)

3. ALERTING
   ├─ Error rate >1% → Page on-call
   ├─ Response time >500ms → Alert
   ├─ Webhook failure → Alert
   ├─ Database down → Critical alert
   ├─ Email delivery failures → Alert
   └─ Storage usage >80% → Alert

4. INCIDENT RESPONSE
   ├─ Runbooks for common issues
   ├─ Escalation procedures
   ├─ Communication template
   ├─ Post-mortems
   └─ Blameless culture
```

**Ferramenta:** Docker, Prometheus, Grafana, Sentry
**Tempo:** 3-5 dias
**Deliverable:** 24/7 monitoring + alerting system

---

#### 🏛️ @ARCHITECT - **Revisão**

**Responsabilidades:**
```
1. ARCHITECTURE REVIEW
   ├─ Scaling strategy
   ├─ Failure scenarios
   ├─ Disaster recovery plan
   ├─ Capacity planning
   └─ Cost optimization

2. DOCUMENTATION
   ├─ Architecture diagrams (updated)
   ├─ Operational runbooks
   ├─ Troubleshooting guide
   ├─ Team knowledge base
   └─ Post-launch review
```

**Tempo:** 1-2 dias
**Deliverable:** Architecture documentation + runbooks

---

### FASE 5: OTIMIZAÇÃO & EXPANSÃO (2-3 semanas)

```
┌─────────────────────────────────────────────────────────────┐
│      FASE 5: A/B TESTING + OTIMIZAÇÃO + EXPANSÃO             │
│                 (2-3 SEMANAS)                                 │
└─────────────────────────────────────────────────────────────┘
```

#### 🧬 @DEV - **Principal**

**Responsabilidades:**
```
1. A/B TESTING FRAMEWORK
   ├─ Variant routing system
   ├─ GA4 segment tracking
   ├─ Statistical significance calculator
   ├─ Results dashboard
   └─ Automated reporting

2. PERFORMANCE OPTIMIZATION
   ├─ Landing page optimization
   ├─ Image optimization (WebP)
   ├─ Code splitting (webpack)
   ├─ Lazy loading
   ├─ Service Worker caching
   └─ Lighthouse >95

3. SEO IMPLEMENTATION
   ├─ Meta tags optimization
   ├─ Structured data (JSON-LD)
   ├─ Sitemap + robots.txt
   ├─ Open Graph tags
   ├─ Twitter Card tags
   └─ Schema validation

4. NEW FEATURES
   ├─ Email sequence (Fase 2 of protocol)
   ├─ Upsells/Cross-sells
   ├─ Community integration (Telegram)
   ├─ Affiliate program
   └─ API for partners
```

**Tempo:** 5-7 dias
**Deliverable:** A/B testing infrastructure + 3 test variants

---

#### 📊 @PM - **Secundário**

**Responsabilidades:**
```
1. CAMPAIGN PLANNING
   ├─ Google Ads campaigns
   ├─ Facebook Ads campaigns
   ├─ Budget allocation
   ├─ Target audience definition
   └─ Conversion tracking setup

2. EMAIL MARKETING
   ├─ Email sequence design
   ├─ Welcome series
   ├─ Nurture sequence
   ├─ Re-engagement campaigns
   └─ Automation workflows

3. PRODUCT ROADMAP
   ├─ Fase 2 features
   ├─ Fase 3 features
   ├─ User feedback collection
   ├─ Prioritization matrix
   └─ Release planning

4. ANALYTICS & INSIGHTS
   ├─ A/B test results analysis
   ├─ User behavior analysis
   ├─ Conversion funnel optimization
   ├─ CAC/LTV calculations
   └─ Monthly reports
```

**Tempo:** 3-5 dias
**Deliverable:** Campaign plans + email sequences

---

## 🎯 TIMELINE RECOMENDADO

### SEMANA 1 (29 jan - 4 fev)

**Segunda-Feira (29 jan)**
- ✅ Deploy em produção (@dev)
- ✅ Fazer compra teste (manual)
- ✅ GA4 API Secret setup (manual)

**Terça-Quarta (30-31 jan)**
- 🚀 @QA inicia unit tests
- 🚀 @github-devops inicia CI/CD pipeline

**Quinta-Sexta (1-2 fev)**
- 📊 Revisar testes + coverage
- 📊 @architect code review
- 📊 Merge para main branch

### SEMANA 2 (5-11 fev)

**Segunda-Terça (5-6 fev)**
- 🗄️ @data-engineer começa schema design
- 🚀 @github-devops database infrastructure

**Quarta-Quinta (7-8 fev)**
- 📝 Migrations + indices
- 📝 Data migration (se necessário)

**Sexta (9 fev)**
- 🎉 Database produção pronto
- 🎉 First production database connection

### SEMANA 3 (12-18 fev)

**Segunda-Terça (12-13 fev)**
- 📊 @github-devops monitoring setup
- 📊 Prometheus + Grafana + Sentry

**Quarta-Quinta (14-15 fev)**
- 📊 Alerting rules configured
- 📊 Runbooks created

**Sexta (16 fev)**
- 🎉 24/7 monitoring operational
- 🎉 Team training on alerts

### SEMANA 4 (19-25 fev)

**Segunda-Terça (19-20 fev)**
- 🧬 @dev A/B testing framework
- 🧬 First variant ready

**Quarta-Quinta (21-22 fev)**
- 📊 @pm campaign planning
- 📊 Google Ads + Facebook Ads

**Sexta (23 fev)**
- 🎉 A/B testing live
- 🎉 First campaign running

---

## 📋 HANDOFF DOCUMENTS

### Para @QA (FASE 2)
Ler:
- [ ] `FASE-1-COMPLETA-RESUMO.md`
- [ ] `api/webhook-hotmart.js` (código)
- [ ] `landing-page/grand-slam/index.html` (código)

Criar:
- [ ] Unit test suite
- [ ] Integration test suite
- [ ] E2E test suite
- [ ] Performance baseline

### Para @DATA-ENGINEER (FASE 3)
Ler:
- [ ] `ARQUITETURA-GERAL-ANALISE.md` (Database gap analysis)
- [ ] `prisma/schema.prisma` (current schema)

Criar:
- [ ] Production schema
- [ ] Migration scripts
- [ ] Index strategy
- [ ] Backup procedure

### Para @GITHUB-DEVOPS (FASE 4)
Ler:
- [ ] `DEPLOYMENT-CHECKLIST-RAPIDO.md`
- [ ] `nginx-reset-primal.conf`

Criar:
- [ ] GitHub Actions workflows
- [ ] Docker images
- [ ] Monitoring dashboards
- [ ] Alert rules

### Para @DEV (FASE 5)
Ler:
- [ ] `ARQUITETURA-GERAL-ANALISE.md`
- [ ] `landing-page/grand-slam/index.html` (performance baseline)

Criar:
- [ ] A/B testing framework
- [ ] Feature variants
- [ ] SEO enhancements
- [ ] New features

---

## ✅ MÉTRICAS DE SUCESSO

### FASE 2 (Testes)
- [ ] Test coverage >80%
- [ ] All E2E tests passing
- [ ] CI/CD pipeline automated
- [ ] Zero manual deploy steps

### FASE 3 (Database)
- [ ] Production DB live
- [ ] Zero data loss migrations
- [ ] Backup/restore tested
- [ ] Performance baseline met

### FASE 4 (Monitoring)
- [ ] 99.9% uptime
- [ ] <500ms webhook latency
- [ ] Error rate <0.5%
- [ ] All alerts working

### FASE 5 (Otimização)
- [ ] A/B test results significant
- [ ] Conversion rate improved
- [ ] 3+ campaigns running
- [ ] Monthly revenue >R$1,000

---

## 📞 COMUNICAÇÃO ENTRE AGENTES

### Padrão de Handoff
```
@architect → @qa: "FASE 2 ready, here are test requirements"
@qa → @github-devops: "Tests passing, ready for CI/CD"
@github-devops → @data-engineer: "Pipeline ready, database infrastructure needed"
@data-engineer → @github-devops: "Schema ready, need deployment automation"
@github-devops → @architect: "Monitoring live, architecture review needed"
@architect → @dev: "Architecture approved, optimization can begin"
@dev → @pm: "Features ready, campaigns can start"
@pm → @architect: "Campaign results, architecture optimization suggested"
```

### Bloqueadores Conhecidos
- FASE 2 bloqueada por: GA4 API Secret (setup manual primeiro)
- FASE 3 bloqueada por: FASE 2 testes passando
- FASE 4 bloqueada por: FASE 3 database pronto
- FASE 5 bloqueada por: FASE 4 monitoring operacional

---

## 🎬 PRÓXIMO PASSO IMEDIATO

**HOJE (28 jan):**
1. [ ] Designar @dev para deploy em produção
2. [ ] Você gera GA4 API Secret
3. [ ] Fazer compra teste validar tudo

**AMANHÃ (29 jan):**
1. [ ] Designar @qa para começar testes
2. [ ] Designar @github-devops para CI/CD
3. [ ] @architect faz code review

**PRÓXIMA SEMANA (5 fev):**
1. [ ] @qa testes completados
2. [ ] @github-devops pipeline pronto
3. [ ] Começar FASE 3 (database)

---

**Designação completa por:** Aria (System Architect)
**Data:** 28 janeiro 2026
**Status:** Pronto para PRÓXIMAS FASES ✅
