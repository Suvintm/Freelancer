# Suvix - Advanced Video Editing Freelance Marketplace

## 📌 Project Overview

**Suvix** is a premium, specialized freelance marketplace connecting content creators (Clients) with high-quality video editors. Unlike generic platforms, Suvix focuses specifically on the video editing niche, offering features tailored to this workflow such as "Reels" showcases, Portfolio management, and a dedicated "Suvix Score" reputation system. The platform ensures trust and quality through rigorous KYC (Know Your Customer) processes for both editors and clients.

## 🛠 Technology Stack

### Backend (Server)

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**:
  - JWT (JSON Web Tokens) for session management
  - Passport.js for OAuth (Google/Facebook)
- **Real-time Communication**: Socket.io (for Chat & Notifications)
- **File Storage**: Cloudinary (via Multer)
- **Payments**: Razorpay Integration (India) & Stripe (Planned)
- **Security**: Helmet, Rate Limiting, CORS, Bcryptjs, AES-256 Encryption (for sensitive bank data)
- **Logging**: Winston

### Frontend (Client & Editor App)

- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS, Vanilla CSS
- **Animations**: Framer Motion, Canvas Confetti
- **State Management**: React Context API
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Charts/Analytics**: Recharts
- **UI Components**: React Icons, React Select, Toastify, React Hot Toast

### Admin Frontend

- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS
- **Role**: Dedicated dashboard for platform management (KYC, Users, Gigs)

---

## 🏗 Architecture & Database Schema

The application follows a **MVC (Model-View-Controller)** pattern on the backend and a component-based architecture on the frontend.

### Key Data Models (Mongoose Schemas)

1.  **User**:

    - Roles: `client`, `editor`, `admin`
    - Auth: `email`, `password` (hashed), `googleId`, `facebookId`
    - Profile: `name`, `avatar`, `bio`, `location`
    - Stats: `suvixScore`, `rating`, `totalProjects`
    - Financials: `walletBalance`, `bankDetails` (Encrypted)
    - Status: `isVerified`, `isBanned`, `kycStatus`
    - Features: `savedEditors` (Favorites list)

2.  **Gig**:

    - Service listings created by Editors.
    - Attributes: `title`, `description`, `price`, `deliveryTime`, `category`, `tags`, `images`.

3.  **Order**:

    - Tracks a transaction between Client and Editor.
    - Status: `pending`, `active`, `delivered`, `completed`, `cancelled`.
    - Financials: `amount`, `paymentStatus`, `razorpayOrderId`.

4.  **ClientKYC** & **EditorKYC**:

    - Verification data for users.
    - Fields: `idProof`, `bankProof`, `panNumber`, `gstin`, `status` (pending/verified/rejected).
    - Audit: `KYCLog` tracks history of verification attempts and admin actions.

5.  **Refund**:

    - Manages refund requests and processing.
    - Methods: `original_payment` (Razorpay refund) or `wallet` (Suvix Wallet credit).

6.  **Reel** & **Portfolio**:

    - Visual portfolio items for Editors to showcase work (e.g., Short form content, YouTube videos).

7.  **Message**:

    - Chat messages linked to `Order` or direct inquiry.
    - Supports text and file attachments.

8.  **Review**:
    - Ratings and feedback left by Clients for Editors.

---

## 🚀 Core Features

### 1. User Authentication & Roles

- **Dual Login**: Email/Password and Social Login (Google/Facebook).
- **Role Selection**: Users choose to be a Client or Editor upon registration.
- **Security**: HttpOnly Cookies for token storage, AES encryption for PII.

### 2. Marketplace & Discovery

- **Explore Editors**: Advanced search with filters (Skills, Software, Budget, Ratings).
- **Favorites**: Clients can "Heart" editors to save them for later.
- **Suvix Score**: Proprietary algorithm giving editors a quality score based on responsiveness, ratings, and completion rate.

### 3. Editor Dashboard

- **Analytics**: Revenue charts, Order completion rates, Profile views.
- **Gig Management**: Create, edit, and pause service listings.
- **Portfolio/Reels**: Upload video samples directly to profile.
- **My Orders**: Kanban-style or list view of active jobs.

### 4. Client Dashboard

- **Job Posting**: (Planned feature) Post requirements for editors to bid on.
- **Order Management**: Track progress of hired editors.
- **KYC Verification**: Submit ID and Bank details to enable high-value transactions and refunds.
- **Saved Editors**: Quick access to favorited profiles.

### 5. Chat & Collaboration

- **Real-time Messaging**: Socket.io backed chat.
- **File Sharing**: Send assets and draft videos within chat.
- **Order Updates**: System messages in chat for "Order Started", "Delivered", etc.

### 6. Payments & Refunds

- **Secure Checkout**: Razorpay integration.
- **Escrow-like Flow**: Money held until order completion (Conceptual).
- **Automated Refunds**:
  - Auto-refund to source on cancellation.
  - Fallback to "Suvix Wallet" if source refund fails.
  - Admin-controlled manual refunds.

### 7. Administration

- **KYC Management**: Split-view interface for approving/rejecting documents.
- **User Management**: Ban/Unban users, view audit logs.
- **Platform Analytics**: Total revenue, active users, growth metrics.

---

## 🔒 Security & Compliance

- **KYC (Know Your Customer)**: Mandatory for Editors to withdraw funds and Clients to claim high-value refunds.
- **Encryption**: Sensitive bank fields (Account No, IFSC) are stored encrypted using AES-256-CBC.
- **Audit Logs**: All admin actions on KYC data are logged in `KYCLog` for compliance.

## 📂 Project Structure

```
/freelancer
  ├── /server               # Backend API
  │   ├── /controllers      # Logic for routes
  │   ├── /models           # Database schemas
  │   ├── /routes           # API endpoints
  │   ├── /middleware       # Auth, Error, Upload, KYC checks
  │   └── /utils            # Helpers (Encryption, Email, Logger)
  │
  ├── /frontend             # Main React App
  │   ├── /src/pages        # Route components (ClientHome, EditorHome, etc.)
  │   ├── /src/components   # Reusable UI (Cards, Modals, Navbar)
  │   ├── /src/context      # Global State (Auth, Socket)
  │   └── /src/assets       # Images, Fonts
  │
  └── /admin-frontend       # Dedicated Admin Portal
      ├── /src/pages        # Admin Dashboard, KYC Lists
      └── /src/components   # Admin UI elements
```
