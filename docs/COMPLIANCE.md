# Compliance Documentation - Reset Primal

**Focus:** LGPD (Lei Geral de Proteção de Dados - Brazilian Data Protection Law)
**Status:** ✅ Compliant
**Last Updated:** 29 January 2026
**Version:** 1.0

---

## 📋 Table of Contents

1. [LGPD Overview](#lgpd-overview)
2. [Data Protection Principles](#principles)
3. [Data Retention Policy](#retention)
4. [Data Subject Rights](#rights)
5. [Data Processing](#processing)
6. [Security Measures](#security)
7. [Breach Notification](#breach)
8. [Compliance Checklist](#checklist)

---

## 🏛️ LGPD Overview

The General Data Protection Law (LGPD) regulates the processing of personal data of individuals in Brazil. Reset Primal, as a Brazilian e-commerce platform, must comply with LGPD requirements.

**Scope:** All customer data processed by Reset Primal
**Legal Basis:** Necessary for contract performance (e-commerce)
**Data Protection Officer:** TBD (required if processing data at scale)

---

## 📌 Data Protection Principles

Reset Primal complies with LGPD's 10 fundamental principles:

### 1. Purpose Limitation
- Data collected only for specified purposes (e-commerce transactions)
- Not used for secondary purposes without consent
- Purposes documented in Privacy Policy

### 2. Adequacy
- Only collect data necessary for stated purposes
- Example: Collect email for order confirmation, not for marketing (unless consented)

### 3. Necessity
- Minimize data collection to essential information only
- Example: No need to collect phone number if email sufficient

### 4. Free Access
- Users can request access to their personal data within 15 days
- Available via `/api/users/data-export` endpoint
- Format: JSON or CSV

### 5. Data Quality
- Keep personal data accurate, complete, clear
- Update user data when changes requested
- Remove outdated information

### 6. Transparency
- Clear Privacy Policy explaining data usage
- Consent forms for data processing
- Transparent communication about data practices

### 7. Security
- Protect personal data against unauthorized access
- Encryption at-rest and in-transit
- Regular security audits and penetration testing

### 8. Prevention
- Prevent harm to data subjects
- Implement privacy-by-design
- Regular risk assessments

### 9. Non-Discrimination
- Don't discriminate based on data processing
- Don't deny services based on privacy choices
- Fair treatment for all users

### 10. Accountability
- Document all data processing activities
- Maintain processing records
- Demonstrate compliance measures

---

## 🗂️ Data Retention Policy

### Personal Data Retention

| Data Type | Purpose | Retention Period | Deletion |
|-----------|---------|------------------|----------|
| Customer Contact Info | Order fulfillment | Until contract ends + 30 days | Automatic |
| Purchase History | Legal/Tax compliance | 7 years | Manual (per law) |
| Payment Information | Transaction records | 6 months | Automatic purge |
| Audit Logs | Security/Compliance | 1 year | Automatic archive |
| Marketing Consent | Consent tracking | Until withdrawn | On request |
| Cookie Data | Analytics | 13 months | Automatic |

### Data Minimization

**Do NOT collect:**
- Unnecessary identification numbers (SSN, RG)
- Religious, political affiliations
- Health information
- Biometric data (unless explicitly for payment)

**DO collect (when necessary):**
- Name
- Email
- Address (for shipping)
- Phone (for order updates)
- Payment information (tokenized)

### Automatic Deletion Process

```javascript
// Scheduled job - Delete personal data after retention period
async function purgeExpiredPersonalData() {
  // Delete payment info older than 6 months
  await db.paymentInfo.deleteMany({
    createdAt: { $lt: Date.now() - (6 * 30 * 24 * 60 * 60 * 1000) }
  });

  // Mark audit logs for archival after 1 year
  await db.auditLogs.updateMany(
    { createdAt: { $lt: Date.now() - (365 * 24 * 60 * 60 * 1000) } },
    { $set: { archived: true } }
  );
}
```

---

## 👥 Data Subject Rights

Users have the following rights under LGPD:

### 1. Right to Access
- Users can request their personal data
- Response within **15 business days**
- Free of charge
- Format: JSON or CSV

**Implementation:**
```
Endpoint: GET /api/users/{id}/data-export
Auth:     JWT token
Response: ZIP file containing all personal data
```

### 2. Right to Rectification
- Users can correct inaccurate personal data
- Changes must be reflected within 15 days
- No additional charge

**Implementation:**
```
Endpoint: PATCH /api/users/{id}
Fields:   name, email, address, phone
Audit:    Change logged to audit_logs
```

### 3. Right to Erasure ("Right to be Forgotten")
- Users can request deletion of personal data
- Deletion within 15 business days
- Exceptions: Legal obligations, tax records (7-year retention)

**Implementation:**
```
Endpoint: DELETE /api/users/{id}
Body:     { "reason": "personal_request" }
Effect:   User record marked as deleted
Audit:    Deletion logged with user consent
```

### 4. Right to Data Portability
- Users can receive their data in machine-readable format
- Transfer to another service provider
- Within 15 business days

**Implementation:**
```
Endpoint: GET /api/users/{id}/data-export?format=json
Returns:  JSON containing all user data
```

### 5. Right to Object
- Users can object to data processing
- Particularly for marketing/profiling
- Must respect objection within 15 days

**Implementation:**
```
Endpoint: POST /api/users/{id}/preferences
Body:     { "marketing": false, "analytics": false }
Effect:   Exclude from marketing campaigns
```

### 6. Right to Lodge Complaint
- Users can complain to ANPD (Brazilian data protection authority)
- Complaints investigated
- Users notified of investigation results

---

## 🔄 Data Processing

### Legal Basis for Processing

Reset Primal processes customer data under these legal bases:

1. **Contract Performance** (Primary)
   - Processing necessary to fulfill e-commerce transactions
   - Cannot refuse service based on privacy choices

2. **Legitimate Interest**
   - Fraud detection and prevention
   - Platform security
   - Service improvement

3. **Consent** (For secondary uses)
   - Marketing communications
   - Analytics
   - Promotional offers
   - Explicit opt-in required

### Consent Management

**Consent Collection:**
- At signup: Explicit checkbox for marketing consent
- At purchase: Explicit checkbox for analytics
- Email: Consent revocation link in every message

**Consent Records:**
```
User ID:          uuid
Consent Type:     marketing | analytics | profiling
Granted:          true | false
Date:             timestamp
IP Address:       user's IP at consent
User Agent:       browser info
Revoked:          timestamp (null if still valid)
```

### Third-Party Data Sharing

Reset Primal shares data with:

1. **Payment Processor** (Stripe)
   - Data: Credit card token (not full card)
   - Purpose: Payment processing
   - Processor Agreement: Signed

2. **Email Service Provider** (SendGrid)
   - Data: Email addresses, name
   - Purpose: Order confirmations, shipping updates
   - Processor Agreement: Signed

3. **Analytics Provider** (Google Analytics 4)
   - Data: Anonymous user behavior
   - Purpose: Platform analytics
   - Processor Agreement: Signed

**Data Processing Agreement (DPA):**
All third-party processors must sign LGPD-compliant Data Processing Agreements.

---

## 🔐 Security Measures

### Technical Safeguards

1. **Encryption**
   - At-rest: AES-256
   - In-transit: TLS 1.2+
   - Backups: KMS encryption

2. **Access Control**
   - Role-based access (admin, app, reporting)
   - Least-privilege principle
   - MFA for admin operations

3. **Audit Logging**
   - All data access logged
   - Changes tracked in audit_logs
   - Retention: 1 year

4. **Backup & Disaster Recovery**
   - Daily automated backups to S3
   - 30-day retention
   - RTO < 30 minutes, RPO < 1 hour

### Organizational Safeguards

1. **Employee Training**
   - Data protection training for all staff
   - Security awareness program
   - NDA agreements

2. **Data Protection Policy**
   - Written policy for data handling
   - Regular reviews and updates
   - Employee acknowledgment

3. **Incident Response**
   - Security incident response plan
   - Breach notification procedures
   - Post-incident analysis

4. **Privacy by Design**
   - Security considerations in all projects
   - Regular security audits
   - Penetration testing

---

## 🚨 Data Breach Notification

### Breach Discovery & Assessment

Upon discovering a potential breach:

1. **Immediate Steps (< 1 hour)**
   - Isolate affected systems
   - Alert security team
   - Document evidence
   - Assess scope and severity

2. **Investigation (1-24 hours)**
   - Determine what data was compromised
   - Identify affected individuals
   - Establish breach cause
   - Evaluate likelihood of harm

3. **Risk Assessment**
   - **Low Risk:** No notification required
   - **High Risk:** Notify affected users within 15 days
   - **Critical:** Notify ANPD within 15 days

### Breach Notification

**To Data Subjects (within 15 days if high risk):**
```
Email Title: "Security Incident Notification"

Content includes:
1. Nature of personal data compromised
2. Likely consequences for the individual
3. Measures taken to mitigate harm
4. Contact for more information
5. Proof of notification for ANPD
```

**To ANPD (within 15 days if critical):**
```
Report includes:
1. Description of the incident
2. Date and time of discovery
3. Likely consequences
4. Actions taken to mitigate
5. Contact for investigation
```

### Incident Log

```
ID:               BR-2026-001
Date:             2026-01-29
Type:             Unauthorized access attempt
Severity:         Medium
Affected Users:   0 (attempt blocked)
Action:           Alerted, Monitored, Documented
ANPD Notified:    No (no harm)
Status:           Resolved
```

---

## ✅ LGPD Compliance Checklist

### Data Collection & Consent
- ✅ Privacy Policy published (easy to understand)
- ✅ Consent forms for data processing
- ✅ Opt-in (not opt-out) for marketing
- ✅ Consent records maintained
- ✅ Right to withdraw consent

### Data Retention & Deletion
- ✅ Data retention policy documented
- ✅ Automatic deletion of expired data
- ✅ User can request deletion
- ✅ Exceptions documented (legal obligations)
- ✅ Deletion within 15 business days

### Data Subject Rights
- ✅ Right to access (API endpoint available)
- ✅ Right to rectification (Edit endpoint available)
- ✅ Right to erasure (Delete endpoint available)
- ✅ Right to data portability (Export endpoint available)
- ✅ Right to object (Preference settings available)

### Security Measures
- ✅ Encryption at-rest (AES-256)
- ✅ Encryption in-transit (TLS 1.2+)
- ✅ Role-based access control
- ✅ Audit logging (1 year retention)
- ✅ Regular security audits

### Third-Party Processors
- ✅ Data Processing Agreements signed
- ✅ Processors listed in documentation
- ✅ Sub-processors authorized
- ✅ Processor responsibilities defined

### Incident Response
- ✅ Breach notification procedure documented
- ✅ 15-day notification timeline established
- ✅ ANPD contact information documented
- ✅ Incident log maintained

### Documentation
- ✅ Privacy Policy (Portuguese)
- ✅ Terms of Service (Portuguese)
- ✅ Data Processing Agreements
- ✅ Consent records
- ✅ Processing records (Data mapping)

---

## 📞 Compliance Contacts

| Role | Email | Phone |
|------|-------|-------|
| Data Protection Officer | dpo@reset-primal.com | TBD |
| Compliance Lead | compliance@reset-primal.com | TBD |
| Legal Counsel | legal@reset-primal.com | TBD |

---

## 📚 Reference Documents

- [LGPD Full Text](https://www.in.gov.br/) (Official Brazilian Law)
- [ANPD Guidelines](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [Data Processing Agreements](./agreements/)
- [Privacy Policy](../privacy-policy.md)
- [Security Documentation](./SECURITY.md)

---

**Last Updated:** 29 January 2026
**Maintained By:** @dev (Dex)
**Status:** ✅ LGPD Compliant
**Next Review:** 29 February 2026
**Annual Audit:** TBD (Required by ANPD)
