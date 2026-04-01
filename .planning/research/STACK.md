# Tech Stack Research

## Backend (Django)
- **Framework**: Django 5.x + Django REST Framework 3.15+
- **Language**: Python 3.11+
- **Database**: PostgreSQL 16 (Single Schema, Row-Level Security via `tenant_id`)
- **Background Jobs**: Django-Q2 (Postgres broker)
- **PDF Generation**: WeasyPrint
- **Auth**: JWT via `djangorestframework-simplejwt`

## Frontend / Parent Portal (Next.js)
- **Framework**: Next.js 15.x (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack Table v8
- **Charts**: Recharts
- **PWA**: Custom service worker + manifest for Parent Portal

## Marketing Site (Existing)
- **Framework**: React 19 + Vite 8 (to be moved into `marketing/` folder in monorepo setup)

## Integrations & Infrastructure
- **Storage**: Cloudflare R2 (S3 compatible API)
- **Payments**: Razorpay
- **Email**: Resend
- **Messaging**: Firebase Web Push / WATI (WhatsApp) / MSG91 (SMS fallback)
- **Hosting**: Backend on Railway, Frontend on Vercel
- **CI/CD**: GitHub Actions
- **Error Tracking**: Sentry
