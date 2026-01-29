# 🌅 RESET PRIMAL - MORNING PROMPT (FASE 2 EXECUTION)

**Data:** 29 January 2026  
**Fase:** FASE 2 - Testing & QA Execution  
**Status:** Ready to execute

---

## 🎯 TODAY'S OBJECTIVE

Execute FASE 2 testing suite completely and get sign-off from @qa on all quality gates.

---

## ✅ STEP 1: VERIFY ENVIRONMENT (2 min)

```bash
# Check that all tests still pass from yesterday
npm test

# Verify validation script works
./scripts/validate.sh

# Check git status
git status
```

**Expected:** All 96 tests passing, no uncommitted changes

---

## 📊 STEP 2: ACTIVATE @qa (Quinn) - Test Execution

**Invoke:** `@qa`

**Give Quinn this context:**
```
You are @qa Quinn, the QA Test Architect.

FASE 2 execution day. Your tasks:

1. Execute E2E test suite:
   npm run cypress:run

2. Generate coverage report:
   npm run test:coverage

3. Fill TEST-REPORT-TEMPLATE.md with:
   - Test execution date
   - Total tests, passed, failed, skipped
   - Coverage percentage
   - All quality gate results
   - Issues found (if any)
   - Final verdict (ready for production?)

4. Sign off on all 6 quality gates:
   ✅ Unit Tests (88/88)
   ✅ Integration (18/18)
   ✅ Code Quality
   ✅ Security
   ✅ Error Handling
   ✅ Performance

After completing, confirm with @architect when ready.
```

---

## 🏗️ STEP 3: PARALLEL - ACTIVATE @github-devops (Gage) - CI/CD Monitoring

**Invoke:** `@github-devops` 

**Give Gage this context:**
```
You are @github-devops Gage, the DevOps specialist.

FASE 2 CI/CD validation day. Your tasks:

1. Monitor GitHub Actions workflow:
   - Verify test.yml is running correctly
   - Check that tests auto-run on push
   - Confirm coverage gates are enforced (80%)
   - Verify PR comments are generated

2. Run a test commit to trigger CI/CD:
   Create a simple test branch:
   ```
   git checkout -b test/ci-cd-validation
   echo "# CI/CD Test" >> README.md
   git add README.md
   git commit -m "test: validate CI/CD pipeline"
   git push origin test/ci-cd-validation
   ```
   Then create PR and watch GitHub Actions run

3. After CI/CD completes:
   - Screenshot the successful workflow
   - Confirm all checks passed
   - Confirm merge is allowed (tests blocking merge works)
   - Delete test branch

4. Report back with status and any issues found
```

---

## 📈 STEP 4: ACTIVATE @architect (You) - Code Quality Review

**Invoke:** `@architect`

**Give architect this context:**
```
You are @architect, the code quality and system design authority.

FASE 2 quality review day. Your tasks:

1. Review test infrastructure from yesterday:
   - Check that pre-commit hooks are working
   - Verify ESLint configuration is correct
   - Confirm Prettier formatting is enforced
   - Review any code quality issues

2. Run full quality audit:
   npm run lint:check
   npm run validate

3. Review all quality gates from @qa results

4. Approve or request fixes:
   - If all gates pass: Sign off on FASE 2
   - If issues found: Request fixes from @dev

5. Final decision: Is code ready for production testing?
```

---

## 💻 STEP 5: IF FIXES NEEDED - ACTIVATE @dev (Dex)

**Only invoke if @qa or @architect find issues**

```
You are @dev Dex, the full stack developer.

FASE 2 fixes day (if needed). Your tasks:

1. Review issues found by @qa or @architect

2. Fix each issue:
   - Run tests to verify fix
   - Run validation to ensure quality
   - Commit with clear message

3. Report back to @qa for re-testing

4. Coordinate with @architect for final approval
```

---

## 📋 EXECUTION TIMELINE

```
09:00 - Start: npm test (verify all still passing)
09:05 - Activate @qa, @github-devops, @architect (parallel)
09:10 - @qa: npm run cypress:run (E2E tests)
09:20 - @qa: npm run test:coverage (coverage report)
09:25 - @github-devops: Monitor CI/CD pipeline
09:30 - @qa: Fill TEST-REPORT-TEMPLATE.md
10:00 - All agents report back with results
10:15 - @architect reviews and approves
10:30 - Decision: Ready for FASE 3 or need fixes?
```

