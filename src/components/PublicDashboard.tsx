'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

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

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border-2 p-4 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
          <div className="w-20 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="w-4 h-4 bg-gray-200 rounded"></div>
    </div>
    <div className="mb-3">
      <div className="w-16 h-8 bg-gray-200 rounded mb-1"></div>
      <div className="w-12 h-3 bg-gray-200 rounded"></div>
    </div>
    <div className="mb-3">
      <div className="w-full h-8 bg-gray-200 rounded"></div>
    </div>
    <div className="w-full h-2.5 bg-gray-200 rounded-full"></div>
  </div>
);

// Constants
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_SETTINGS: AppSettings = {
  app_name: 'Smartvinesa v.13',
  institution_name: 'PA Salatiga',
  app_description: 'Smart View Kinerja Satker PA Salatiga',
  update_interval: 5,
  slide_duration: 5,
  notification_email: '',
  auto_update_enabled: true,
  email_notifications_enabled: true,
  auto_slide_enabled: true
};

export default function PublicDashboard() {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [slideProgress, setSlideProgress] = useState(0);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSystem, setSelectedSystem] = useState<MonitoringData | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [systemDetailData, setSystemDetailData] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [dataCache, setDataCache] = useState<Map<number, { data: any[], timestamp: number }>>(new Map());
  const [showModal, setShowModal] = useState(false);

  // Move function definitions first
  // Optimized functions with useCallback
  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  const loadMonitoringData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load monitoring configs
      const configResponse = await fetch('/api/monitoring-configs');
      
      if (!configResponse.ok) {
        throw new Error(`Config API error: ${configResponse.status}`);
      }
      
      const configs = await configResponse.json();
      
      if (!Array.isArray(configs)) {
        throw new Error('Invalid config response format');
      }

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
          
          // Parse values from database strings with NaN protection
          const currentValue = !isNaN(parseFloat(latestData.current_value)) ? parseFloat(latestData.current_value) : 0;
          const maxValue = !isNaN(parseFloat(config.max_value)) && parseFloat(config.max_value) > 0 ? parseFloat(config.max_value) : 100;
          const percentage = Math.min(Math.max((currentValue / maxValue) * 100, 0), 100); // Clamp between 0-100
          
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
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const initializeData = async () => {
      await loadSettings();
      await loadMonitoringData();
    };
    
    initializeData();
  }, [loadSettings, loadMonitoringData]);

  // Auto-refresh data based on settings
  useEffect(() => {
    if (!settings.auto_update_enabled) return;
    
    const updateInterval = setInterval(() => {
      loadMonitoringData();
      setLastUpdate(new Date());
    }, settings.update_interval * 60 * 1000);

    return () => clearInterval(updateInterval);
  }, [settings.auto_update_enabled, settings.update_interval]);

  // Preload data for page 1 systems to improve modal performance
  useEffect(() => {
    if (monitoringData.length > 0 && !isLoading) {
      const preloadSystems = async () => {
        // Get first 6 real systems (ID < 1000) from page 1 for preloading
        const page1RealSystems = monitoringData.slice(0, 12).filter(item => item.id < 1000).slice(0, 6);
        
        for (const system of page1RealSystems) {
          const cacheKey = system.id;
          const cached = dataCache.get(cacheKey);
          const cacheValidDuration = 5 * 60 * 1000; // 5 minutes
          
          // Only preload if not cached or cache is old
          if (!cached || (Date.now() - cached.timestamp >= cacheValidDuration)) {
            try {
              const response = await fetch(`/api/monitoring-data?monitoring_id=${system.id}`);
              if (response.ok) {
                const data = await response.json();
                const sortedData = data.sort((a: any, b: any) => {
                  if (a.year !== b.year) return a.year - b.year;
                  return a.quarter - b.quarter;
                });
                
                const last7Data = sortedData.slice(-7);
                
                // Cache the preloaded data
                const newCache = new Map(dataCache);
                newCache.set(cacheKey, {
                  data: last7Data,
                  timestamp: Date.now()
                });
                setDataCache(newCache);
              }
            } catch (error) {
              console.warn(`Failed to preload data for system ${system.title}:`, error);
            }
            
            // Add small delay between requests to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      };
      
      // Start preloading after a short delay to not interfere with initial loading
      setTimeout(preloadSystems, 2000);
    }
  }, [monitoringData, isLoading, dataCache]);

  // Clean up old cache entries every 10 minutes
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const cacheValidDuration = 5 * 60 * 1000; // 5 minutes
      const newCache = new Map();
      
      for (const [key, value] of dataCache.entries()) {
        if (Date.now() - value.timestamp < cacheValidDuration) {
          newCache.set(key, value);
        }
      }
      
      if (newCache.size !== dataCache.size) {
        setDataCache(newCache);
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(cleanupInterval);
  }, [dataCache]);

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

  const loadSystemDetailData = useCallback(async (systemId: number) => {
    setModalLoading(true);
    
    // Check cache first
    const cacheKey = systemId;
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      setSystemDetailData(cached.data);
      setModalLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/monitoring-data?monitoring_id=${systemId}`);
      if (response.ok) {
        const data = await response.json();
        // Get last 7 data points for chart (approximately 7 quarters)
        const sortedData = data.sort((a: any, b: any) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.quarter - b.quarter;
        });
        
        const last7Data = sortedData.slice(-7);
        
        // Cache the data
        const newCache = new Map(dataCache);
        newCache.set(cacheKey, {
          data: last7Data,
          timestamp: Date.now()
        });
        setDataCache(newCache);
        
        setSystemDetailData(last7Data);
      } else {
        console.error('Failed to load system detail data');
        setSystemDetailData([]);
      }
    } catch (error) {
      console.error('Error loading system detail data:', error);
      setSystemDetailData([]);
    } finally {
      setModalLoading(false);
    }
  }, [dataCache]);

  const handleCardClick = useCallback(async (item: MonitoringData) => {
    setSelectedSystem(item);
    setShowModal(true);
    
    // Load detail data for real systems (not hardcoded ones)
    if (item.id < 1000) {
      await loadSystemDetailData(item.id);
    } else {
      // For hardcoded systems, create mock trend data
      const mockData = Array.from({ length: 7 }, (_, index) => ({
        year: 2025,
        quarter: Math.max(1, (index % 4) + 1),
        current_value: Math.max(item.value + ((index % 3) - 1) * 2, 0), // Ensure no negative values
        percentage: Math.max(item.value + ((index % 3) - 1) * 2, 0)
      }));
      setSystemDetailData(mockData);
      setModalLoading(false);
    }
  }, [loadSystemDetailData]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setTimeout(() => {
      setSelectedSystem(null);
      setSystemDetailData([]);
    }, 300); // Wait for animation to complete
  }, []);

  const getTrendInfo = useCallback((data: any[]) => {
    if (data.length < 2) return { trend: 'Stabil', color: 'text-gray-600' };
    
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    
    const latestValue = !isNaN(parseFloat(latest.current_value)) ? parseFloat(latest.current_value) : (latest.percentage || 0);
    const previousValue = !isNaN(parseFloat(previous.current_value)) ? parseFloat(previous.current_value) : (previous.percentage || 0);
    
    if (latestValue > previousValue) {
      return { trend: 'Naik', color: 'text-green-600' };
    } else if (latestValue < previousValue) {
      return { trend: 'Turun', color: 'text-red-600' };
    } else {
      return { trend: 'Stabil', color: 'text-gray-600' };
    }
  }, []);

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

  // Memoized computations for better performance
  const { page1Data, page2Data, totalSystems, overallPercentage, notMaximalCount, criticalCount } = useMemo(() => {
    const page1 = monitoringData.slice(0, 12);
    const page2 = monitoringData.slice(12, 26);
    const total = monitoringData.length;
    const overall = total > 0 ? Math.round(monitoringData.reduce((acc, item) => acc + (isNaN(item.progress) ? 0 : item.progress), 0) / total) : 0;
    const notMaximal = monitoringData.filter(item => item.progress < 80).length;
    const critical = monitoringData.filter(item => item.status === 'critical').length;
    
    return {
      page1Data: page1,
      page2Data: page2,
      totalSystems: total,
      overallPercentage: overall,
      notMaximalCount: notMaximal,
      criticalCount: critical
    };
  }, [monitoringData]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100'; 
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  const getProgressColor = useCallback((status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const renderMonitoringCard = useCallback((item: MonitoringData) => (
    <div 
      key={item.id} 
      className={`
        bg-white rounded-xl shadow-sm border-2 p-4 card-hover slide-in relative overflow-hidden cursor-pointer transition-all duration-200
        ${item.status === 'good' ? 'border-green-200 bg-gradient-to-br from-green-50 to-white hover:border-green-300 hover:shadow-md' : 
          item.status === 'warning' ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-white hover:border-yellow-300 hover:shadow-md' : 
          'border-red-200 bg-gradient-to-br from-red-50 to-white hover:border-red-300 hover:shadow-md'}
      `}
      onClick={() => handleCardClick(item)}
      title="Klik untuk melihat detail"
    >
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
            {isNaN(item.value) ? '0' : item.value.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-500">{item.currentValue || '(0/0)'}</span>
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
            style={{ width: `${isNaN(item.progress) ? 0 : Math.min(Math.max(item.progress, 0), 100)}%` }}
          ></div>
        </div>
      </div>

    </div>
  ), [handleCardClick, getProgressColor]);


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
                  {isMounted ? lastUpdate.toLocaleTimeString('id-ID') : '--:--:--'}
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

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 items-start">
            {Array.from({ length: 12 }).map((_, index) => (
              <LoadingSkeleton key={index} />
            ))}
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

      {/* System Detail Modal */}
      {selectedSystem && (
        <div className="fixed inset-0 z-40 modal-backdrop flex items-center justify-center p-4" onClick={closeModal}>
          <div 
            className={`bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 transform transition-all duration-300 ${
              showModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-3">{selectedSystem.icon}</span>
                  {selectedSystem.title}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {modalLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-gray-200 rounded w-18"></div>
                        <div className="h-3 bg-gray-200 rounded w-14"></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-full mt-6">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="h-48 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Performance Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Informasi Kinerja</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Nilai Saat Ini:</span>
                        <span className="text-sm font-medium">
                          {selectedSystem.id < 1000 && systemDetailData.length > 0 
                            ? `${parseFloat(systemDetailData[systemDetailData.length - 1]?.current_value || '0').toFixed(2)}` 
                            : selectedSystem.value.toFixed(2)
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Nilai Maksimal:</span>
                        <span className="text-sm font-medium">
                          {selectedSystem.id < 1000 ? '12' : selectedSystem.maxValue} {selectedSystem.id < 1000 ? 'poin' : selectedSystem.unit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Persentase:</span>
                        <span className={`text-sm font-medium ${
                          selectedSystem.status === 'good' ? 'text-green-600' : 
                          selectedSystem.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {selectedSystem.value.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* System Status */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Status Sistem</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          selectedSystem.status === 'good' ? 'bg-green-100 text-green-700' :
                          selectedSystem.status === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {selectedSystem.status === 'good' ? 'Baik' : 
                           selectedSystem.status === 'warning' ? 'Peringatan' : 'Kritis'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Trend:</span>
                        <span className={`text-sm font-medium ${getTrendInfo(systemDetailData).color}`}>
                          {getTrendInfo(systemDetailData).trend}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Last Update:</span>
                        <span className="text-sm font-medium">
                          {isMounted ? `${lastUpdate.toLocaleDateString('id-ID')} ${lastUpdate.toLocaleTimeString('id-ID', { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit' 
                          })}` : 'Loading...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Chart */}
              {!modalLoading && systemDetailData.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Grafik Performa 7 Hari Terakhir</h3>
                  <div className="bg-white p-4 rounded-lg border">
                    <svg width="100%" height="200" viewBox="0 0 800 200" className="overflow-visible">
                      {/* Grid lines */}
                      {[0, 20, 40, 60, 80, 100].map(value => {
                        const y = 20 + ((100 - value) * 1.6);
                        return (
                          <g key={value}>
                            <line 
                              x1="50" 
                              y1={y} 
                              x2="750" 
                              y2={y} 
                              stroke="#e5e7eb" 
                              strokeWidth="1"
                            />
                            <text 
                              x="40" 
                              y={y + 4} 
                              fontSize="12" 
                              fill="#64748b" 
                              textAnchor="end"
                            >
                              {value}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* X-axis labels */}
                      {systemDetailData.map((data, index) => {
                        const x = 50 + (index * (700 / Math.max(systemDetailData.length - 1, 1)));
                        return (
                          <text 
                            key={index}
                            x={x} 
                            y="190" 
                            fontSize="12" 
                            fill="#64748b" 
                            textAnchor="middle"
                          >
                            T{data.quarter}
                          </text>
                        );
                      })}
                      
                      {/* Chart Line */}
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        points={systemDetailData.map((data, index) => {
                          const percentage = selectedSystem.id < 1000 
                            ? (parseFloat(data.current_value) / 12) * 100 
                            : data.percentage || selectedSystem.value;
                          const x = 50 + (index * (700 / Math.max(systemDetailData.length - 1, 1)));
                          const y = 20 + ((100 - percentage) * 1.6);
                          return `${x},${y}`;
                        }).join(' ')}
                      />
                      
                      {/* Data Points */}
                      {systemDetailData.map((data, index) => {
                        const percentage = selectedSystem.id < 1000 
                          ? (parseFloat(data.current_value) / 12) * 100 
                          : data.percentage || selectedSystem.value;
                        const x = 50 + (index * (700 / Math.max(systemDetailData.length - 1, 1)));
                        const y = 20 + ((100 - percentage) * 1.6);
                        
                        return (
                          <g key={index}>
                            <circle
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#3b82f6"
                              stroke="white"
                              strokeWidth="2"
                            />
                            <title>{`${data.year} T${data.quarter}: ${percentage.toFixed(1)}%`}</title>
                          </g>
                        );
                      })}
                    </svg>
                    
                    <div className="mt-4 flex items-center justify-center">
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <div className="w-3 h-0.5 bg-blue-500"></div>
                        <span>Persentase Capaian (%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}