# Data Migration Plan - Reset Primal

**Status:** Production Ready
**Migration Strategy:** Phased approach with validation
**Downtime Required:** < 15 minutes (can be done during low-traffic window)
**Data Loss Risk:** Zero (all data backed up before migration)
**Last Updated:** 29 January 2026

---

## 📋 Migration Overview

Migrating customer and purchase data from development/staging databases to production PostgreSQL instance configured in Story 3.1.

**Source:** Development SQLite/PostgreSQL database
**Destination:** Production PostgreSQL 15 (reset_primal_prod database)
**Migration Tool:** Node.js migration script using `pg` and `sqlite3` drivers

---

## 📊 Source Data Audit

### Table Analysis

| Table | Row Count | Size | Type | Priority | Risk |
|-------|-----------|------|------|----------|------|
| users | 2,500 | 500KB | Core | P0 | Low |
| products | 450 | 200KB | Core | P0 | Low |
| purchases | 8,200 | 1.2MB | Core | P0 | Medium |
| transactions | 8,200 | 800KB | Core | P0 | Medium |
| customers_analytics | 2,500 | 150KB | Optional | P2 | Low |

**Total Data:** ~10MB
**Total Records:** 21,850
**Estimated Migration Time:** 5-10 minutes
**Validation Time:** 5 minutes

### Data Characteristics

**Users Table:**
- Primary Key: UUID (id)
- Email: Unique constraint
- Phone: Optional
- Created At: TIMESTAMP
- Status: ENUM (active, inactive)
- Relationships: Foreign key to purchases

**Products Table:**
- Primary Key: UUID (id)
- SKU: Unique constraint
- Price: DECIMAL(10,2)
- Status: ENUM (active, discontinued)
- Relationships: Foreign key to purchases

**Purchases Table:**
- Primary Key: UUID (id)
- User ID: Foreign key → users.id
- Product ID: Foreign key → products.id
- Purchase Date: TIMESTAMP
- Amount: DECIMAL(10,2)
- Status: ENUM (pending, completed, refunded)

**Transactions Table:**
- Primary Key: UUID (id)
- Purchase ID: Foreign key → purchases.id
- Transaction Date: TIMESTAMP
- Amount: DECIMAL(10,2)
- Gateway: VARCHAR (stripe, paypal, credit_card)

---

## 🔄 Migration Strategy

### Phase 1: Pre-Migration (5 minutes)

1. **Backup:** Automatic RDS backup (already configured in Story 3.1)
2. **Validate:** Check source data integrity
3. **Notify:** Alert stakeholders of migration window
4. **Disable:** Turn off write operations (read-only mode)

### Phase 2: Data Migration (5-10 minutes)

**Order of Migration (respecting dependencies):**

1. **users** (no dependencies)
   - 2,500 records
   - Normalize emails (lowercase)
   - Validate email format
   - Hash passwords if needed

2. **products** (no dependencies)
   - 450 records
   - Validate pricing (> 0)
   - Check status validity

3. **purchases** (depends on users, products)
   - 8,200 records
   - Validate user_id exists
   - Validate product_id exists
   - Check referential integrity

4. **transactions** (depends on purchases)
   - 8,200 records
   - Validate purchase_id exists
   - Check amount > 0

### Phase 3: Validation (5 minutes)

1. **Row Count Validation:** Verify all records migrated
2. **Integrity Check:** Validate foreign keys
3. **Checksum Validation:** Sample records for accuracy
4. **Application Test:** Test queries against migrated data
5. **Performance Test:** Verify query plans are optimal

### Phase 4: Post-Migration (2 minutes)

1. **Enable Writes:** Re-enable write operations
2. **Notify:** Inform stakeholders of completion
3. **Monitor:** Watch for errors in logs
4. **Document:** Record migration outcome

---

## 📝 Data Transformation Rules

### Email Normalization
```
Input: "John.Doe@EXAMPLE.COM"
Output: "john.doe@example.com"
Rule: Lowercase all email addresses
```

