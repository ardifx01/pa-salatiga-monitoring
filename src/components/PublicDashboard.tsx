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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      await loadSettings();
      await loadMonitoringData();
    };
    
    initializeData();
  }, []);

  // Auto-refresh data based on settings
  useEffect(() => {
    if (!settings.auto_update_enabled) return;
    
    const updateInterval = setInterval(() => {
      console.log('Auto-refreshing monitoring data...');
      loadMonitoringData();
      setLastUpdate(new Date());
    }, settings.update_interval * 60 * 1000);

    return () => clearInterval(updateInterval);
  }, [settings.auto_update_enabled, settings.update_interval]);

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

  const loadMonitoringData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading real monitoring data from database...');
      
      // Load monitoring configs
      const configResponse = await fetch('/api/monitoring-configs');
      
      if (!configResponse.ok) {
        console.error('Failed to fetch monitoring configs:', configResponse.status, configResponse.statusText);
        throw new Error(`Config API error: ${configResponse.status}`);
      }
      
      const configs = await configResponse.json();
      
      if (!Array.isArray(configs)) {
        console.error('Monitoring configs is not an array:', configs);
        throw new Error('Invalid config response format');
      }
      
      console.log(`Loaded ${configs.length} monitoring configs`);
      console.log('Sample configs:', configs.slice(0, 2).map(c => ({ id: c.id, name: c.monitoring_name })));
      
      // Load monitoring data for each config
      const monitoringDataPromises = configs.map(async (config) => {
        try {
          const dataResponse = await fetch(`/api/monitoring-data?monitoring_id=${config.id}`);
          const data = await dataResponse.json();
          
          if (!dataResponse.ok || !Array.isArray(data)) {
            console.warn(`No data found for system ${config.monitoring_name}`);
            return null;
          }
          
          // Get the latest data entry (most recent quarter)
          const sortedData = data.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.quarter - a.quarter;
          });
          
          const latestData = sortedData[0];
          
          if (!latestData) {
            console.warn(`No latest data found for system ${config.monitoring_name}`);
            return null;
          }
          
          // Parse values from database strings
          const currentValue = parseFloat(latestData.current_value) || 0;
          const maxValue = parseFloat(config.max_value) || 100;
          const percentage = maxValue > 0 ? (currentValue / maxValue) * 100 : 0;
          
          // Determine status based on percentage
          let status: 'good' | 'warning' | 'critical';
          if (percentage >= 80) {
            status = 'good';
          } else if (percentage >= 50) {
            status = 'warning';
          } else {
            status = 'critical';
          }
          
          // Create monitoring data item
          const monitoringItem: MonitoringData = {
            id: config.id,
            title: config.monitoring_name,
            value: percentage,
            maxValue: 100, // Display as percentage
            unit: '%',
            status: status,
            progress: percentage,
            isRealtime: config.is_realtime === 1,
            subtitle: config.monitoring_description,
            currentValue: `(${currentValue}/${maxValue})`,
            icon: config.icon
          };
          
          return monitoringItem;
          
        } catch (error) {
          console.error(`Error loading data for ${config.monitoring_name}:`, error);
          return null;
        }
      });
      
      // Wait for all data to load
      const results = await Promise.all(monitoringDataPromises);
      
      // Filter out null results and sort by display order
      const validData = results
        .filter((item): item is MonitoringData => item !== null)
        .sort((a, b) => {
          const configA = configs.find(c => c.id === a.id);
          const configB = configs.find(c => c.id === b.id);
          
          // Sort by page_number first, then display_order
          if (configA?.page_number !== configB?.page_number) {
            return (configA?.page_number || 0) - (configB?.page_number || 0);
          }
          return (configA?.display_order || 0) - (configB?.display_order || 0);
        });
      
      // Add hardcoded systems that are not in database (SIPP, Mediasi, Banding, Kasasi & PK)
      const hardcodedSystems: MonitoringData[] = [
        { id: 1000, title: 'SIPP', value: 97.5, maxValue: 100, unit: '%', status: 'good', progress: 97.5, isRealtime: true, subtitle: 'Sistem Informasi Penelusuran Perkara', currentValue: '(11.7/12)', icon: '⚖️' },
        { id: 1001, title: 'Mediasi', value: 39.1, maxValue: 100, unit: '%', status: 'critical', progress: 39.1, isRealtime: true, subtitle: 'Tingkat keberhasilan Mediasi', currentValue: '(3.13/8)', icon: '🤝' },
        { id: 1002, title: 'Banding', value: 60.0, maxValue: 100, unit: '%', status: 'critical', progress: 60.0, isRealtime: true, subtitle: 'Kecepatan Administrasi Banding', currentValue: '(1.2/2)', icon: '✈️' },
        { id: 1003, title: 'Kasasi & PK', value: 60.0, maxValue: 100, unit: '%', status: 'critical', progress: 60.0, isRealtime: true, subtitle: 'Kecepatan Administrasi Kasasi', currentValue: '(1.2/2)', icon: '💼' }
      ];
      
      // Separate page 1 and page 2 systems from database
      const page1Systems = validData.filter(item => {
        const config = configs.find(c => c.id === item.id);
        return config?.page_number === 1;
      });
      
      const page2Systems = validData.filter(item => {
        const config = configs.find(c => c.id === item.id);
        return config?.page_number === 2;
      });
      
      // Build final data array with proper ordering
      const finalData: MonitoringData[] = [
        // Page 1 - Sistem Utama
        hardcodedSystems[0], // SIPP (position 1)
        hardcodedSystems[1], // Mediasi (position 2)
        ...page1Systems.slice(0, 2), // E-Court, Gugatan Mandiri (positions 3-4)
        hardcodedSystems[2], // Banding (position 5) 
        hardcodedSystems[3], // Kasasi & PK (position 6)
        ...page1Systems.slice(2), // Rest of page 1 systems (positions 7+)
        
        // Page 2 - Sistem Pendukung
        ...page2Systems
      ];
      
      console.log(`Loaded ${validData.length} real systems + ${hardcodedSystems.length} hardcoded = ${finalData.length} total systems`);
      console.log('Page 1 systems:', finalData.slice(0, 12).map(s => s.title));
      console.log('Page 2 systems:', finalData.slice(12).map(s => s.title));
      
      setMonitoringData(finalData);
      
    } catch (error) {
      console.error('Error loading monitoring data:', error);
      
      // Fallback to basic mock data on error
      const fallbackData: MonitoringData[] = [
        { id: 1, title: 'Sistem Error', value: 0, maxValue: 100, unit: '%', status: 'critical', progress: 0, isRealtime: false, subtitle: 'Gagal memuat data dari database', currentValue: '(0/0)', icon: '❌' }
      ];
      
      setMonitoringData(fallbackData);
    } finally {
      setIsLoading(false);
    }
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Memuat data monitoring...</p>
            </div>
          </div>
        )}

        {/* Monitoring Grid - Page 1 */}
        {!isLoading && (
          <div className={`monitoring-page ${currentPage !== 1 ? 'hidden' : ''}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 items-start">
              {page1Data.map(renderMonitoringCard)}
            </div>
          </div>
        )}
        
        {/* Monitoring Grid - Page 2 */}
        {!isLoading && (
          <div className={`monitoring-page ${currentPage !== 2 ? 'hidden' : ''}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 items-start">
              {page2Data.map(renderMonitoringCard)}
            </div>
          </div>
        )}
        
      </main>

    </div>
  );
}