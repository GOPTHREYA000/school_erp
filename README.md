# School ERP SaaS Platform

A modern, multi-tenant School ERP system built with **Django (Backend)** and **Next.js (Frontend)**.

## 🚀 Quick Start (Zero-to-Hero)

If you are a new developer, follow these steps to get the project running locally with pre-configured demo data.

### 1. Prerequisite
Ensure you have the following installed:
- **Python 3.10+**
- **Node.js 20+** (NPM)
- **Git**

### 2. Automatic Setup (Recommended)
Run the following script from the root directory. It will set up your virtual environment, install dependencies, run migrations, and seed the demo data.

```bash
chmod +x dev-setup.sh
./dev-setup.sh
```

### 3. Manual Startup
After setup, you can start the servers in separate terminals:

**Backend:**
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🔑 Demo Credentials

Use these credentials to explore the platform after running the setup script.

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **School Admin**| `school_admin@demo.com`| `password123` | Multi-branch Management |
| **Branch Admin**| `branch_admin@demo.com`| `password123` | Single Branch Operations |

---

## 🏗️ Tech Stack

### Backend
- **Framework**: Django 4.2 + Django Rest Framework (DRF)
- **Auth**: JWT (SimpleJWT) via HTTP-only Cookies
- **Database**: PostgreSQL (Prod) / SQLite (Dev)
- **Multi-tenancy**: Custom middleware-based isolation

### Frontend
- **Framework**: Next.js 16.2 (App Router)
- **Styling**: Tailwind CSS 4.0
- **State**: Global `AuthProvider` (React Context)
- **Icons**: Lucide React
- **Animations**: Framer Motion

---

## 📂 Project Structure

- `backend/`: Django project files, apps, and logic.
- `frontend/`: Next.js application, components, and assets.
- `docs/`: Technical documentation and PRDs.
- `dev-setup.sh`: One-click environment preparation script.

---

## 🛠️ Contribution
1. Create a feature branch.
2. Ensure `npm run build` passes before submitting a PR.
3. Update migrations if you change models.

---

## 📞 Support
For internal developer support, please contact the product owner directly.