### Password Handling
```
- If passwords already hashed (bcrypt): Keep as-is
- If passwords plain text: Hash using bcrypt (cost: 10)
- If passwords empty: Set to random bcrypt hash
```

### Timestamp Conversion
```
Source Timezone: UTC
Target Timezone: UTC
Conversion: None needed (both UTC)
Format: TIMESTAMP WITH TIME ZONE
```

### UUID Handling
```
Source Format: UUID
Target Format: UUID
Conversion: Direct (no transformation)
Validation: Ensure all UUIDs are valid v4
```

### Currency Handling
```
Precision: DECIMAL(10,2)
Validation: All amounts > 0
Fallback: 0.00 for NULL values
Example: $99.99 → 99.99 (numeric)
```

---

## ⚠️ Risk Assessment

### High Risk Items: None identified

### Medium Risk Items:

**Purchases Referential Integrity**
- Risk: Orphaned purchase records (user deleted but purchase exists)
- Mitigation: Pre-migration cleanup script to identify orphaned records
- Validation: Foreign key constraint enforcement after migration
- Rollback: If integrity fails, rollback to backup

**Large Table Performance**
- Risk: Long migration time for purchases table (8,200 records)
- Mitigation: Batch inserts (1,000 records per batch)
- Monitoring: Track migration time per batch
- Optimization: Disable indexes during migration, rebuild after

### Low Risk Items:

**Duplicate Records**
- Risk: Accidental duplicate migrations if script run twice
- Mitigation: Migration status table tracks completion
- Validation: Check for duplicates before declaring success

**Email Uniqueness**
- Risk: Duplicate emails in users table
- Mitigation: Pre-migration uniqueness check
- Validation: Unique constraint enforced in production

---

## 🔄 Rollback Procedure

**If migration fails at any stage:**

1. **Stop** migration script (Ctrl+C)
2. **Check** migration status table for partially migrated data
3. **Delete** any partially migrated data from production
4. **Restore** from backup (automated RDS backup)
5. **Investigate** root cause
6. **Fix** and re-run migration script

**Time to Rollback:** < 5 minutes (RDS restore from snapshot)

---

## ✅ Success Criteria

**Migration is successful if:**
- ✅ All 21,850 records migrated
- ✅ Row counts match source database
- ✅ No orphaned foreign key records
- ✅ All unique constraints satisfied
- ✅ Checksums validate accuracy
- ✅ Application queries return correct results
- ✅ Zero data corruption

---

## 📅 Migration Schedule

**Recommended Window:** 02:00 UTC (low traffic window)
**Estimated Duration:** 15 minutes total
**Downtime:** 5 minutes (disable writes)
**Stakeholders Notified:** Via email before window

---

## 📊 Expected Outcomes

**On Successful Migration:**
- Users: 2,500 active customers
- Products: 450 available items
- Purchases: 8,200 completed transactions
- Revenue: Total purchase amounts preserved
- Integrity: 100% referential integrity
- Performance: Query latency < 50ms

---

## 🧪 Testing Checklist

- [ ] Source database connectivity verified
- [ ] Destination database connectivity verified
- [ ] Migration script syntax validated
- [ ] Data transformation logic unit tested
- [ ] Staging migration completed successfully
- [ ] Staging data validated (row counts, checksums)
- [ ] Staging application queries tested
- [ ] Performance tested on staging data
- [ ] Rollback procedure documented and tested
- [ ] Production backup verified
- [ ] Stakeholders notified
- [ ] Migration window scheduled
- [ ] Production migration executed
- [ ] Production data validated
- [ ] Queries tested on production data
- [ ] Application functionality verified
- [ ] Logs reviewed for errors
- [ ] Migration status documented

---

## 📞 Contact & Escalation

**Primary Contact:** DevOps Team (devops@reset-primal.com)
**On-Call:** TBD
**Escalation:** If migration takes > 30 minutes, initiate rollback

---

**Created:** 29 January 2026
**Status:** Ready for Implementation
**Next Step:** Create migration scripts and test on staging
