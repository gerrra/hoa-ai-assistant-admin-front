# HOA AI Assistant - Admin Frontend

Admin React/Vite frontend for HOA AI Assistant - allows administrators to manage documents and view logs.

## Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm ci
   ```

2. **Start development server:**
   ```bash
   npm run dev -- --port 5174
   ```

3. **Open in browser:**
   ```
   http://localhost:5174
   ```

### Production Build

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Preview production build:**
   ```bash
   npm run preview
   ```

### Docker

```bash
docker build -t hoa-admin-front .
docker run -p 80:80 hoa-admin-front
```

## Environment Variables

- `.env.development` - Development settings
- `.env.production` - Production settings

Key variable: `VITE_API_BASE_URL` - Backend API URL

## Features

- Upload and manage HOA documents
- View question logs and analytics
- Admin authentication
- Document management interface
