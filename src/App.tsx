import { useState } from 'react';
import { useRetirementCalculator } from './hooks/useRetirementCalculator';
import Dashboard from './components/Dashboard';
import PersonalInfoForm from './components/PersonalInfoForm';
import FinancialInputsForm from './components/FinancialInputsForm';
import AccountsManagement from './components/AccountsManagement';
import IncomeSourcesManagement from './components/IncomeSourcesManagement';
import ProjectionCharts from './components/ProjectionCharts';
import PortfolioTracking from './components/PortfolioTracking';
import { DebugConsole } from './components/DebugConsole';
import { Menu, X } from 'lucide-react';
import './index.css';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'setup' | 'finances' | 'accounts' | 'income' | 'projections' | 'tracking'>('dashboard');
  
  const {
    data,
    projectionSummary,
    isLoading,
    error,
    updateHousehold,
    updateFinancialInputs,
    addAccount,
    updateAccount,
    deleteAccount,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
    resetToDefaults,
    retryCalculation,
  } = useRetirementCalculator();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-green mb-4"></div>
          <p className="text-gray-200">Loading your retirement calculator...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    if (error) {
      return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
          <div className="bg-red-900/30 border-2 border-red-700 rounded-lg p-8 max-w-lg">
            <h2 className="text-xl font-bold text-red-300 mb-4">Loading Error</h2>
            <p className="text-red-200 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={retryCalculation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Retry Calculation
              </button>
              <button
                onClick={resetToDefaults}
                className="w-full bg-yellow-700 hover:bg-yellow-800 text-white font-bold py-2 px-4 rounded"
              >
                Reset to Defaults
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Clear All Data & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-green mb-4"></div>
          <p className="text-gray-200">Loading your retirement calculator...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('App error:', error);
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden`}
      >
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-neon-green tracking-tight">Retirement Calculator</h1>
          <p className="text-xs text-gray-500 font-medium tracking-wide mt-1">FINANCIAL PLANNING</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'setup', label: 'Personal Info' },
            { id: 'finances', label: 'Financial Data' },
            { id: 'income', label: 'Income Sources' },
            { id: 'accounts', label: 'Accounts' },
            { id: 'projections', label: 'Projections' },
            { id: 'tracking', label: 'Portfolio Track' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full text-left px-4 py-2.5 rounded transition-colors text-sm font-medium ${
                activeTab === tab.id
                  ? 'bg-neon-green text-black'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 text-xs text-gray-400">
          Last updated: {new Date(data.lastUpdated).toLocaleDateString()}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'setup' && 'Personal Information'}
              {activeTab === 'finances' && 'Financial Inputs'}
              {activeTab === 'accounts' && 'Account Management'}
              {activeTab === 'income' && 'Income Sources'}
              {activeTab === 'projections' && 'Retirement Projections'}
              {activeTab === 'tracking' && 'Portfolio Tracking'}
            </h2>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard data={data} projectionSummary={projectionSummary} />
          )}
          {activeTab === 'setup' && (
            <PersonalInfoForm data={data} onUpdate={updateHousehold} />
          )}
          {activeTab === 'finances' && (
            <FinancialInputsForm data={data} onUpdate={updateFinancialInputs} />
          )}
          {activeTab === 'income' && (
            <IncomeSourcesManagement
              userSources={data.incomeSourcesUser}
              spouseSources={data.incomeSourcesSpouse || []}
              onAddUser={(source) => addIncomeSource(source, 'user')}
              onAddSpouse={(source) => addIncomeSource(source, 'spouse')}
              onUpdateUser={(id, updates) => updateIncomeSource(id, updates, 'user')}
              onUpdateSpouse={(id, updates) => updateIncomeSource(id, updates, 'spouse')}
              onDeleteUser={(id) => deleteIncomeSource(id, 'user')}
              onDeleteSpouse={(id) => deleteIncomeSource(id, 'spouse')}
            />
          )}
          {activeTab === 'accounts' && (
            <AccountsManagement
              accounts={data.accounts}
              onAdd={addAccount}
              onUpdate={updateAccount}
              onDelete={deleteAccount}
            />
          )}
          {activeTab === 'projections' && (
            <ProjectionCharts
              data={data}
              projectionSummary={projectionSummary}
            />
          )}
          {activeTab === 'tracking' && (
            <PortfolioTracking snapshots={data.portfolioSnapshots} />
          )}
        </main>
      </div>
      {(import.meta as any).env.DEV && <DebugConsole />}
    </div>
  );
}
