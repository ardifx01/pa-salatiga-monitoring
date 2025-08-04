'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToastContext } from '@/context/ToastContext';

interface AdminPanelProps {
  onBack?: () => void;
}

interface MonitoringData {
  id: number;
  title: string;
  value: number;
  maxValue: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  progress: number;
  isRealtime: boolean;
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

interface MonitoringConfig {
  id: number;
  monitoring_key: string;
  monitoring_name: string;
  monitoring_description: string;
  max_value: number;
  unit: string;
  icon: string;
  page_number: number;
  display_order: number;
  is_active: boolean;
  is_realtime: boolean;
}

interface MonitoringDataEntry {
  id?: number;
  monitoring_id: number;
  monitoring_name?: string;
  year: number;
  quarter: number;
  current_value: number;
  target_value: number;
  percentage: number;
  monitoring_key?: string;
  config_max_value?: number;
  unit?: string;
  icon?: string;
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { success, error } = useToastContext();
  const [activeTab, setActiveTab] = useState('systems');
  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
  const [editingItem, setEditingItem] = useState<MonitoringData | null>(null);
  const [monitoringConfigs, setMonitoringConfigs] = useState<MonitoringConfig[]>([]);
  const [monitoringDataEntries, setMonitoringDataEntries] = useState<MonitoringDataEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [editingConfig, setEditingConfig] = useState<MonitoringConfig | null>(null);
  const [editingDataEntry, setEditingDataEntry] = useState<MonitoringDataEntry | null>(null);
  const [managingSystemId, setManagingSystemId] = useState<number | null>(null);
  const [managingSystemData, setManagingSystemData] = useState<MonitoringDataEntry[]>([]);
  const [selectedManageYear, setSelectedManageYear] = useState(new Date().getFullYear());
  const [manageModalTab, setManageModalTab] = useState<'data' | 'analytics'>('data');
  const [analyticsViewType, setAnalyticsViewType] = useState<'yearly' | 'all'>('yearly');
  const [selectedAnalyticsYear, setSelectedAnalyticsYear] = useState(new Date().getFullYear());
  const [chartData, setChartData] = useState<MonitoringDataEntry[]>([]);
  const [selectedChartSystem, setSelectedChartSystem] = useState<number | null>(null);
  const [chartViewType, setChartViewType] = useState<'yearly' | 'all'>('yearly');
  const [selectedChartYear, setSelectedChartYear] = useState(new Date().getFullYear());
  const [settings, setSettings] = useState<AppSettings>({
    app_name: '',
    institution_name: '',
    app_description: '',
    update_interval: 5,
    slide_duration: 5,
    notification_email: '',
    auto_update_enabled: true,
    email_notifications_enabled: true,
    auto_slide_enabled: true
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  useEffect(() => {
    loadSettings();
    loadMonitoringData();
    loadMonitoringConfigs();
    loadMonitoringDataEntries();
  }, []);

  useEffect(() => {
    if (activeTab === 'data-input') {
      loadMonitoringDataEntries();
    }
  }, [activeTab, selectedYear, selectedQuarter]);

  useEffect(() => {
    if (managingSystemId) {
      loadSystemData(managingSystemId, selectedManageYear);
    }
  }, [selectedManageYear, managingSystemId]);

  // Load data for analytics tab independently
  useEffect(() => {
    if (managingSystemId && manageModalTab === 'analytics') {
      // Load all data for the system when in analytics mode
      loadAllSystemData(managingSystemId);
    }
  }, [managingSystemId, manageModalTab]);

  // Set default analytics year when data is loaded
  useEffect(() => {
    if (managingSystemData.length > 0 && manageModalTab === 'analytics') {
      const availableYears = Array.from(new Set(managingSystemData.map(d => d.year))).sort((a, b) => b - a);
      if (availableYears.length > 0 && !availableYears.includes(selectedAnalyticsYear)) {
        setSelectedAnalyticsYear(availableYears[0]); // Set to most recent year
      }
    }
  }, [managingSystemData, manageModalTab]);

  useEffect(() => {
    if (activeTab === 'charts') {
      loadChartData();
    }
  }, [activeTab, selectedChartSystem, chartViewType, selectedChartYear]);

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
    try {
      const response = await fetch('/api/monitoring');
      if (response.ok) {
        const data = await response.json();
        // Convert database data to component format
        const formattedData = data.map((item: any) => ({
          id: item.id,
          title: item.name,
          value: Math.floor(Math.random() * 100), // Mock value for now
          maxValue: 100,
          unit: '%',
          status: item.status === 'active' ? 'good' : item.status === 'warning' ? 'warning' : 'critical',
          progress: Math.floor(Math.random() * 100),
          isRealtime: Math.random() > 0.3
        }));
        setMonitoringData(formattedData);
      }
    } catch (error) {
      console.error('Error loading monitoring data:', error);
      // Fallback to mock data
      const mockData: MonitoringData[] = [
        { id: 1, title: 'Kehadiran Pegawai', value: 85, maxValue: 100, unit: '%', status: 'good', progress: 85, isRealtime: true },
        { id: 2, title: 'Penyelesaian Perkara', value: 72, maxValue: 100, unit: '%', status: 'warning', progress: 72, isRealtime: true },
        { id: 3, title: 'Kepuasan Layanan', value: 90, maxValue: 100, unit: '%', status: 'good', progress: 90, isRealtime: false },
        { id: 4, title: 'Anggaran Terserap', value: 45, maxValue: 100, unit: '%', status: 'critical', progress: 45, isRealtime: true },
        { id: 5, title: 'Target Mediasi', value: 88, maxValue: 100, unit: '%', status: 'good', progress: 88, isRealtime: true },
        { id: 6, title: 'Kualitas Putusan', value: 65, maxValue: 100, unit: '%', status: 'warning', progress: 65, isRealtime: false },
      ];
      setMonitoringData(mockData);
    }
  };

  const loadMonitoringConfigs = async () => {
    try {
      console.log('Loading monitoring configs...'); // Debug log
      const response = await fetch('/api/monitoring-configs');
      const data = await response.json();
      console.log('Monitoring configs response:', data); // Debug log
      
      if (response.ok) {
        setMonitoringConfigs(data);
      } else {
        console.error('Failed to load monitoring configs:', data);
        error('Gagal memuat konfigurasi monitoring');
      }
    } catch (error) {
      console.error('Error loading monitoring configs:', error);
      error('Gagal memuat konfigurasi monitoring');
    }
  };

  const loadMonitoringDataEntries = async () => {
    try {
      console.log(`Loading monitoring data for ${selectedYear} Q${selectedQuarter}...`); // Debug log
      const response = await fetch(`/api/monitoring-data?year=${selectedYear}&quarter=${selectedQuarter}`);
      const data = await response.json();
      console.log('Monitoring data response:', data); // Debug log
      
      if (response.ok) {
        setMonitoringDataEntries(data);
      } else {
        console.error('Failed to load monitoring data:', data);
        error('Gagal memuat data monitoring');
      }
    } catch (error) {
      console.error('Error loading monitoring data entries:', error);
      error('Gagal memuat data monitoring');
    }
  };

  const saveMonitoringConfig = async (config: MonitoringConfig) => {
    try {
      const response = await fetch('/api/monitoring-configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        success('Konfigurasi monitoring berhasil disimpan!');
        loadMonitoringConfigs();
        setEditingConfig(null);
      } else {
        throw new Error('Failed to save monitoring config');
      }
    } catch (err) {
      console.error('Error saving monitoring config:', err);
      error('Gagal menyimpan konfigurasi monitoring!');
    }
  };

  const saveMonitoringDataEntry = async (dataEntry: MonitoringDataEntry) => {
    try {
      console.log('Saving data:', dataEntry); // Debug log
      
      // Check for duplicate data if it's a new entry (no ID)
      if (!dataEntry.id) {
        const existingData = managingSystemData.find(d => 
          d.year === dataEntry.year && d.quarter === dataEntry.quarter
        );
        
        if (existingData) {
          error(`Data untuk Triwulan ${dataEntry.quarter} tahun ${dataEntry.year} sudah ada!`);
          return;
        }
      }
      
      // Get the target value from the config
      const config = monitoringConfigs.find(c => c.id === dataEntry.monitoring_id);
      const targetValue = config ? config.max_value : dataEntry.target_value;
      
      const response = await fetch('/api/monitoring-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monitoring_id: dataEntry.monitoring_id,
          year: dataEntry.year,
          quarter: dataEntry.quarter,
          current_value: dataEntry.current_value,
          target_value: targetValue
        }),
      });

