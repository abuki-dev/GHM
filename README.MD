# 🏋️ Gym & Membership Management System (GMMS)

A robust, relational database-backed backend architecture and access control engine for fitness centers. This system manages multi-tier memberships (`REGULAR`, `VIP`, `VVIP`), capacity-based shift schedules, trainer allocations, automated turnstile QR scanning, and workout session logging.

---

## 📌 Table of Contents

- [System Architecture & Roles](#-system-architecture--roles)
- [Membership Tiers & Business Rules](#-membership-tiers--business-rules)
- [Entity-Relationship & Data Dictionary](#-entity-relationship--data-dictionary)
- [Cardinals & Relationships](#-cardinals--relationships)
- [Access Control & Turnstile Scan Flow](#-access-control--turnstile-scan-flow)
- [Shift Schedule & Capacity Logic](#-shift-schedule--capacity-logic)
- [Database Schema (PostgreSQL DDL)](#-database-schema-postgresql-ddl)

---

## 👥 System Architecture & Roles

The system is governed by a **Role-Based Access Control (RBAC)** model unified under a central identity store:

| Role          | Core Responsibilities                                                                                                                      |
| :------------ | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **`ADMIN`**   | Full CRUD on training disciplines, membership plans, shift schedules, system accounts, and operational overrides.                          |
| **`STAFF`**   | Verifies offline/mobile payment transactions, creates on-site member accounts, issues announcements.                                       |
| **`TRAINER`** | Views assigned group and 1-on-1 shifts; updates workout notes, calories burned, and completion status for client sessions.                 |
| **`MEMBER`**  | Registers, selects subscription plans, submits transaction references, receives encrypted access QR tokens, and submits facility feedback. |

---

## 🎖️ Membership Tiers & Business Rules

1. **`REGULAR` (General Gym Access)**
   - Open floor gym access during operational hours.
   - Access is verified at the turnstile gate; **no** coach-led training sessions are generated.
2. **`VIP` (Group Coached Sessions)**
   - Group training cohort capped strictly at **15 members per shift**.
   - 3 Days/Week schedule (`MON-WED-FRI` or `TUE-THU-SAT`).
   - Automated generation of a `session` record upon turnstile scan for trainer review and workout tracking.
3. **`VVIP` (Dedicated 1-on-1 Personal Training)**
   - Dedicated 1 trainer per member.
   - Dedicated time slots across operational periods (`DAWN`, `MORNING`, `NOON`, `NIGHT`).
   - Dynamic tracking of calories burned, intensity, and personal notes.

---

## 🗄️ Entity-Relationship & Data Dictionary

```text
               +-------------------+
               |       users       | (Auth & Identity)
               +---------+---------+
                         |
        +----------------+----------------+
        | 1:1                             | 1:1
        v                                 v
 +--------------+                  +--------------+
 |   members    |                  |   trainers   |
 +-------+------+                  +-------+------+
         |                                 |
         | 1:N                             | 1:N
         v                                 v
+------------------------+          +--------------+
| subscription_purchases | -------> |    shifts    | (Capacities & Times)
+-----------+------------+          +-------+------+
            |                               |
            | 1:N                           | 1:N
            v                               v
     +--------------+                +--------------+
     |  check_ins   |                |   sessions   | (VIP/VVIP Logs)
     +--------------+                +--------------+
```
