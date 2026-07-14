# 🎬 SuviX - Freelancing Platform

<div align="center">

![SuviX Logo](https://img.shields.io/badge/SuviX-Video%20Editing%20Platform-green?style=for-the-badge&logo=youtube)

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

**A modern freelancing platform connecting video editors with clients**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Docs](#-api-endpoints) • [Contributing](#-contributing)

</div>

---

## 📖 About

**SuviX** (Suvin Editography) is a specialized freelancing platform designed for video editors. It allows:

- **Editors** to showcase their portfolio, skills, and get hired for video editing projects
- **Clients** to browse editors, view their work, and hire them for projects

## ✨ Features

### 🔐 Authentication
- Role-based signup (Editor/Client)
- JWT-based secure authentication
- Profile picture upload during registration
- Password strength validation

### 👤 Editor Profiles
- Complete profile management (about, skills, languages, experience)
- Certification uploads with image gallery
- Country-based location display with flags
- Profile completion tracking

### 🎨 Portfolio System
- Upload original and edited video/image clips
- Side-by-side comparison display
- Video preview modal with controls
- Cloudinary-based media storage

### 🔍 Explore Editors
- Paginated editor listing
- Search by name, skills, or languages
- Scrollable skill/language tags
- Public profile viewing

### 🛡️ Security (Production-Ready)
- Rate limiting on auth endpoints
- Input validation and sanitization
- Helmet.js security headers
- Centralized error handling
- Winston logging system

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI Framework |
| Vite | Build Tool |
| TailwindCSS 4 | Styling |
| React Router 7 | Routing |
| Axios | HTTP Client |
| React Toastify | Notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express 5 | Web Framework |
| MongoDB | Database |
| Mongoose 8 | ODM |
| JWT | Authentication |
| Cloudinary | Media Storage |
| Winston | Logging |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/suvix.git
cd suvix
```

### 2️⃣ Setup Backend
```bash
cd server
npm install
```

Create `.env` file in `server/`:
```env
MONGO_URI=mongodb+srv://your_connection_string
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
```

Start the server:
```bash
npm run dev
```

### 3️⃣ Setup Frontend
```bash
cd frontend
npm install
```

Create `.env` file in `frontend/`:
```env
VITE_BACKEND_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
```

### 4️⃣ Open in Browser
Visit [http://localhost:5173](http://localhost:5173)

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/update-profile-picture` | Update avatar |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get own profile |
| GET | `/api/profile/:userId` | Get public profile |
| PUT | `/api/profile` | Update profile |

### Portfolio
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/portfolio` | Get own portfolios |
| POST | `/api/portfolio` | Create portfolio |
| PUT | `/api/portfolio/:id` | Update portfolio |
| DELETE | `/api/portfolio/:id` | Delete portfolio |
| GET | `/api/portfolio/user/:userId` | Get user's portfolios |

### Explore
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/explore/editors` | List all editors (paginated) |

---

## 📁 Project Structure

```
suvix/
├── frontend/
│   ├── src/
│   │   ├── assets/          # Images, logos
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React Context (AppContext)
│   │   ├── pages/           # Page components
│   │   └── App.jsx          # Main app component
│   └── package.json
│
├── server/
│   ├── config/              # Database config
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Auth, rate limiting, validators
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── utils/               # Helper functions
│   ├── logs/                # Winston log files
│   └── server.js            # Entry point
│
└── README.md
```

---

## 🔮 Roadmap

- [ ] Gig marketplace for editors
- [ ] Order management system
- [ ] Real-time chat with Socket.io
- [ ] Payment integration (Stripe/Razorpay)
- [ ] Reviews and ratings
- [ ] Email notifications
- [ ] Admin dashboard

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Suvin** - *SuviX (Suvin Editography)*

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

</div>