      const result = await response.json();
      console.log('Save result:', result); // Debug log

      if (response.ok) {
        success('Data monitoring berhasil disimpan!');
        // Update the selected period to match what was saved
        setSelectedYear(dataEntry.year);
        setSelectedQuarter(dataEntry.quarter);
        loadMonitoringDataEntries();
        
        // Reload manage modal data if it's open
        if (managingSystemId) {
          loadSystemData(managingSystemId, selectedManageYear);
        }
        
        setEditingDataEntry(null);
      } else {
        throw new Error(result.error || 'Failed to save monitoring data');
      }
    } catch (err) {
      console.error('Error saving monitoring data:', err);
      error(`Gagal menyimpan data monitoring: ${err.message}`);
    }
  };

  const loadAllSystemData = async (systemId: number) => {
    try {
      console.log(`Loading all system data for system ${systemId}...`);
      const response = await fetch(`/api/monitoring-data?monitoring_id=${systemId}`);
      const data = await response.json();
      console.log('All system data response:', data);
      
      if (response.ok) {
        setManagingSystemData(data);
      } else {
        console.error('Failed to load all system data:', data);
        error('Gagal memuat data sistem');
      }
    } catch (error) {
      console.error('Error loading all system data:', error);
      error('Gagal memuat data sistem');
    }
  };

  const loadSystemData = async (systemId: number, year: number) => {
    try {
      console.log(`Loading system data for ID ${systemId}, year ${year}`);
      const response = await fetch(`/api/monitoring-data?monitoring_id=${systemId}&year=${year}`);
      const data = await response.json();
      console.log('System data response:', data);
      
      if (response.ok) {
        setManagingSystemData(data);
      } else {
        console.error('Failed to load system data:', data);
        error('Gagal memuat data sistem');
      }
    } catch (error) {
      console.error('Error loading system data:', error);
      error('Gagal memuat data sistem');
    }
  };

  const deleteDataEntry = async (entryId: number) => {
    try {
      const response = await fetch(`/api/monitoring-data/${entryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        success('Data berhasil dihapus!');
        // Reload data for the managing system
        if (managingSystemId) {
          loadSystemData(managingSystemId, selectedManageYear);
        }
      } else {
        throw new Error('Failed to delete data');
      }
    } catch (err) {
      console.error('Error deleting data:', err);
      error('Gagal menghapus data!');
    }
  };

  const openManageModal = (systemId: number) => {
    setManagingSystemId(systemId);
    if (manageModalTab === 'analytics') {
      loadAllSystemData(systemId);
    } else {
      loadSystemData(systemId, selectedManageYear);
    }
  };

  const loadChartData = async () => {
    try {
      let url = '/api/monitoring-data?';
      
      if (selectedChartSystem) {
        url += `monitoring_id=${selectedChartSystem}&`;
      }
      
      if (chartViewType === 'yearly') {
        url += `year=${selectedChartYear}`;
      }
      
      console.log('Loading chart data:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setChartData(data);
      } else {
        console.error('Failed to load chart data:', data);
        error('Gagal memuat data grafik');
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
      error('Gagal memuat data grafik');
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    if (onBack) {
      onBack();
    } else {
      router.push('/');
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/');
    }
  };

  const saveSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        success('Pengaturan berhasil disimpan!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      error('Gagal menyimpan pengaturan!');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleEdit = (item: MonitoringData) => {
    setEditingItem({ ...item });
  };

  const handleSave = () => {
    if (editingItem) {
      setMonitoringData(prev => 
        prev.map(item => 
          item.id === editingItem.id ? {
            ...editingItem,
            progress: (editingItem.value / editingItem.maxValue) * 100,
            status: editingItem.value >= 80 ? 'good' : editingItem.value >= 60 ? 'warning' : 'critical'
          } : item
        )
      );
      setEditingItem(null);
      success('Data sistem berhasil diperbarui!');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100'; 
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusFromPercentage = (percentage: number) => {
    if (percentage >= 80) return { status: 'Baik', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 50) return { status: 'Peringatan', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { status: 'Kritis', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getTrendFromData = (data: MonitoringDataEntry[]) => {
    if (data.length < 2) return { trend: 'Stabil', color: 'text-gray-600' };
    
    const sortedData = [...data].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.quarter - b.quarter;
    });
    
    const latest = sortedData[sortedData.length - 1];
    const previous = sortedData[sortedData.length - 2];
    
    const config = monitoringConfigs.find(c => c.id === latest.monitoring_id);
    if (!config) return { trend: 'Stabil', color: 'text-gray-600' };
    
    const latestPerc = (latest.current_value / config.max_value) * 100;
    const prevPerc = (previous.current_value / config.max_value) * 100;
    
    if (latestPerc > prevPerc + 2) return { trend: 'Naik', color: 'text-green-600' };
    if (latestPerc < prevPerc - 2) return { trend: 'Turun', color: 'text-red-600' };
    return { trend: 'Stabil', color: 'text-gray-600' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Admin Header */}
      <header className="bg-gradient-to-r from-slate-600 to-gray-600 shadow-lg">
        <div className="w-full px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center p-1">
                <img 
                  src="/assets/images/logo-pa-salatiga.webp" 
                  alt="Logo PA Salatiga"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">Panel Administrator</h1>
                <p className="text-xs sm:text-sm text-gray-200">Kelola Data Monitoring Kinerja</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-white text-sm hidden sm:block">Admin: <strong>{session?.user?.name || 'Administrator'}</strong></span>
              <button 
                onClick={handleBack}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center space-x-2 shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                <span className="hidden sm:inline">Kembali</span>
              </button>
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center space-x-2 shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Admin Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button 
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'systems' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('systems')}
              >
                Kelola Sistem
              </button>
              <button 
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'data-input' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('data-input')}
              >
                Input Data
              </button>
              <button 
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'charts' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('charts')}
              >
                Grafik
              </button>
              <button 
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'reports' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('reports')}
              >
                Laporan
              </button>
              <button 
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'settings' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('settings')}
              >
                Pengaturan
              </button>
            </nav>
          </div>
        </div>

        {/* Systems Management - now shows Card Configuration */}
        {activeTab === 'systems' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Konfigurasi Card Monitoring</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sistem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai Maksimal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Halaman</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monitoringConfigs.map((config) => (
                    <tr key={config.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{config.monitoring_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={config.monitoring_description}>
                          {config.monitoring_description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{config.max_value}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{config.unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg">{config.icon}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {config.page_number === 1 ? 'Sistem Utama' : 'Sistem Pendukung'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => setEditingConfig({...config})}
                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 cursor-pointer p-2 rounded-lg transition-colors inline-flex items-center space-x-1"
                          title="Edit konfigurasi"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Data Input Tab */}
        {activeTab === 'data-input' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Input Data Monitoring</h2>
              <div className="flex space-x-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tahun</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {[2023, 2024, 2025].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Triwulan</label>
                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value={1}>Q1</option>
                    <option value={2}>Q2</option>
                    <option value={3}>Q3</option>
                    <option value={4}>Q4</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sistem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Persentase</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monitoringConfigs.map((config) => {
                    const dataEntry = monitoringDataEntries.find(entry => entry.monitoring_id === config.id);
                    return (
                      <tr key={config.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{config.icon}</span>
                            <div className="text-sm font-medium text-gray-900">{config.monitoring_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {dataEntry && dataEntry.current_value !== null ? `${dataEntry.current_value} ${config.unit}` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {dataEntry && dataEntry.current_value !== null && config.max_value ? 
                              `${((dataEntry.current_value / config.max_value) * 100).toFixed(1)}%` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => openManageModal(config.id)}
                            className="text-green-600 hover:text-green-900 cursor-pointer flex items-center space-x-1 hover:bg-green-50 px-2 py-1 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
                            </svg>
                            <span>Manage</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Grafik Data Monitoring</h2>
              
              <div className="flex space-x-4 items-center">
                {/* System Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sistem</label>
                  <select
                    value={selectedChartSystem || ''}
                    onChange={(e) => setSelectedChartSystem(e.target.value ? parseInt(e.target.value) : null)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Semua Sistem</option>
                    {monitoringConfigs.map(config => (
                      <option key={config.id} value={config.id}>{config.monitoring_name}</option>
                    ))}
                  </select>
                </div>

                {/* View Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tampilan</label>
                  <select
                    value={chartViewType}
                    onChange={(e) => setChartViewType(e.target.value as 'yearly' | 'all')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="yearly">Per Tahun</option>
                    <option value="all">Semua Data</option>
                  </select>
                </div>

                {/* Year Selection (only show when yearly view) */}
                {chartViewType === 'yearly' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tahun</label>
                    <select
                      value={selectedChartYear}
                      onChange={(e) => setSelectedChartYear(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {[2023, 2024, 2025, 2026].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Chart Content */}
            <div className="space-y-6">
              {selectedChartSystem ? (
                // Single System Chart
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {monitoringConfigs.find(c => c.id === selectedChartSystem)?.monitoring_name}
                  </h3>
                  
                  {chartData.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Line Chart Representation */}
                      <div className="bg-white p-6 rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-700 mb-4">Grafik Garis - Tren Performa</h4>
                        <div className="relative">
                          {/* Chart Container */}
                          <div className="relative h-64 w-full">
                            {/* Grid Lines and Labels */}
                            <svg className="absolute inset-0 w-full h-full">
                              {/* Grid lines */}
                              {[0, 20, 40, 60, 80, 100].map((value) => {
                                const y = 20 + ((100 - value) * 2.0); // Scale to match chart positioning
                                return (
                                  <g key={value}>
                                    <line 
                                      x1="40" 
                                      y1={y} 
                                      x2="95%" 
                                      y2={y} 
                                      stroke="#e2e8f0" 
                                      strokeWidth="1"
                                    />
                                    <text 
                                      x="30" 
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
                              {chartData.map((data, index) => {
                                const chartWidth = 400; // Available chart width
                                const x = 50 + (index * (chartWidth / Math.max(chartData.length - 1, 1)));
                                return (
                                  <text 
                                    key={index}
                                    x={x} 
                                    y="250" 
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
                                points={chartData.map((data, index) => {
                                  const config = monitoringConfigs.find(c => c.id === data.monitoring_id);
                                  const percentage = config ? (data.current_value / config.max_value) * 100 : 0;
                                  const chartWidth = 400;
                                  const x = 50 + (index * (chartWidth / Math.max(chartData.length - 1, 1)));
                                  const y = 20 + ((100 - percentage) * 2.0); // Invert Y axis, scale from 20 to 220
                                  return `${x},${y}`;
                                }).join(' ')}
                              />
                              
                              {/* Data Points */}
                              {chartData.map((data, index) => {
                                const config = monitoringConfigs.find(c => c.id === data.monitoring_id);
                                const percentage = config ? (data.current_value / config.max_value) * 100 : 0;
                                const chartWidth = 400;
                                const x = 50 + (index * (chartWidth / Math.max(chartData.length - 1, 1)));
                                const y = 20 + ((100 - percentage) * 2.0);
                                
                                return (
                                  <g key={index}>
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r="5"
                                      fill="#3b82f6"
                                      stroke="white"
                                      strokeWidth="2"
                                    />
                                    {/* Tooltip on hover */}
                                    <title>{`${data.year} T${data.quarter}: ${percentage.toFixed(1)}%`}</title>
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                          
                          {/* Chart Legend */}
                          <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-600">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-0.5 bg-blue-500"></div>
                              <span>Persentase Capaian</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Data Table */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Tabel Data</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="text-xs text-gray-500">
                                <th className="text-left py-2">Periode</th>
                                <th className="text-left py-2">Nilai</th>
                                <th className="text-left py-2">Target</th>
                                <th className="text-left py-2">%</th>
                              </tr>
                            </thead>
                            <tbody className="text-xs">
                              {chartData.map((data, index) => {
                                const config = monitoringConfigs.find(c => c.id === data.monitoring_id);
                                const percentage = config ? (data.current_value / config.max_value) * 100 : 0;
                                
                                return (
                                  <tr key={index} className="border-t border-gray-200">
                                    <td className="py-2">{data.year} T{data.quarter}</td>
                                    <td className="py-2">{data.current_value}</td>
                                    <td className="py-2">{config?.max_value}</td>
                                    <td className="py-2 font-medium">{percentage.toFixed(1)}%</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>Tidak ada data untuk ditampilkan</p>
                      <p className="text-sm">Pilih sistem dan periode yang memiliki data</p>
                    </div>
                  )}
                </div>
              ) : (
                // All Systems Overview
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Overview Semua Sistem</h3>
                  
                  {chartData.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {monitoringConfigs.map(config => {
                        const systemData = chartData.filter(d => d.monitoring_id === config.id);
                        
                        if (systemData.length === 0) return null;
                        
                        const avgPercentage = systemData.reduce((acc, data) => {
                          return acc + (data.current_value / config.max_value) * 100;
                        }, 0) / systemData.length;
                        
                        return (
                          <div key={config.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                                <span className="text-lg mr-2">{config.icon}</span>
                                {config.monitoring_name}
                              </h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                avgPercentage >= 80 ? 'bg-green-100 text-green-700' :
                                avgPercentage >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                              }`}>
                                Avg: {avgPercentage.toFixed(1)}%
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              {systemData.map((data, index) => {
                                const percentage = (data.current_value / config.max_value) * 100;
                                
                                return (
                                  <div key={index} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">{data.year} T{data.quarter}</span>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div 
                                          className={`h-2 rounded-full ${
                                            percentage >= 80 ? 'bg-green-500' : 
                                            percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                          }`}
                                          style={{ width: `${Math.min(percentage, 100)}%` }}
                                        ></div>
                                      </div>
                                      <span className="font-medium">{percentage.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>Tidak ada data untuk periode yang dipilih</p>
                      <p className="text-sm">Silakan pilih tahun yang memiliki data atau ubah filter</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Laporan Sistem</h2>
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Fitur laporan dalam pengembangan</h3>
              <p className="mt-1 text-sm text-gray-500">Laporan dan analitik akan tersedia segera.</p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Pengaturan Sistem</h2>
              <button
                onClick={saveSettings}
                disabled={isLoadingSettings}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
              >
                {isLoadingSettings ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Simpan Pengaturan
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Application Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Informasi Aplikasi</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Aplikasi</label>
                  <input
                    type="text"
                    value={settings.app_name}
                    onChange={(e) => setSettings({...settings, app_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan nama aplikasi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Instansi</label>
                  <input
                    type="text"
                    value={settings.institution_name}
                    onChange={(e) => setSettings({...settings, institution_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan nama instansi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Aplikasi</label>
                  <textarea
                    value={settings.app_description}
                    onChange={(e) => setSettings({...settings, app_description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan deskripsi aplikasi"
                  />
                </div>
              </div>

              {/* System Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Pengaturan Sistem</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interval Update (menit)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.update_interval}
                    onChange={(e) => setSettings({...settings, update_interval: parseInt(e.target.value) || 5})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durasi Slide Halaman (detik)</label>
                  <input
                    type="number"
                    min="3"
                    max="30"
                    value={settings.slide_duration}
                    onChange={(e) => setSettings({...settings, slide_duration: parseInt(e.target.value) || 5})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Waktu dalam detik untuk perpindahan otomatis antar halaman</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Notifikasi</label>
                  <input
                    type="email"
                    value={settings.notification_email}
                    onChange={(e) => setSettings({...settings, notification_email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="auto_update"
                      checked={settings.auto_update_enabled}
                      onChange={(e) => setSettings({...settings, auto_update_enabled: e.target.checked})}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="auto_update" className="ml-2 text-sm text-gray-700">
                      Aktifkan update otomatis
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="email_notifications"
                      checked={settings.email_notifications_enabled}
                      onChange={(e) => setSettings({...settings, email_notifications_enabled: e.target.checked})}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="email_notifications" className="ml-2 text-sm text-gray-700">
                      Kirim notifikasi email untuk status kritis
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="auto_slide"
                      checked={settings.auto_slide_enabled}
                      onChange={(e) => setSettings({...settings, auto_slide_enabled: e.target.checked})}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="auto_slide" className="ml-2 text-sm text-gray-700">
                      Aktifkan slide otomatis antar halaman
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <div className="flex">
                <svg className="flex-shrink-0 w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Catatan:</strong> Perubahan pengaturan akan berlaku setelah menyimpan dan refresh halaman dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full modal-content">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Edit Data Sistem</h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sistem</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Saat Ini</label>
                  <input
                    type="number"
                    value={editingItem.value}
                    onChange={(e) => setEditingItem({...editingItem, value: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Maksimal</label>
                  <input
                    type="number"
                    value={editingItem.maxValue}
                    onChange={(e) => setEditingItem({...editingItem, maxValue: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({...editingItem, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingItem.isRealtime}
                    onChange={(e) => setEditingItem({...editingItem, isRealtime: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">Real-time monitoring</label>
                </div>
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Data Entry Modal */}
      {editingDataEntry && (
        <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full modal-content">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Input Data Monitoring {editingDataEntry.monitoring_name}
                </h3>
                <button
                  onClick={() => setEditingDataEntry(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Triwulan</label>
                    <select
                      value={editingDataEntry.quarter}
                      onChange={(e) => setEditingDataEntry({...editingDataEntry, quarter: parseInt(e.target.value)})}
                      disabled={!!editingDataEntry.id}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!!editingDataEntry.id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value={1}>Triwulan 1 (Jan-Mar)</option>
                      <option value={2}>Triwulan 2 (Apr-Jun)</option>
                      <option value={3}>Triwulan 3 (Jul-Sep)</option>
                      <option value={4}>Triwulan 4 (Okt-Des)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                    <select
                      value={editingDataEntry.year}
                      onChange={(e) => setEditingDataEntry({...editingDataEntry, year: parseInt(e.target.value)})}
                      disabled={!!editingDataEntry.id}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!!editingDataEntry.id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      {[2023, 2024, 2025, 2026].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nilai (Max: {(() => {
                      const config = monitoringConfigs.find(c => c.id === editingDataEntry.monitoring_id);
                      return config ? `${config.max_value} ${config.unit}` : '100';
                    })()})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={(() => {
                      const config = monitoringConfigs.find(c => c.id === editingDataEntry.monitoring_id);
                      return config ? config.max_value : 100;
                    })()}
                    value={editingDataEntry.current_value}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      const config = monitoringConfigs.find(c => c.id === editingDataEntry.monitoring_id);
                      const maxValue = config ? config.max_value : 100;
                      
                      if (value <= maxValue) {
                        setEditingDataEntry({...editingDataEntry, current_value: value});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan nilai"
                  />
                  {(() => {
                    const config = monitoringConfigs.find(c => c.id === editingDataEntry.monitoring_id);
                    if (config && editingDataEntry.current_value > config.max_value) {
                      return (
                        <p className="text-red-500 text-xs mt-1">
                          Nilai tidak boleh lebih dari {config.max_value} {config.unit}
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  onClick={() => setEditingDataEntry(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => saveMonitoringDataEntry(editingDataEntry)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Config Modal */}
      {editingConfig && (
        <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full modal-content max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Edit Konfigurasi Card</h3>
                <button
                  onClick={() => setEditingConfig(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sistem</label>
                  <input
                    type="text"
                    value={editingConfig.monitoring_name}
                    onChange={(e) => setEditingConfig({...editingConfig, monitoring_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea
                    value={editingConfig.monitoring_description}
                    onChange={(e) => setEditingConfig({...editingConfig, monitoring_description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Maksimal</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingConfig.max_value}
                      onChange={(e) => setEditingConfig({...editingConfig, max_value: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      value={editingConfig.unit}
                      onChange={(e) => setEditingConfig({...editingConfig, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="%">%</option>
                      <option value="poin">poin</option>
                      <option value="unit">unit</option>
                      <option value="buah">buah</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <select
                    value={editingConfig.icon}
                    onChange={(e) => setEditingConfig({...editingConfig, icon: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="⚖️">⚖️ Hukum</option>
                    <option value="🤝">🤝 Mediasi</option>
                    <option value="💻">💻 Teknologi</option>
                    <option value="🛠️">🛠️ Tools</option>
                    <option value="✈️">✈️ Banding</option>
                    <option value="💼">💼 Administrasi</option>
                    <option value="🔍">🔍 Pemeriksaan</option>
                    <option value="💰">💰 Keuangan</option>
                    <option value="🏛️">🏛️ Pemerintahan</option>
                    <option value="🛡️">🛡️ Keamanan</option>
                    <option value="📊">📊 Statistik</option>
                    <option value="💡">💡 Inovasi</option>
                    <option value="📋">📋 Laporan</option>
                    <option value="🏢">🏢 Kantor</option>
                    <option value="✏️">✏️ Pencatatan</option>
                    <option value="🌐">🌐 Website</option>
                    <option value="🏆">🏆 Prestasi</option>
                    <option value="✅">✅ Validasi</option>
                    <option value="👥">👥 SDM</option>
                    <option value="🎯">🎯 Target</option>
                    <option value="📹">📹 CCTV</option>
                    <option value="🎓">🎓 Pelatihan</option>
                    <option value="⚡">⚡ Energi</option>
                    <option value="⚠️">⚠️ Peringatan</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  onClick={() => setEditingConfig(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => saveMonitoringConfig(editingConfig)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage System Data Modal */}
      {managingSystemId && (
        <div className="fixed inset-0 z-40 modal-backdrop flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full modal-content max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Manage Data: {monitoringConfigs.find(c => c.id === managingSystemId)?.monitoring_name}
                </h3>
                <button
                  onClick={() => {
                    setManagingSystemId(null);
                    setManagingSystemData([]);
                    setManageModalTab('data');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setManageModalTab('data');
                    if (managingSystemId) {
                      loadSystemData(managingSystemId, selectedManageYear);
                    }
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    manageModalTab === 'data'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Data Triwulan
                </button>
                <button
                  onClick={() => {
                    setManageModalTab('analytics');
                    if (managingSystemId) {
                      loadAllSystemData(managingSystemId);
                    }
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    manageModalTab === 'analytics'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Analytics
                </button>
              </div>

              {/* Data Tab */}
              {manageModalTab === 'data' && (
                <>
                  {/* Year Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
                    <select
                      value={selectedManageYear}
                      onChange={(e) => setSelectedManageYear(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[2023, 2024, 2025, 2026].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

              {/* Quarterly Data Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Triwulan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Persentase</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[1, 2, 3, 4].map((quarter) => {
                      const data = managingSystemData.find(d => d.quarter === quarter);
                      const config = monitoringConfigs.find(c => c.id === managingSystemId);
                      
                      return (
                        <tr key={quarter} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              Triwulan {quarter} ({quarter === 1 ? 'Jan-Mar' : quarter === 2 ? 'Apr-Jun' : quarter === 3 ? 'Jul-Sep' : 'Okt-Des'})
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {data ? `${data.current_value} ${config?.unit}` : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {data ? `${data.target_value} ${config?.unit}` : `${config?.max_value} ${config?.unit}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {data && data.current_value !== null && config?.max_value ? 
                                `${((data.current_value / config.max_value) * 100).toFixed(1)}%` : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => setEditingDataEntry({
                                id: data?.id,
                                monitoring_id: managingSystemId,
                                monitoring_name: config?.monitoring_name,
                                year: selectedManageYear,
                                quarter: quarter,
                                current_value: data?.current_value || 0,
                                target_value: data?.target_value || config?.max_value || 100,
                                percentage: data?.percentage || 0
                              })}
                              className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 cursor-pointer p-2 rounded-lg transition-colors mr-2 inline-flex items-center space-x-1"
                              title={data ? 'Edit data' : 'Tambah data'}
                            >
                              {data ? (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                  </svg>
                                  <span className="hidden sm:inline">Edit</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                  </svg>
                                  <span className="hidden sm:inline">Add</span>
                                </>
                              )}
                            </button>
                            {data && (
                              <button 
                                onClick={() => {
                                  if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
                                    deleteDataEntry(data.id!);
                                  }
                                }}
                                className="text-red-600 hover:text-red-900 hover:bg-red-50 cursor-pointer p-2 rounded-lg transition-colors inline-flex items-center space-x-1"
                                title="Hapus data"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Quick Add for Missing Quarters */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Aksi Cepat</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const config = monitoringConfigs.find(c => c.id === managingSystemId);
                      const currentDate = new Date();
                      const currentYear = currentDate.getFullYear();
                      const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
                      
                      setEditingDataEntry({
                        monitoring_id: managingSystemId,
                        monitoring_name: config?.monitoring_name,
                        year: currentYear,
                        quarter: currentQuarter,
                        current_value: 0,
                        target_value: config?.max_value || 100,
                        percentage: 0
                      });
                    }}
                    disabled={managingSystemData.length >= 4}
                    className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Tambah Data Triwulan
                  </button>
                  
                  <button
                    onClick={() => {
                      setManagingSystemId(null);
                      setManagingSystemData([]);
                      setManageModalTab('data');
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
              </>
              )}

              {/* Analytics Tab */}
              {manageModalTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Performance Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Informasi Kinerja</h4>
                      {(() => {
                        const config = monitoringConfigs.find(c => c.id === managingSystemId);
                        
                        // Filter data based on analytics view type
                        const filteredData = analyticsViewType === 'yearly' 
                          ? managingSystemData.filter(d => d.year === selectedAnalyticsYear)
                          : managingSystemData;
                        
                        if (!config || filteredData.length === 0) {
                          return (
                            <div className="text-center py-8 text-gray-500">
                              <p className="text-sm">Data tidak tersedia</p>
                              <p className="text-xs">Total data: {managingSystemData.length || 0}</p>
                            </div>
                          );
                        }

                        // Calculate values based on view type
                        let displayValue = 0;
                        let displayPercentage = 0;
                        
                        try {
                          // Always get the latest data (most recent quarter from any year)
                          const sortedData = [...filteredData].sort((a, b) => {
                            if (a.year !== b.year) return b.year - a.year;
                            return b.quarter - a.quarter;
                          });
                          
                          const latestData = sortedData[0];
                          
                          if (latestData && typeof latestData.current_value === 'number') {
                            displayValue = latestData.current_value;
                            displayPercentage = config.max_value > 0 
                              ? (latestData.current_value / config.max_value) * 100 
                              : 0;
                          }
                          
                          // For all data view, also calculate average for comparison
                          let avgValue = 0;
                          let avgPercentage = 0;
                          
                          if (analyticsViewType === 'all') {
                            const validData = filteredData.filter(d => 
                              d && 
                              typeof d.current_value === 'number' && 
                              d.current_value !== null && 
                              !isNaN(d.current_value)
                            );
                            
                            if (validData.length > 0) {
                              avgValue = validData.reduce((sum, d) => sum + d.current_value, 0) / validData.length;
                              avgPercentage = config.max_value > 0 
                                ? (avgValue / config.max_value) * 100 
                                : 0;
                            }
                          }
                        } catch (error) {
                          displayValue = 0;
                          displayPercentage = 0;
                        }
                        
                        const statusInfo = getStatusFromPercentage(displayPercentage || 0);
                        const trendInfo = getTrendFromData(filteredData || []);

                        return (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Nilai Terbaru:</span>
                              <span className="text-sm font-medium">
                                {displayValue !== null && displayValue !== undefined 
                                  ? `${displayValue.toFixed(2)} ${config.unit}` 
                                  : 'N/A'
                                }
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Target Maximum:</span>
                              <span className="text-sm font-medium">{config.max_value} {config.unit}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Persentase Terbaru:</span>
                              <span className="text-sm font-medium">
                                {displayPercentage !== null && displayPercentage !== undefined 
                                  ? `${displayPercentage.toFixed(1)}%`
                                  : 'N/A'
                                }
                              </span>
                            </div>
                            {analyticsViewType === 'all' && avgValue > 0 && (
                              <>
                                <div className="border-t pt-2 mt-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Rata-rata Nilai:</span>
                                    <span className="text-sm font-medium text-blue-600">
                                      {avgValue.toFixed(2)} {config.unit}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Rata-rata %:</span>
                                    <span className="text-sm font-medium text-blue-600">
                                      {avgPercentage.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Trend:</span>
                              <span className={`text-sm font-medium ${trendInfo.color}`}>{trendInfo.trend}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                {analyticsViewType === 'yearly' ? 'Periode Data:' : 'Total Periode:'}
                              </span>
                              <span className="text-sm font-medium">
                                {analyticsViewType === 'yearly' 
                                  ? `${selectedAnalyticsYear} (${filteredData.length} triwulan)`
                                  : `${filteredData.length} triwulan keseluruhan`
                                }
                              </span>
                            </div>
                            {latestData && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Triwulan Terbaru:</span>
                                <span className="text-sm font-medium text-green-600">
                                  {latestData.year} T{latestData.quarter}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Status Sistem</h4>
                      {(() => {
                        const config = monitoringConfigs.find(c => c.id === managingSystemId);
                        
                        // Filter data based on analytics view type
                        const filteredData = analyticsViewType === 'yearly' 
                          ? managingSystemData.filter(d => d.year === selectedAnalyticsYear)
                          : managingSystemData;
                        
                        if (!config || filteredData.length === 0) {
                          return (
                            <div className="text-center py-8 text-gray-500">
                              <p className="text-sm">Data tidak tersedia</p>
                            </div>
                          );
                        }

                        // Use the latest data for status calculation (same as Informasi Kinerja)
                        let statusPercentage = displayPercentage || 0;
                        
                        const statusInfo = getStatusFromPercentage(statusPercentage || 0);

                        return (
                          <div className="text-center">
                            <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                (statusPercentage || 0) >= 80 ? 'bg-green-500' : 
                                (statusPercentage || 0) >= 50 ? 'bg-orange-500' : 'bg-red-500'
                              }`}></div>
                              {statusInfo.status}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Status berdasarkan data terbaru
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {(statusPercentage || 0) >= 80 ? 'Sistem berjalan dengan baik' :
                               (statusPercentage || 0) >= 50 ? 'Perlu perhatian khusus' : 'Memerlukan tindakan segera'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Triwulan terbaru: {(statusPercentage || 0).toFixed(1)}%
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Quarterly Performance Chart */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {/* Chart Header with Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-700">
                        {analyticsViewType === 'yearly' 
                          ? `Grafik Performa Triwulan ${selectedAnalyticsYear}`
                          : 'Grafik Performa Keseluruhan Data'
                        }
                      </h4>
                      
                      {/* Data View Controls */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Tampilan:</label>
                          <select
                            value={analyticsViewType}
                            onChange={(e) => setAnalyticsViewType(e.target.value as 'yearly' | 'all')}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="yearly">Per Tahun</option>
                            <option value="all">Semua Data</option>
                          </select>
                        </div>
                        
                        {analyticsViewType === 'yearly' && (
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Tahun:</label>
                            <select
                              value={selectedAnalyticsYear}
                              onChange={(e) => setSelectedAnalyticsYear(parseInt(e.target.value))}
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {Array.from(new Set(managingSystemData.map(d => d.year))).sort((a, b) => b - a).map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                    {(() => {
                      const filteredData = analyticsViewType === 'yearly' 
                        ? managingSystemData.filter(d => d.year === selectedAnalyticsYear)
                        : managingSystemData;
                      return filteredData.length > 0;
                    })() ? (
                      <div className="space-y-4">
                        {/* Chart Container */}
                        <div className="bg-white p-4 rounded-lg border">
                          <svg width="100%" height="200" viewBox="0 0 800 200" className="overflow-visible">
                            {/* Y-axis */}
                            <line x1="50" y1="20" x2="50" y2="160" stroke="#e5e7eb" strokeWidth="2"/>
                            
                            {/* X-axis */}
                            <line x1="50" y1="160" x2="750" y2="160" stroke="#e5e7eb" strokeWidth="2"/>
                            
                            {/* Y-axis labels */}
                            {[0, 25, 50, 75, 100].map((value, index) => {
                              const y = 160 - (value * 1.4); // Scale to fit
                              return (
                                <g key={index}>
                                  <text x="40" y={y + 4} fontSize="12" fill="#64748b" textAnchor="end">
                                    {value}%
                                  </text>
                                  <line x1="45" y1={y} x2="50" y2={y} stroke="#e5e7eb" strokeWidth="1"/>
                                </g>
                              );
                            })}
                            
                            {/* Data visualization */}
                            {(() => {
                              // Get filtered data based on analytics view type
                              const filteredData = analyticsViewType === 'yearly' 
                                ? managingSystemData.filter(d => d.year === selectedAnalyticsYear)
                                : managingSystemData;
                              
                              const sortedData = [...filteredData].sort((a, b) => {
                                if (a.year !== b.year) return a.year - b.year;
                                return a.quarter - b.quarter;
                              });
                              
                              // For yearly view, show all quarters; for all data, show recent 8 quarters
                              const displayData = analyticsViewType === 'yearly' 
                                ? sortedData 
                                : sortedData.slice(-8);
                              
                              if (displayData.length === 0) return null;
                              
                              const config = monitoringConfigs.find(c => c.id === managingSystemId);
                              if (!config) return null;

                              return (
                                <>
                                  {/* X-axis labels */}
                                  {displayData.map((data, index) => {
                                    const chartWidth = 700; // Full width minus margins (800 - 50 - 50)
                                    const spacing = displayData.length > 1 
                                      ? chartWidth / (displayData.length - 1) 
                                      : 0;
                                    const x = 50 + (index * spacing);
                                    return (
                                      <text key={index} x={x} y="180" fontSize="10" fill="#64748b" textAnchor="middle">
                                        {data.year} T{data.quarter}
                                      </text>
                                    );
                                  })}
                                  
                                  {/* Chart line */}
                                  <polyline
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="3"
                                    points={displayData.map((data, index) => {
                                      const percentage = (data.current_value / config.max_value) * 100;
                                      const chartWidth = 700;
                                      const spacing = displayData.length > 1 
                                        ? chartWidth / (displayData.length - 1) 
                                        : 0;
                                      const x = 50 + (index * spacing);
                                      const y = 160 - (percentage * 1.4);
                                      return `${x},${y}`;
                                    }).join(' ')}
                                  />
                                  
                                  {/* Data points */}
                                  {displayData.map((data, index) => {
                                    const percentage = (data.current_value / config.max_value) * 100;
                                    const chartWidth = 700;
                                    const spacing = displayData.length > 1 
                                      ? chartWidth / (displayData.length - 1) 
                                      : 0;
                                    const x = 50 + (index * spacing);
                                    const y = 160 - (percentage * 1.4);
                                    
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
                                </>
                              );
                            })()}
                          </svg>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-0.5 bg-blue-500"></div>
                            <span>
                              {analyticsViewType === 'yearly' 
                                ? `Performa Triwulan ${selectedAnalyticsYear}`
                                : 'Performa Triwulan (8 Periode Terakhir)'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">Tidak ada data untuk ditampilkan</p>
                        <p className="text-xs">
                          {analyticsViewType === 'yearly' 
                            ? `Belum ada data untuk tahun ${selectedAnalyticsYear}`
                            : 'Tambahkan data triwulan untuk melihat grafik performa'
                          }
                        </p>
                      </div>
                    )}
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