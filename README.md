# 🏛️ JanSeva

> **Jan = People • Seva = Service**
>
> **AI-Powered Smart Civic Issue Reporting & Resolution Platform**

JanSeva is a full-stack AI-powered civic issue reporting platform that connects **citizens** and **government authorities** through a transparent digital workflow.

Citizens can report infrastructure issues with images and location, while AI automatically categorizes, prioritizes, and assigns cases to the appropriate departments. Authorities receive intelligent dashboards, analytics, and workflow management tools to resolve issues efficiently.

---

# 🌟 Features

## 👥 Citizen Portal

- Secure JWT Authentication
- Report civic issues with images
- GPS based location detection
- Interactive issue map
- AI-powered issue categorization
- Real-time issue tracking
- Personal dashboard
- Edit submitted reports
- Community leaderboard
- XP progression system
- Avatar progression system
- Daily missions
- Profile management

---

## 🏢 Authority Portal

Dedicated login for municipal authorities.

Authorities can

- View department-specific cases
- AI-assisted issue assignment
- Verify reports
- Update issue status
- Resolve cases
- Monitor city analytics
- Track performance
- View recent activities
- Manage workflow

---

## 🤖 AI Features

JanSeva combines **Google Gemini** and **Groq LLMs** to automate civic issue management.

### AI Capabilities

- Image understanding
- Issue categorization
- Severity estimation
- Department assignment
- Duplicate issue detection
- Resolution recommendations
- Authority summaries
- Civic intelligence insights
- Smart analytics generation

---

# 🚦 Issue Resolution Workflow

```
Citizen Reports Issue
          │
          ▼
AI Analysis
(Category • Severity • Department)
          │
          ▼
Locate
          │
          ▼
Verify
          │
          ▼
Assign
          │
          ▼
In Progress
          │
          ▼
Resolved
```

Every issue maintains a complete timeline from creation to resolution.

---

# 🏆 Gamification

Citizens earn rewards for participating.

Features include

- XP System
- Avatar Progression
- Leaderboards
- Achievement Badges
- Daily Missions
- Community Rankings

---

# 📊 Analytics Dashboard

Authorities can monitor

- Total Issues
- Active Issues
- Resolution Rate
- Department Performance
- Category Distribution
- Resolution Trends
- AI Insights
- City-wide Statistics

---

# 🛠 Tech Stack

## Frontend

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Zustand
- React Router
- Recharts
- Leaflet Maps
- Lucide Icons

---

## Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Cloudinary
- Multer

---

## AI

- Google Gemini
- Groq API
- Llama Models

---

## Database

- PostgreSQL
- Prisma ORM

---

## Deployment

- Render
- Neon PostgreSQL
- Cloudinary

---

# 📂 Project Structure

```
JanSeva/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── store/
│   ├── utils/
│   ├── types/
│   └── assets/
│
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── ai/
│   │   └── utils/
│   │
│   └── package.json
│
├── public/
│
└── README.md
```

---

# 🚀 Installation

Clone the repository

```bash
git clone https://github.com/Shrezzzzz/JanSeva.git

cd JanSeva
```

Install frontend

```bash
npm install
```

Install backend

```bash
cd backend

npm install
```

---

# 🗄 Database Setup

Generate Prisma Client

```bash
npx prisma generate
```

Apply database schema

```bash
npx prisma migrate deploy
```

or during development

```bash
npx prisma db push
```

---

# ▶️ Run Locally

Frontend

```bash
npm run dev
```

Backend

```bash
cd backend

npm run dev
```

---

# 📡 API Modules

### Authentication

- Login
- Register
- Profile

### Issues

- Create Issue
- Update Issue
- Track Issue
- Issue Timeline
- Nearby Issues

### Upload

- Cloudinary Image Upload

### AI

- Image Analysis
- Categorization
- Department Assignment
- AI Insights

### Analytics

- Dashboard Statistics
- Trends
- Reports

### Missions

- Daily Citizen Missions

---

# 🔐 Authentication

- JWT Authentication
- Role-based Authorization
- Citizen Access
- Authority Access
- Department Permissions

---

# 🎯 Future Scope

- Mobile Application
- Push Notifications
- AI Chat Assistant
- Multi-language Support
- IoT Sensor Integration
- Predictive Maintenance
- Smart City Dashboard
- Government API Integration

---

# 🤝 Contributing

1. Fork the repository

2. Create a new branch

```bash
git checkout -b feature-name
```

3. Commit changes

```bash
git commit -m "Added new feature"
```

4. Push

```bash
git push origin feature-name
```

5. Open a Pull Request

---

# 👩‍💻 Developed By

**Shreya Chowdhury**

B.Tech CSE (IoT)

GitHub:
https://github.com/Shrezzzzz

LinkedIn:
https://www.linkedin.com/in/shreya-chowdhury-b81988293

---

# ⭐ If you like this project

Give this repository a ⭐ on GitHub!

---

## Built for smarter cities, empowered citizens, and AI-driven governance.
