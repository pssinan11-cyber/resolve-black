# 🎯 Brototype Resolve
url https://resolve-mono.lovable.app
A minimalist, AI-powered complaint management system designed for educational institutions. Built with a focus on clean design, security, and intelligent automation.

![Brototype Resolve](https://img.shields.io/badge/status-production-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-18.x-blue)

## ✨ Features

### 🎓 Student Features
- **Submit Complaints**: Easy-to-use form with title, description, severity selection, and file attachments
- **AI-Powered Categorization**: Automatic complaint classification using advanced AI
- **Real-Time Tracking**: Visual progress bars and status updates
- **Comment System**: Chat-style communication with administrators
- **Rating & Feedback**: Rate resolved complaints and provide feedback
- **Notifications**: Real-time alerts for complaint status changes

### 🛡️ Admin Features
- **Smart Complaint Queue**: Auto-prioritized dashboard with urgent complaints highlighted
- **Comprehensive Analytics**: Resolution times, satisfaction scores, category breakdowns
- **Security Monitoring**: Real-time security logs and suspicious activity detection
- **AI-Assisted Management**: Auto-generated reply suggestions, priority scoring, resolution predictions
- **Audit Logging**: Complete activity tracking for compliance

### 🤖 AI Capabilities
- **Complaint Classification**: Automatic categorization with confidence scores
- **Smart Reply Generation**: Context-aware response suggestions in multiple tones
- **Priority Scoring**: Intelligent prioritization based on multiple factors
- **Resolution Time Prediction**: ML-based time estimates
- **Thread Summarization**: Quick overviews of long conversations

### 🔒 Security Features
- **Row-Level Security (RLS)**: Database-level access control
- **Role-Based Authentication**: Separate student and admin roles
- **Anonymous Access Prevention**: Explicit denial of unauthenticated access
- **Security Event Logging**: Comprehensive audit trail
- **Suspicious Activity Detection**: Real-time threat monitoring
- **Leaked Password Protection**: Integration with breach databases

---

## 🛠️ Tech Stack

- **React 18.3** with TypeScript
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first styling
- **Shadcn/ui** - High-quality component library
- **Supabase** - Backend (PostgreSQL, Auth, Storage, Edge Functions)
- **React Query** - Server state management
- **Lovable Cloud** - Deployment platform

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm/yarn/pnpm/bun package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd brototype-resolve
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

---

## 📁 Project Structure

```
brototype-resolve/
├── src/
│   ├── components/         # React components
│   │   ├── dashboard/     # Dashboard-specific components
│   │   ├── ui/           # Reusable UI components (Shadcn)
│   │   └── ErrorBoundary.tsx
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # External service integrations
│   ├── pages/            # Page components
│   ├── lib/              # Utility functions
│   └── index.css         # Global styles & design system
├── supabase/
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge Functions
├── .env.example          # Environment variables template
└── README.md            # This file
```

---

## 🎨 Design System

Brototype Resolve follows a strict **black & white minimalist** design philosophy with:
- Clean, modern interface
- Smooth micro-animations
- Generous whitespace
- Clear visual hierarchy
- Full accessibility support

---

## 🔐 Security

### Authentication
- JWT-based authentication via Supabase Auth
- Separate login flows for students and admins
- Role-based access control with server-side validation
- Secure session management with auto-refresh

### Database Security
- Row-Level Security (RLS) on all tables
- Anonymous access prevention on sensitive data
- Server-side role validation via Edge Functions
- Comprehensive audit logging

### Security Monitoring
- Real-time security logs tracking all auth events
- Suspicious activity detection for brute force attacks and privilege escalation
- Automated alerting to administrators

---

## 🚢 Deployment

### Lovable Cloud (Recommended)
Simply open [Lovable](https://lovable.dev/projects/8ea3e219-3023-4e70-99c0-71943216b751) and click on Share → Publish.

### Manual Deployment

#### Vercel
```bash
npm run build
vercel --prod
```

#### Netlify
```bash
npm run build
netlify deploy --prod
```

### Custom Domain
Navigate to Project > Settings > Domains and click Connect Domain.
[Learn more](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## 🧪 Testing

### Manual Testing Checklist

#### Student Flow
- [ ] Sign up with email/password
- [ ] Submit a new complaint
- [ ] Add attachments
- [ ] View complaint status
- [ ] Rate resolved complaint

#### Admin Flow
- [ ] View all complaints
- [ ] View analytics dashboard
- [ ] View security logs
- [ ] Update complaint status
- [ ] Resolve complaint

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 📞 Support

For support, open an issue on GitHub or visit the [Lovable Project Page](https://lovable.dev/projects/8ea3e219-3023-4e70-99c0-71943216b751).

---

## 🗺️ Roadmap

- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Export reports to PDF

---

Made with ❤️ using [Lovable](https://lovable.dev)
