# PA Salatiga Monitoring Dashboard

Next.js application for monitoring court performance metrics with MySQL database, admin panel, and analytics charts.

## 🚀 Features

- **Public Dashboard**: Auto-slide monitoring cards with real-time status indicators
- **Admin Authentication**: Secure login with NextAuth.js (admin/admin123)
- **Data Management**: Complete CRUD operations for quarterly monitoring data
- **Analytics Dashboard**: Performance metrics with SVG-based line charts
- **Chart Visualization**: Interactive charts with yearly/all-data filtering
- **Status System**: Color-coded performance indicators (Green/Orange/Red)
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Toast Notifications**: User-friendly feedback system

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js with credentials provider
- **Database**: MySQL with mysql2 driver
- **Charts**: Custom SVG-based line charts
- **Notifications**: Custom toast system

## 📊 Monitoring Systems

The dashboard monitors 22 key performance indicators for PA Salatiga:

### Sistem Utama
- E-Court, Gugatan Mandiri, Eksaminasi
- Keuangan Perkara, Pengelolaan PNBP
- Zona Integritas, SKM/IKM, Inovasi

### Sistem Pendukung  
- Pelaporan Kinsatker, Layanan PTSP, IKPA
- Website, Prestasi, Validasi Data Simtepa
- SIKEP, SKP, CCTV, Sipintar
- ETR, LHKPN & LHKASN, Kumdis, LHP oleh Hawasbid

## 🗄 Database Setup

1. Ensure MySQL server is running on localhost
2. Import the database schema:
   ```bash
   mysql -u root -p < database/init.sql
   mysql -u root -p < database/update-monitoring-data.sql
   ```

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jharrvis/pa-salatiga-monitoring.git
   cd pa-salatiga-monitoring
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   # Create .env.local file
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. Run the application:
   ```bash
   npm run dev
   ```

5. Access the application at `http://localhost:3000`

## 🔐 Default Login

- **Username**: admin
- **Password**: admin123

## 📈 Usage

### Public Dashboard
- Displays all monitoring systems with real-time status
- Auto-slides between "Sistem Utama" and "Sistem Pendukung"
- Click logo 5 times to access admin login

### Admin Panel
- **Kelola Sistem**: Configure monitoring cards and settings
- **Input Data**: Quarterly data input with CRUD operations
- **Charts**: Visualization of performance trends
- **Analytics**: Performance metrics with filtering options

### Analytics Features
- **Performance Overview**: Current values, targets, and percentages
- **Status System**: Color-coded indicators based on performance thresholds
- **Chart Visualization**: SVG line charts with data point tooltips
- **Data Filtering**: View by specific year or all available data

## 📊 Database Schema

### Key Tables
- `admin_users`: Admin authentication
- `monitoring_configs`: System configurations and settings
- `monitoring_data`: Quarterly performance data
- `app_settings`: Application settings (slide duration, etc.)

## 🚦 Status Thresholds

- **🟢 Baik (Good)**: 80-100%
- **🟠 Peringatan (Warning)**: 50-79%  
- **🔴 Kritis (Critical)**: 0-49%

## 🛠 Development

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📝 Contributing

This project was developed for PA Salatiga (Pengadilan Agama Salatiga) to monitor court performance metrics and operational efficiency.

## 🤖 Generated with AI

This project was built with assistance from Claude Code AI assistant.

---

**PA Salatiga Monitoring Dashboard** - Empowering judicial excellence through data-driven insights.
