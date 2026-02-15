import { RetirementCalculatorData, ProjectionSummary } from '../types';
import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface ProjectionChartsProps {
  data: RetirementCalculatorData;
  projectionSummary: ProjectionSummary | null;
}

export default function ProjectionCharts({ data, projectionSummary }: ProjectionChartsProps) {
  if (!projectionSummary || projectionSummary.projections.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-navy-300">No projection data available</p>
        </div>
      </div>
    );
  }

  const projections = projectionSummary.projections;

  // Memoize all chart data transformations to prevent infinite re-renders
  const { portfolioData, cashFlowData, incomeData, firstProjection, lastProjection, goalYear } = useMemo(() => {
    // Portfolio growth trajectory data
    const portfolioTransformed = projections.map(p => ({
      year: p.year,
      value: Math.round(p.portfolioValueAfter),
      projectedGoal: Math.round(data.financialInputs.savingsGoal),
    }));

    // Cash flow data
    const cashFlowTransformed = projections.map(p => ({
      year: p.year,
      contributions: Math.round(p.contributions),
      growth: Math.round(p.investmentGrowth),
      withdrawals: Math.round(p.withdrawals),
    }));

    // Income timeline
    const incomeTransformed = projections.map(p => ({
      year: p.year,
      userIncome: Math.round(p.incomeUser),
      spouseIncome: Math.round(p.incomeSpouse),
      total: Math.round(p.totalIncome),
    }));

    return {
      portfolioData: portfolioTransformed,
      cashFlowData: cashFlowTransformed,
      incomeData: incomeTransformed,
      firstProjection: projections[0],
      lastProjection: projections[projections.length - 1],
      goalYear: projectionSummary.goalAchievingYear,
    };
  }, [projections, data.financialInputs.savingsGoal, projectionSummary.goalAchievingYear]);

  return (
    <div className="p-8 space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-header text-base">Current Portfolio</div>
          <div className="text-2xl font-bold text-navy-100">
            ${(firstProjection.portfolioValueAfter / 1000000).toFixed(2)}M
          </div>
          <p className="text-sm text-navy-400 mt-2">Year {firstProjection.year}</p>
        </div>

        <div className="card">
          <div className="card-header text-base">Final Portfolio Value</div>
          <div className="text-2xl font-bold text-navy-100">
            ${(lastProjection.portfolioValueAfter / 1000000).toFixed(2)}M
          </div>
          <p className="text-sm text-navy-400 mt-2">Age {lastProjection.age.user}</p>
        </div>

        <div className="card">
          <div className="card-header text-base">Total Contributions</div>
          <div className="text-2xl font-bold text-navy-100">
            ${(projectionSummary.totalContributions / 1000000).toFixed(2)}M
          </div>
          <p className="text-sm text-navy-400 mt-2">Over lifetime</p>
        </div>

        <div className="card">
          <div className="card-header text-base">Total Withdrawals</div>
          <div className="text-2xl font-bold text-navy-100">
            ${(projectionSummary.totalWithdrawals / 1000000).toFixed(2)}M
          </div>
          <p className="text-sm text-navy-400 mt-2">During retirement</p>
        </div>
      </div>

      {/* Portfolio Growth Trajectory */}
      <div className="card">
        <h3 className="card-header">Portfolio Growth Trajectory</h3>
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={portfolioData}>
              <defs>
                <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3a5ae8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3a5ae8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2f8c" />
              <XAxis
                dataKey="year"
                stroke="#7a94ff"
                tick={{ fill: '#7a94ff', fontSize: 12 }}
              />
              <YAxis
                stroke="#7a94ff"
                tick={{ fill: '#7a94ff', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f1a5e', border: '1px solid #3a5ae8' }}
                formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#5677ff"
                fillOpacity={1}
                fill="url(#colorPortfolio)"
                name="Portfolio Value"
              />
              <Line
                type="monotone"
                dataKey="projectedGoal"
                stroke="#f97316"
                strokeDasharray="5 5"
                name="Savings Goal"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {goalYear && (
          <p className="mt-4 text-sm text-green-400">
            ✓ Goal achievement year: {goalYear}
          </p>
        )}
      </div>

      {/* Cash Flow Analysis */}
      <div className="card">
        <h3 className="card-header">Annual Cash Flow</h3>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2f8c" />
              <XAxis
                dataKey="year"
                stroke="#7a94ff"
                tick={{ fill: '#7a94ff', fontSize: 12 }}
              />
              <YAxis
                stroke="#7a94ff"
                tick={{ fill: '#7a94ff', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f1a5e', border: '1px solid #3a5ae8' }}
                formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Legend />
              <Bar dataKey="contributions" fill="#10b981" name="Contributions" />
              <Bar dataKey="growth" fill="#3b82f6" name="Investment Growth" />
              <Bar dataKey="withdrawals" fill="#ef4444" name="Withdrawals" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Income Timeline */}
      <div className="card">
        <h3 className="card-header">Household Income Timeline</h3>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={incomeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2f8c" />
              <XAxis
                dataKey="year"
                stroke="#7a94ff"
                tick={{ fill: '#7a94ff', fontSize: 12 }}
              />
              <YAxis
                stroke="#7a94ff"
                tick={{ fill: '#7a94ff', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f1a5e', border: '1px solid #3a5ae8' }}
                formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="userIncome"
                stroke="#8884d8"
                name="Your Income"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="spouseIncome"
                stroke="#82ca9d"
                name="Spouse Income"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#ffc658"
                name="Total Income"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Projection Table */}
      <div className="card">
        <h3 className="card-header">Detailed Year-by-Year Projections</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800">
                <th className="px-4 py-3 text-left">Year</th>
                <th className="px-4 py-3 text-right">Age</th>
                <th className="px-4 py-3 text-right">Income</th>
                <th className="px-4 py-3 text-right">Growth</th>
                <th className="px-4 py-3 text-right">Expenses</th>
                <th className="px-4 py-3 text-right">Portfolio</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {projections.slice(0, 20).map((p, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-navy-800/30' : ''}>
                  <td className="px-4 py-3">{p.year}</td>
                  <td className="px-4 py-3 text-right">{p.age.user}</td>
                  <td className="px-4 py-3 text-right">${(p.totalIncome / 1000).toFixed(0)}K</td>
                  <td className="px-4 py-3 text-right">${(p.investmentGrowth / 1000).toFixed(0)}K</td>
                  <td className="px-4 py-3 text-right">${(p.expenses / 1000).toFixed(0)}K</td>
                  <td className="px-4 py-3 text-right font-bold">${(p.portfolioValueAfter / 1000000).toFixed(2)}M</td>
                  <td className="px-4 py-3">
                    <span className="text-xs">
                      {p.livingStatus === 'bothAlive' && '👥 Both'}
                      {p.livingStatus === 'userOnly' && '👤 You Only'}
                      {p.livingStatus === 'spouseOnly' && '👥 Spouse'}
                      {p.livingStatus === 'bothPassed' && '⚰️ Passed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {projections.length > 20 && (
            <p className="text-center text-navy-400 pt-4 text-sm">
              Showing first 20 years of {projections.length}
            </p>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4">
        <h4 className="font-medium text-amber-200 mb-2">📈 Understanding Your Projections</h4>
        <ul className="text-sm text-amber-300 space-y-1">
          <li>• Charts automatically scale to your life expectancy year</li>
          <li>• Contribution stops at retirement, then you draw down savings</li>
          <li>• Investment growth rate changes from pre- to post-retirement rates</li>
          <li>• Expenses adjust for survivor if spouse passes away</li>
          <li>• Update actual portfolio snapshots to compare against projections</li>
        </ul>
      </div>
    </div>
  );
}
