# 📖 ScanMitra Technical Documentation

This document provides an in-depth look into the architecture, logic, and internal workflows of the ScanMitra platform.

---

## 🏗️ Architecture Overview

ScanMitra follows a **Hybrid Server-Client Architecture**:
1.  **Next.js App Router**: Handles the UI, SEO, and standard API requests.
2.  **Custom Node Server (`server.ts`)**: Wraps the Next.js handler to provide a persistent context for **Socket.io**.
3.  **Stateless API Design**: All queue states are derived from the database, ensuring that server restarts do not cause data loss.

---

## 🔄 Real-time Engine (Socket.io)

Real-time communication is organized into **Room-based Events**:

| Room Type | Room ID | Description |
| :--- | :--- | :--- |
| **Center Room** | `center:{centerId}` | Used for broadcasting queue updates and delay alerts to all patients in a center. |
| **User Room** | `user:{userId}` | Used for private notifications, such as "Missed Slot" alerts or personal ETA changes. |

### Core Events
- `queue_update`: Triggered whenever a patient moves in the queue.
- `queue_delay`: Triggered by centers to report operational delays.
- `slot_updated`: Triggered when online or walk-in capacity changes.
- `slot_missed`: Triggered by BullMQ when a patient fails to check in.

---

## 📅 Queue Logic & Slot System

### 80/20 Reservation Rule
Implemented in `lib/slots.ts`, this system splits daily capacity:
- **80% Online**: Floor-rounded capacity for web/app bookings.
- **20% Walk-in**: Ceil-rounded capacity for on-site patients.
- **Overflow**: Walk-ins can take online slots if the walk-in quota is full, but online bookings are strictly capped to ensure availability for on-site patients.

### State Machine
A booking moves through the following statuses:
1.  `PENDING`: Booking created, waiting for today's queue.
2.  `CONFIRMED`: Patient checked in or confirmed by staff.
3.  `IN_QUEUE`: Patient assigned a queue number and tracking is active.
4.  `IN_PROGRESS`: Patient is currently being served by a radiologist.
5.  `DONE`: Workflow completed.
6.  `MISSED`: Patient failed to appear within 30 minutes of their slot.

---

## ⏰ Background Jobs (BullMQ)

Located in `lib/scheduler.ts`, BullMQ handles time-sensitive logic:

1.  **Missed Slot Worker**:
    *   **Trigger**: Fires 30 minutes after `slotTime`.
    *   **Action**: Checks if status is still `BOOKED`/`PENDING`. If so, updates status to `MISSED` and emits a notification.
2.  **Reminder Jobs**:
    *   Scheduled for 1 hour before the appointment to reduce no-show rates.

---

## 💾 Database Schema (Prisma)

### Key Models
- `User`: Handles authentication and roles (`USER` | `CENTER`).
- `Center`: Profile data, opening hours, and location.
- `Service`: Diagnostic scan types with duration, price, and `totalSlots` capacity.
- `Booking`: The central transactional record linking users, centers, and slots.
- `QueueEntry`: A dynamic record for active tracking, linked 1:1 with a booking.

---

## 🔒 Security & Auth

ScanMitra uses **NextAuth.js** with a customized adapter:
- **Role-Based Access Control (RBAC)**: Middleware protects `/user` and `/center` routes respectively.
- **Data Integrity**: Uses Zod for schema validation on all POST/PUT routes.
- **Prisma Transactions**: Critical for booking creation to prevent double-booking or capacity overruns.

---

## 🚀 Performance Optimizations

1.  **Redis Caching**: Center listings and slot availability are cached for 30s to reduce database load.
2.  **Database Indexing**: Compound indexes on `[centerId, slotTime]` and `[status]` for O(1) queue lookups.
3.  **Lazy Loading**: Heavy dashboard charts and tables are dynamically imported to reduce initial bundle size.

---

## 📞 Support & Maintenance
For further technical assistance, contact the development team at `dev@scanmitra.com`.
