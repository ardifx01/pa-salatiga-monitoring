'use client';

import { useState, useEffect } from 'react';

interface MonitoringData {
  id: number;
  title: string;
  value: number;
  maxValue: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  progress: number;
  isRealtime: boolean;
  subtitle?: string;
  currentValue?: string;
  icon?: string;
}

interface AppSettings {
  app_name: string;
  institution_name: string;
  app_description: string;
  update_interval: number;
  slide_duration: number;
  notification_email: string;
  auto_update_enabled: boolean;
  email_notifications_enabled: boolean;
  auto_slide_enabled: boolean;
}

export default function PublicDashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [slideProgress, setSlideProgress] = useState(0);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [settings, setSettings] = useState<AppSettings>({
    app_name: 'Smartvinesa v.13',
    institution_name: 'PA Salatiga',
    app_description: 'Smart View Kinerja Satker PA Salatiga',
    update_interval: 5,
    slide_duration: 5,
    notification_email: '',
    auto_update_enabled: true,
    email_notifications_enabled: true,
    auto_slide_enabled: true
  });

  useEffect(() => {
    loadSettings();
    loadMonitoringData();
  }, []);

  useEffect(() => {
    // Auto slide between pages based on settings
    if (!settings.auto_slide_enabled) {
      setSlideProgress(0);
      return;
    }
    
    const slideDuration = settings.slide_duration * 1000; // Convert to milliseconds
    let startTime = Date.now();
    
    // Progress bar animation
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed / slideDuration) * 100;
      setSlideProgress(Math.min(progress, 100));
    }, 50);
    
    // Page transition
    const slideInterval = setInterval(() => {
      setCurrentPage(prev => prev === 1 ? 2 : 1);
      setSlideProgress(0);
      startTime = Date.now();
    }, slideDuration);

    return () => {
      clearInterval(slideInterval);
      clearInterval(progressInterval);
    };
  }, [settings.auto_slide_enabled, settings.slide_duration]);

  useEffect(() => {
    // Update timestamp based on settings
    if (!settings.auto_update_enabled) return;
    
    const updateInterval = setInterval(() => {
      setLastUpdate(new Date());
      // Optionally reload monitoring data here
    }, settings.update_interval * 60 * 1000);

    return () => clearInterval(updateInterval);
  }, [settings.auto_update_enabled, settings.update_interval]);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadMonitoringData = () => {
    // Data sesuai dengan design PA Salatiga
    const mockData: MonitoringData[] = [
      // Page 1 - Sistem Utama
      { id: 1, title: 'SIPP', value: 97.5, maxValue: 100, unit: '%', status: 'good', progress: 97.5, isRealtime: true, subtitle: 'Sistem Informasi Penelusuran Perkara', currentValue: '(11.7/12)', icon: '⚖️' },
      { id: 2, title: 'Mediasi', value: 39.1, maxValue: 100, unit: '%', status: 'critical', progress: 39.1, isRealtime: true, subtitle: 'Tingkat keberhasilan Mediasi', currentValue: '(3.13/8)', icon: '🤝' },
      { id: 3, title: 'E-Court', value: 99.6, maxValue: 100, unit: '%', status: 'good', progress: 99.6, isRealtime: true, subtitle: 'Implementasi Electronic Court System', currentValue: '(11.95/12)', icon: '💻' },
      { id: 4, title: 'Gugatan Mandiri', value: 50.0, maxValue: 100, unit: '%', status: 'critical', progress: 50.0, isRealtime: true, subtitle: 'Implementasi Gugatan Mandiri', currentValue: '(1/2)', icon: '🛠️' },
      { id: 5, title: 'Banding', value: 60.0, maxValue: 100, unit: '%', status: 'critical', progress: 60.0, isRealtime: true, subtitle: 'Kecepatan Administrasi Banding', currentValue: '(1.2/2)', icon: '✈️' },
      { id: 6, title: 'Kasasi & PK', value: 60.0, maxValue: 100, unit: '%', status: 'critical', progress: 60.0, isRealtime: true, subtitle: 'Kecepatan Administrasi Kasasi', currentValue: '(1.2/2)', icon: '💼' },
      { id: 7, title: 'Eksaminasi', value: 98.3, maxValue: 100, unit: '%', status: 'good', progress: 98.3, isRealtime: true, subtitle: 'Nilai Eksaminasi Berkas melalui e-Eksaminasi', currentValue: '(2.95/3)', icon: '🔍' },
      { id: 8, title: 'Keuangan Perkara', value: 94.5, maxValue: 100, unit: '%', status: 'good', progress: 94.5, isRealtime: true, subtitle: 'Nilai Validasi Keuangan Perkara', currentValue: '(3.78/4)', icon: '💰' },
      { id: 9, title: 'Pengelolaan PNBP', value: 100.0, maxValue: 100, unit: '%', status: 'good', progress: 100.0, isRealtime: true, subtitle: 'Nilai Pengelolaan Negara Bukan Pajak', currentValue: '(3/3)', icon: '🏛️' },
      { id: 10, title: 'Zona Integritas', value: 80.0, maxValue: 100, unit: '%', status: 'warning', progress: 80.0, isRealtime: false, subtitle: 'Monitoring Raihan Zona Integritas', currentValue: '(4/5)', icon: '🛡️' },
      { id: 11, title: 'SKM/IKM', value: 100.0, maxValue: 100, unit: '%', status: 'good', progress: 100.0, isRealtime: true, subtitle: 'Survey Kepuasan Masyarakat/Indeks Kepuasan...', currentValue: '(4/4)', icon: '📊' },
      { id: 12, title: 'Inovasi', value: 100.0, maxValue: 100, unit: '%', status: 'good', progress: 100.0, isRealtime: true, subtitle: 'Capaian Nilai Inovasi Pengadilan', currentValue: '(3/3)', icon: '💡' },
      
      // Page 2 - Sistem Pendukung
      { id: 13, title: 'Pelaporan Kinsatker', value: 100.0, maxValue: 100, unit: '%', status: 'good', progress: 100.0, isRealtime: true, subtitle: 'Pelaporan Perkara melalui Kinsatker', currentValue: '(3/3)', icon: '📋' },
      { id: 14, title: 'Layanan PTSP', value: 100.0, maxValue: 100, unit: '%', status: 'good', progress: 100.0, isRealtime: true, subtitle: 'Ketersediaan Layanan PTSP', currentValue: '(2/2)', icon: '🏢' },
      { id: 15, title: 'IKPA', value: 100.0, maxValue: 100, unit: '%', status: 'good', progress: 100.0, isRealtime: true, subtitle: 'Indeks Kinerja Pelaksanaan Anggaran', currentValue: '(6/6)', icon: '✏️' },
      { id: 16, title: 'Website', value: 100.0, maxValue: 100, unit: '%', status: 'good', progress: 100.0, isRealtime: true, subtitle: 'Penilaian Kelengkapan Informasi Website Pengadilan', currentValue: '(3/3)', icon: '🌐' },
      { id: 17, title: 'Prestasi', value: 75.0, maxValue: 100, unit: '%', status: 'warning', progress: 75.0, isRealtime: false, subtitle: 'Capaian Prestasi Lokal, Provinsi dan Nasional', currentValue: '(3.75/5)', icon: '🏆' },
      { id: 18, title: 'Validasi Data Simtepa', value: 100.0, maxValue: 100, unit: '%', status: 'good', progress: 100.0, isRealtime: true, subtitle: 'Validasi Kelengkapan Data Kepegawaian melalui Simtepa', currentValue: '(3/3)', icon: '✅' },
      { id: 19, title: 'SIKEP', value: 100.0, maxValue: 100, unit: '%', status: 'good', progress: 100.0, isRealtime: true, subtitle: 'Monitoring Kelengkapan Data Kepegawaian melalui Aplikasi...', currentValue: '(3/3)', icon: '👥' },
      { id: 20, title: 'SKP', value: 100.0, maxValue: 100, unit: '%', status: 'good', progress: 100.0, isRealtime: true, subtitle: 'Monitoring Ketersediaan Data Sasaran Kinerja Pegawai', currentValue: '(3/3)', icon: '🎯' },
      { id: 21, title: 'CCTV', value: 100.0, maxValue: 100, unit: '%', status: 'good', progress: 100.0, isRealtime: true, subtitle: 'Monitoring Ketersediaan CCTV Pengadilan', currentValue: '(3/3)', icon: '📹' },
      { id: 22, title: 'Sipintar', value: 93.3, maxValue: 100, unit: '%', status: 'good', progress: 93.3, isRealtime: true, subtitle: 'Monitoring Kekurangan Pegawai Teknis dalam...', currentValue: '(2.8/3)', icon: '🎓' },
      { id: 23, title: 'ETR', value: 100.0, maxValue: 100, unit: '%', status: 'good', progress: 100.0, isRealtime: true, subtitle: 'Monitoring Kekurangan dalam Melakukan Penilaian...', currentValue: '(3/3)', icon: '⚡' },
      { id: 24, title: 'LHKPN & LHKASN', value: 100.0, maxValue: 100, unit: '%', status: 'good', progress: 100.0, isRealtime: true, subtitle: 'Monitoring Pelaporan Kekayaan', currentValue: '(0/-5)', icon: '💼' },
      { id: 25, title: 'Kumdis', value: 100.0, maxValue: 100, unit: '%', status: 'good', progress: 100.0, isRealtime: true, subtitle: 'Monitoring Data Hukuman Disiplin', currentValue: '(0/-5)', icon: '⚠️' },
      { id: 26, title: 'LHP oleh Hawasbid', value: 100.0, maxValue: 100, unit: '%', status: 'good', progress: 100.0, isRealtime: true, subtitle: 'Monitoring Data Pengawasan oleh Hawasbid', currentValue: '(3/3)', icon: '🔍' }
    ];
    
    setMonitoringData(mockData);
  };

  const handleLogoClick = () => {
    setAdminClickCount(prev => prev + 1);
    
    // Reset counter after 2 seconds if not completed
    setTimeout(() => {
      setAdminClickCount(0);
    }, 2000);
    
    // Redirect to admin after 5 clicks
    if (adminClickCount >= 4) {
      window.location.href = '/admin/login';
    }
  };

  const page1Data = monitoringData.slice(0, 12);
  const page2Data = monitoringData.slice(12, 26);
  
  const totalSystems = monitoringData.length;
  const overallPercentage = Math.round(monitoringData.reduce((acc, item) => acc + item.progress, 0) / totalSystems);
  const notMaximalCount = monitoringData.filter(item => item.progress < 80).length;
  const criticalCount = monitoringData.filter(item => item.status === 'critical').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100'; 
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const renderMonitoringCard = (item: MonitoringData) => (
    <div key={item.id} className={`
      bg-white rounded-xl shadow-sm border-2 p-4 card-hover slide-in relative overflow-hidden
      ${item.status === 'good' ? 'border-green-200 bg-gradient-to-br from-green-50 to-white' : 
        item.status === 'warning' ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-white' : 
        'border-red-200 bg-gradient-to-br from-red-50 to-white'}
    `}>
      {/* Header with Icon and Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{item.icon}</span>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              item.status === 'good' ? 'bg-green-500' : 
              item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <h3 className="text-sm font-bold text-gray-800">{item.title}</h3>
          </div>
        </div>
        {item.isRealtime && (
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full pulse-animation"></div>
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className="mb-3">
        <div className="flex items-baseline space-x-1">
          <span className={`text-2xl font-bold ${
            item.status === 'good' ? 'text-green-600' : 
            item.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {item.value}%
          </span>
          <span className="text-xs text-gray-500">{item.currentValue}</span>
        </div>
      </div>

      {/* Subtitle */}
      <div className="mb-3">
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
          {item.subtitle}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(item.status)}`}
            style={{ width: `${item.progress}%` }}
          ></div>
        </div>
      </div>

    </div>
  );


  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Auto-Slide Progress Bar */}
      {settings.auto_slide_enabled && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-75 ease-linear"
            style={{ width: `${slideProgress}%` }}
          ></div>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="w-full px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 cursor-pointer transition-transform hover:scale-105 relative"
                onClick={handleLogoClick}
                title={adminClickCount > 0 ? `Admin Access: ${adminClickCount}/5 clicks` : ''}
              >
                <img 
                  src="https://pa-salatiga.go.id/wp-content/uploads/2024/11/logo-pa-salatiga.webp" 
                  alt="Smartvinesa PA Salatiga"
                  className="w-full h-full object-contain"
                />
                {adminClickCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {adminClickCount}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{settings.app_name}</h1>
                <p className="text-xs sm:text-sm text-gray-600">{settings.app_description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Page Navigation Links */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 border">
                <button 
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    currentPage === 1 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                  }`}
                  onClick={() => {
                    setCurrentPage(1);
                    setSlideProgress(0);
                  }}
                >
                  Sistem Utama
                </button>
                <button 
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    currentPage === 2 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                  }`}
                  onClick={() => {
                    setCurrentPage(2);
                    setSlideProgress(0);
                  }}
                >
                  Sistem Pendukung
                </button>
              </div>
              
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm text-gray-500">Last Updated</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-800">
                  {lastUpdate.toLocaleTimeString('id-ID')}
                </p>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full pulse-animation"></div>
              
              {/* Hidden admin access - double click on logo */}
              <div className="hidden">
                <a href="/admin/login" className="opacity-0">Admin</a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 card-hover slide-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Sistem</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{totalSystems}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 card-hover slide-in cursor-pointer" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Persentase Hasil</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{overallPercentage}%</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 card-hover slide-in cursor-pointer" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Belum Maksimal</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600">{notMaximalCount}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 card-hover slide-in cursor-pointer" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Kritis</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">{criticalCount}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Monitoring Grid - Page 1 */}
        <div className={`monitoring-page ${currentPage !== 1 ? 'hidden' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 items-start">
            {page1Data.map(renderMonitoringCard)}
          </div>
        </div>
        
        {/* Monitoring Grid - Page 2 */}
        <div className={`monitoring-page ${currentPage !== 2 ? 'hidden' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 items-start">
            {page2Data.map(renderMonitoringCard)}
          </div>
        </div>
        
      </main>

    </div>
  );
}