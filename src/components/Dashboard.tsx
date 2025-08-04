'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

interface SystemStatus {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'warning' | 'critical';
  lastCheck: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [currentPage, setCurrentPage] = useState('main');
  const [systems, setSystems] = useState<SystemStatus[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const mockSystems: SystemStatus[] = [
      { id: 1, name: 'Sistem Server', description: 'Monitoring status server utama', status: 'active', lastCheck: new Date().toISOString() },
      { id: 2, name: 'Database MySQL', description: 'Monitoring koneksi database', status: 'active', lastCheck: new Date().toISOString() },
      { id: 3, name: 'Aplikasi Web', description: 'Monitoring aplikasi web utama', status: 'warning', lastCheck: new Date().toISOString() },
      { id: 4, name: 'Network Connection', description: 'Monitoring koneksi jaringan', status: 'critical', lastCheck: new Date().toISOString() }
    ];
    setSystems(mockSystems);

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Normal';
      case 'warning': return 'Peringatan';
      case 'critical': return 'Kritis';
      default: return 'Unknown';
    }
  };

  const activeCount = systems.filter(s => s.status === 'active').length;
  const warningCount = systems.filter(s => s.status === 'warning').length;
  const criticalCount = systems.filter(s => s.status === 'critical').length;

  if (currentPage === 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900">
        <header className="bg-blue-800 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-white">Panel Administrator</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-white">Selamat datang, {session?.user?.name}</span>
                <button
                  onClick={() => setCurrentPage('main')}
                  className="bg-white text-blue-800 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Kembali ke Dashboard
                </button>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <nav className="flex space-x-8 px-6 mb-6">
              <button className="text-blue-600 border-b-2 border-blue-600 pb-2">Sistem</button>
              <button className="text-gray-500 hover:text-blue-600 pb-2">Laporan</button>
              <button className="text-gray-500 hover:text-blue-600 pb-2">Pengaturan</button>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {systems.map((system) => (
                <div key={system.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{system.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(system.status)}`}>
                      {getStatusText(system.status)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{system.description}</p>
                  <div className="text-xs text-gray-500">
                    Terakhir diperiksa: {new Date(system.lastCheck).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Smartvinesa</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Selamat datang, {session?.user?.name}</span>
              <button
                onClick={() => setCurrentPage('admin')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Panel Admin
              </button>
              <button
                onClick={() => signOut()}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-blue-600 text-white py-2 text-center">
        <p className="text-lg font-semibold">Halaman 1 - Sistem Utama</p>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                <p className="text-gray-600">Sistem Normal</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{warningCount}</p>
                <p className="text-gray-600">Peringatan</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{criticalCount}</p>
                <p className="text-gray-600">Kritis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Sistem</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systems.map((system) => (
              <div key={system.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{system.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(system.status)}`}>
                    {getStatusText(system.status)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{system.description}</p>
                <div className="text-xs text-gray-500 mt-2">
                  Terakhir diperiksa: {new Date(system.lastCheck).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Grafik Monitoring</h2>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Grafik akan ditampilkan di sini</p>
          </div>
        </div>
      </main>
    </div>
  );
}