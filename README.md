# 🩺 ScanMitra: Smart Diagnostic Queue Management

**ScanMitra** is a state-of-the-art, full-stack diagnostic booking and real-time queue management platform. It bridge the gap between patients and diagnostic centers, providing transparency, reducing wait times, and automating complex hospital-grade workflows.

---

## 🌟 Key Features

### 👤 For Patients
- **Discover Centers**: Search and browse verified diagnostic centers with detailed service listings.
- **80/20 Smart Booking**: Reserved online slots ensure you always have a place, while walk-in support keeps the center efficient.
- **Live Queue Tracking**: Watch your position in the queue move in real-time with dynamic ETA updates.
- **Smart Notifications**: Persistent alerts for delay reports and automated "Missed Slot" re-booking prompts.
- **Medical Records**: Securely manage your past bookings and diagnostic reports.

### 🏥 For Diagnostic Centers
- **Real-time Dashboard**: A powerful "Air Traffic Control" style dashboard to manage live patients.
- **Queue State Machine**: Sophisticated transitions (Call Next, In-Progress, Skip, Complete) with automated token handling.
- **Walk-in Support**: Seamlessly add on-site patients into the 20% reserved walk-in slots with overflow logic.
- **Delay Broadcasting**: Instantly notify all waiting patients of any operational delays via WebSockets.
- **Automated Scheduling**: Missed slots are automatically detected and marked after 30 minutes.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router & Server Actions)
- **Runtime**: Node.js with a custom `server.ts` for native WebSocket support.
- **Real-time**: [Socket.io](https://socket.io/) for bi-directional event streaming.
- **Database**: [Prisma](https://www.prisma.io/) + [PostgreSQL](https://neon.tech/) (Neon).
- **Background Jobs**: [BullMQ](https://docs.bullmq.io/) + [Upstash Redis](https://upstash.com/) for distributed task scheduling.
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) with multi-role RBAC.
- **Storage**: [Cloudinary](https://cloudinary.com/) for medical document handling.
- **Styling**: Tailwind CSS with Premium Glassmorphism UI.

---

## 🛠️ Installation & Setup

### 1. Prerequisites
- Node.js 18+
- A Redis instance (Upstash recommended)
- A PostgreSQL database (Neon recommended)

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your_secret"
NEXTAUTH_URL="http://localhost:3000"

# Redis (BullMQ + Caching)
UPSTASH_REDIS_URL="rediss://..."
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### 3. Setup Commands
```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Push Schema to DB
npx prisma db push

# Start Development Server
npm run dev
```

---

## 📦 Deployment

### Recommended: Railway.app / Zeabur
ScanMitra requires a **persistent Node.js process** for Socket.io to function correctly. Standard serverless platforms (like Vercel) are not recommended.

1. Connect your GitHub repo to Railway.
2. Ensure the `start` script is set to: `NODE_ENV=production tsx server.ts`.
3. Add your environment variables in the Railway dashboard.

---

## 📜 Documentation
Detailed technical documentation, including API routes and architecture, can be found in [DOCUMENTATION.md](./DOCUMENTATION.md).

---

## ⚖️ License
This project is licensed under the MIT License.