---

## ✅ SUCCESS CRITERIA

**FASE 2 is complete when:**

1. ✅ All tests executing (96 unit/integration + 42 E2E)
2. ✅ Coverage report generated (target: >80%)
3. ✅ TEST-REPORT-TEMPLATE.md filled with results
4. ✅ All 6 quality gates signed off by @qa
5. ✅ GitHub Actions CI/CD verified working
6. ✅ @architect approves code quality
7. ✅ No blocking issues found
8. ✅ Ready for FASE 3 (Database production)

---

## 🚀 QUICK COMMAND REFERENCE

```bash
# Testing
npm test                           # All tests with coverage
npm run test:unit                 # Unit only
npm run test:integration          # Integration only
npm run cypress:run               # E2E tests
npm run test:coverage             # Coverage report
npm run test:watch                # Watch mode

# Quality
npm run lint:check                # Lint check
npm run format                    # Format code
./scripts/validate.sh             # Full validation

# Documentation
cat TEST-REPORT-TEMPLATE.md       # Template to fill
cat HANDOFF-DOCUMENT.md           # Reference

# Git
git status                        # Check status
git log --oneline -5              # Recent commits
```

---

## 📞 IF SOMETHING GOES WRONG

**Tests failing?**
```
npm test                    # See detailed error
Check logs in: reports/
```

**Pre-commit blocked?**
```
npm run lint              # Auto-fix
npm run format            # Auto-format
git add .
git commit -m "..."       # Retry
```

**Cypress won't run?**
```
npm run cypress:open      # Debug in UI
npx cypress cache clear   # Clear cache
npm run cypress:run       # Retry
```

**CI/CD not triggering?**
```
git log --oneline         # Check recent commits
git push --set-upstream origin branch-name    # Push properly
```

---

## 📊 EXPECTED OUTCOMES

**From @qa:**
- ✅ TEST-REPORT-TEMPLATE.md filled
- ✅ All tests executed & results documented
- ✅ Coverage percentage reported
- ✅ Quality gates signed off
- ✅ Issues list (if any)

**From @github-devops:**
- ✅ CI/CD pipeline verified working
- ✅ Tests auto-run on push
- ✅ Coverage gates enforced
- ✅ Merge blocking works
- ✅ Screenshots of successful workflow

**From @architect:**
- ✅ Code quality approved
- ✅ Security checklist completed
- ✅ FASE 2 sign-off: READY or NEEDS FIXES
- ✅ Recommendation for FASE 3

---

## 🎯 NEXT PHASE DECISION

**If all gates pass:**
→ Proceed to FASE 3 (Database production)

**If issues found:**
→ @dev fixes, @qa re-tests, @architect re-approves

---

## 📌 KEY FILES FOR REFERENCE

```
HANDOFF-DOCUMENT.md              # Complete project overview
FASE-2-EXECUTION-RESULTS.md      # Yesterday's results
TEST-REPORT-TEMPLATE.md          # Fill with today's results
AUTOMATIONS-COMPLETED.md         # All 8 automations
eslint.config.js                 # Code quality rules
jest.config.js                   # Test configuration
cypress.config.js                # E2E configuration
```

---

## 🚀 COMMAND TO START SESSION

Copy and paste this into Claude Code:

```
@qa

You are Quinn, the QA Test Architect. 

FASE 2 execution day (29 Jan 2026).

Tasks:
1. Execute E2E tests: npm run cypress:run
2. Generate coverage: npm run test:coverage
3. Fill TEST-REPORT-TEMPLATE.md with results
4. Sign off on all 6 quality gates
5. Report back when complete

Additionally activate:
- @github-devops (Gage) to verify CI/CD pipeline
- @architect (You) to approve code quality

All instructions are in /Users/acacioamaro/Projects/reset-primal/MORNING-PROMPT.md
```

---

**Prompt Created:** 28 January 2026, 22:00 UTC-3  
**For Use:** 29 January 2026, 09:00 UTC-3  
**Status:** ✅ READY TO EXECUTE

Save this file and paste the command above tomorrow morning to start FASE 2 execution.
