import { useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { RetirementCalculatorData, ProjectionSummary } from '../types';
import { TrendingUp, Target, Calendar, DollarSign } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface DashboardProps {
  data: RetirementCalculatorData;
  projectionSummary: ProjectionSummary | null;
}

const PIE_COLORS = ['#00ff41', '#00d9ff', '#d946ef', '#fbbf24', '#fb7185', '#60a5fa', '#34d399'];

export default function Dashboard({ data, projectionSummary }: DashboardProps) {
  if (!projectionSummary || !projectionSummary.projections || projectionSummary.projections.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">Calculating your retirement projection...</p>
        </div>
      </div>
    );
  }

  try {
    const user = data.household.user;
    const currentYear = data.household.currentYear;
    const userAge = currentYear - user.birthYear;
    const retirementYear = user.birthYear + user.retirementAge;
    const yearsToRetirement = user.retirementAge - userAge;
    const lifeExpectancyYear = user.birthYear + user.lifeExpectancyAge;

    const currentPortfolioValue = projectionSummary.projections[0]?.portfolioValueAfter || 0;
    const finalPortfolioValue = projectionSummary.finalPortfolioValue;
    const goalAmount = data.financialInputs.savingsGoal;
    const goalProgress = (currentPortfolioValue / goalAmount) * 100;

    // Memoize all data transformations to prevent infinite re-renders
    const { scale, chartData, accountBreakdown } = useMemo(() => {
      try {
        // Determine display scale automatically (raw / thousands / millions)
        const maxVal = Math.max(...projectionSummary.projections.map(p => Math.max(p.portfolioValueAfter || 0, p.portfolioValueAfterLowerLimit || 0, p.portfolioValueAfterUpperLimit || 0)));
        
        if (!Number.isFinite(maxVal) || maxVal < 0) {
          throw new Error('Invalid portfolio values detected');
        }

        const calculatedScale = maxVal >= 1_000_000 ? { divisor: 1_000_000, suffix: 'M' } : 
                                maxVal >= 1_000 ? { divisor: 1_000, suffix: 'k' } : 
                                { divisor: 1, suffix: '' };

        // Prepare chart data - show first 30 years
        const calculatedChartData = projectionSummary.projections.slice(0, 30).map(proj => ({
          year: proj.year,
          portfolio: +(proj.portfolioValueAfter / calculatedScale.divisor).toFixed(2),
          lowerLimit: +(proj.portfolioValueAfterLowerLimit / calculatedScale.divisor).toFixed(2),
          upperLimit: +(proj.portfolioValueAfterUpperLimit / calculatedScale.divisor).toFixed(2),
          withdrawals: +(proj.withdrawals / calculatedScale.divisor).toFixed(2),
          contributions: +(proj.contributions / calculatedScale.divisor).toFixed(2),
          income: +(proj.totalIncome / calculatedScale.divisor).toFixed(2),
        }));

        // Account breakdown for pie chart
        const calculatedAccountBreakdown = data.accounts.map(acc => ({
          name: acc.name,
          value: acc.currentValue,
        }));

        return { scale: calculatedScale, chartData: calculatedChartData, accountBreakdown: calculatedAccountBreakdown };
      } catch (err) {
        console.error('Error in Dashboard memoization:', err);
        throw err;
      }
    }, [projectionSummary, data.accounts]);

    const containerRef = useRef<HTMLDivElement | null>(null);

  const handleExportPDF = async () => {
    if (!containerRef.current) return;
    try {
      const canvas = await html2canvas(containerRef.current, { backgroundColor: '#0b0b0b', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgProps = (pdf as any).getImageProperties(imgData);
      const imgWidth = pageWidth - 40; // margins
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      let posY = 20;
      if (imgHeight < pageHeight) {
        pdf.addImage(imgData, 'PNG', 20, posY, imgWidth, imgHeight);
      } else {
        // If content taller than one page, split into multiple pages
        const canvasHeight = canvas.height;
        const canvasWidth = canvas.width;
        const pxPerPt = canvasWidth / imgWidth;
        let renderedHeight = 0;
        while (renderedHeight < canvasHeight) {
          const slice = document.createElement('canvas');
          slice.width = canvasWidth;
          const sliceHeightPx = Math.min(canvasHeight - renderedHeight, Math.round(pageHeight * pxPerPt));
          slice.height = sliceHeightPx;
          const ctx = slice.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, renderedHeight, canvasWidth, sliceHeightPx, 0, 0, canvasWidth, sliceHeightPx);
            const sliceData = slice.toDataURL('image/png');
            const sliceImgProps = (pdf as any).getImageProperties(sliceData);
            const sliceImgHeight = (sliceImgProps.height * imgWidth) / sliceImgProps.width;
            if (pdf.getNumberOfPages() > 0) pdf.addPage();
            pdf.addImage(sliceData, 'PNG', 20, 20, imgWidth, sliceImgHeight);
          }
          renderedHeight += sliceHeightPx;
        }
      }

      pdf.save(`retirement-projections-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error('PDF export failed', err);
      alert('PDF export failed — check console for details.');
    }
  };

  return (
    <div ref={containerRef} className="p-8 space-y-8 bg-gray-950 min-h-screen">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Portfolio */}
        <div className="card-accent group hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-400 text-sm font-semibold">Current Portfolio</h3>
            <DollarSign className="text-neon-green" size={20} />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-neon-green">
              ${(currentPortfolioValue / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-gray-500">
              {currentPortfolioValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Savings Goal Progress */}
        <div className="card-accent group hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-400 text-sm font-semibold">Goal Progress</h3>
            <Target className="text-neon-green" size={20} />
          </div>
          <div className="space-y-3">
            <p className="text-3xl font-bold text-neon-green">
              {goalProgress.toFixed(0)}%
            </p>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-neon-green to-neon-cyan transition-all duration-500"
                style={{ width: `${Math.min(goalProgress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Time to Retirement */}
        <div className="card-accent group hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-400 text-sm font-semibold">Years to Retire</h3>
            <Calendar className="text-neon-green" size={20} />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-neon-green">
              {yearsToRetirement}
            </p>
            <p className="text-xs text-gray-500">
              Target: {retirementYear}
            </p>
          </div>
        </div>

        {/* Projected Value */}
        <div className="card-accent group hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-400 text-sm font-semibold">At Age {user.lifeExpectancyAge}</h3>
            <TrendingUp className="text-neon-green" size={20} />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-neon-green">
              ${(finalPortfolioValue / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-gray-500">
              Year {lifeExpectancyYear}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">Display scale: <span className="text-neon-green font-semibold">{scale.suffix || 'units'}</span></div>
        <div className="flex items-center gap-3">
          <button
            className="px-3 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white hover:bg-gray-700"
            onClick={() => {
              const headers = ['year','portfolioValueAfter','portfolioValueAfterLowerLimit','portfolioValueAfterUpperLimit','contributions','withdrawals','expenses','surplus'];
              const rows = projectionSummary.projections.map(p => [
                p.year,
                p.portfolioValueAfter,
                p.portfolioValueAfterLowerLimit,
                p.portfolioValueAfterUpperLimit,
                p.contributions,
                p.withdrawals,
                p.expenses,
                p.surplus,
              ]);
              const csv = [headers.join(','), ...rows.map(r => r.map(v => typeof v === 'number' ? v : `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `retirement-projections-${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export CSV (Excel)
          </button>

          <button
            className="px-3 py-1 text-sm bg-gray-800 border border-gray-700 rounded text-white hover:bg-gray-700"
            onClick={handleExportPDF}
          >
            Export PDF
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Growth Chart */}
        <div className="card-accent">
          <h3 className="text-lg font-bold text-white mb-4 pb-3 border-b border-gray-800">
            Portfolio Growth Projection
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff41" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00ff41" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d9ff" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00d9ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
              <XAxis dataKey="year" stroke="#7d7d7d" style={{ fontSize: '12px' }} />
              <YAxis stroke="#7d7d7d" style={{ fontSize: '12px' }} tickFormatter={(val) => `$${val}${scale.suffix}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #00ff41', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e7eb' }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()}${scale.suffix}`, '']}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="upperLimit"
                stroke="#00d9ff"
                strokeWidth={1}
                strokeDasharray="5 5"
                fillOpacity={0}
                name="Optimistic"
              />
              <Area
                type="monotone"
                dataKey="portfolio"
                stroke="#00ff41"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPortfolio)"
                name="Base Case"
              />
              <Area
                type="monotone"
                dataKey="lowerLimit"
                stroke="#fb7185"
                strokeWidth={1}
                strokeDasharray="5 5"
                fillOpacity={0}
                name="Conservative"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cash Flow Chart */}
        <div className="card-accent">
          <h3 className="text-lg font-bold text-white mb-4 pb-3 border-b border-gray-800">
            Annual Cash Flow
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
              <XAxis dataKey="year" stroke="#7d7d7d" style={{ fontSize: '12px' }} />
              <YAxis stroke="#7d7d7d" style={{ fontSize: '12px' }} tickFormatter={(val) => `$${val}${scale.suffix}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #00d9ff', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e7eb' }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()}${scale.suffix}`, '']}
              />
              <Legend />
              <Bar dataKey="contributions" fill="#00ff41" name="Contributions" radius={[4, 4, 0, 0]} />
              <Bar dataKey="withdrawals" fill="#d946ef" name="Withdrawals" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Distribution */}
        <div className="card-accent lg:col-span-1">
          <h3 className="text-lg font-bold text-white mb-4 pb-3 border-b border-gray-800">
            Account Breakdown
          </h3>
          {accountBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={accountBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ value }: any) => `${((value / accountBreakdown.reduce((sum, acc) => sum + acc.value, 0)) * 100).toFixed(0)}%`}
                >
                  {accountBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => `$${typeof value === 'number' ? (value / 1000000).toFixed(1) : '0'}M`}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #00ff41', borderRadius: '8px' }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No accounts added yet</p>
          )}
        </div>

        {/* Personal Summary */}
        <div className="card-accent lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4 pb-3 border-b border-gray-800">
            Your Profile
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Name</p>
              <p className="text-white font-semibold">{user.name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Current Age</p>
              <p className="text-white font-semibold">{userAge}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Retirement Age</p>
              <p className="text-white font-semibold">{user.retirementAge}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Life Expectancy</p>
              <p className="text-white font-semibold">{user.lifeExpectancyAge}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Investment Growth (Pre)</p>
              <p className="text-neon-green font-semibold">{(data.financialInputs.investmentGrowthPreRetirement * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Investment Growth (Post)</p>
              <p className="text-neon-green font-semibold">{(data.financialInputs.investmentGrowthPostRetirement * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Annual Inflation</p>
              <p className="text-white font-semibold">{(data.financialInputs.inflationRate * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Annual Budget</p>
              <p className="text-white font-semibold">${(data.financialInputs.monthlyRetirementBudget * 12).toLocaleString('en-US', { currency: 'USD', style: 'currency', maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="card-accent">
        <h3 className="text-lg font-bold text-white mb-4 pb-3 border-b border-gray-800">
          Projection Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-400 text-sm mb-2">Total Contributions</p>
            <p className="text-2xl font-bold text-neon-green">
              ${(projectionSummary.totalContributions / 1000000).toFixed(2)}M
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-2">Total Withdrawals</p>
            <p className="text-2xl font-bold text-neon-cyan">
              ${(projectionSummary.totalWithdrawals / 1000000).toFixed(2)}M
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-2">Projection Years</p>
            <p className="text-2xl font-bold text-white">
              {projectionSummary.projections.length}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-2">Final Portfolio</p>
            <p className="text-2xl font-bold text-neon-green">
              ${(finalPortfolioValue / 1000000).toFixed(2)}M
            </p>
          </div>
        </div>
      </div>
    </div>
    );
  } catch (err) {
    console.error('Dashboard render error:', err);
    return (
      <div className="p-8">
        <div className="bg-red-900/30 border-2 border-red-700 rounded-lg p-8">
          <p className="text-red-300">Error rendering dashboard:</p>
          <p className="text-red-200 text-sm mt-2 font-mono">{err instanceof Error ? err.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}
