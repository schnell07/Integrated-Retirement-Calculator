import { useState, useMemo } from 'react';
import { PortfolioSnapshot } from '../types';
import { Plus, Trash2, TrendingUp } from 'lucide-react';

interface PortfolioTrackingProps {
  snapshots: PortfolioSnapshot[];
}

export default function PortfolioTracking({ snapshots }: PortfolioTrackingProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    totalValue: 0,
    notes: '',
  });

  const handleSave = () => {
    if (!formData.totalValue || !formData.date) {
      alert('Please fill in all required fields');
      return;
    }

    // This would be connected to the parent component's onAddSnapshot
    console.log('Add snapshot:', formData);
    setIsAdding(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      totalValue: 0,
      notes: '',
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      totalValue: 0,
      notes: '',
    });
  };

  const sortedSnapshots = useMemo(() => {
    return [...snapshots].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [snapshots]);

  return (
    <div className="p-8 space-y-8">
      {/* Summary Stats */}
      {snapshots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-header text-base">Latest Portfolio Value</div>
            <div className="text-3xl font-bold text-navy-100">
              ${(sortedSnapshots[0].totalValue / 1000000).toFixed(2)}M
            </div>
            <p className="text-sm text-navy-400 mt-2">
              {new Date(sortedSnapshots[0].date).toLocaleDateString()}
            </p>
          </div>

          <div className="card">
            <div className="card-header text-base">Total Snapshots</div>
            <div className="text-3xl font-bold text-navy-100">
              {snapshots.length}
            </div>
            <p className="text-sm text-navy-400 mt-2">Portfolio records</p>
          </div>

          {snapshots.length > 1 && (
            <div className="card">
              <div className="card-header text-base">Growth Since First</div>
              <div className="text-3xl font-bold text-green-400">
                ${(sortedSnapshots[sortedSnapshots.length - 1].totalValue - sortedSnapshots[0].totalValue).toLocaleString()}
              </div>
              <p className="text-sm text-navy-400 mt-2">
                {(
                  ((sortedSnapshots[0].totalValue - sortedSnapshots[sortedSnapshots.length - 1].totalValue) /
                    sortedSnapshots[sortedSnapshots.length - 1].totalValue) *
                  100
                ).toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Snapshot Form */}
      {isAdding ? (
        <div className="card border-2 border-navy-600">
          <div className="card-header">Add Portfolio Snapshot</div>

          <div className="space-y-6 mb-6">
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Portfolio Value ($) *</label>
              <input
                type="number"
                value={formData.totalValue || ''}
                onChange={(e) => setFormData({ ...formData, totalValue: Number(e.target.value) })}
                step={1000}
                min={0}
                className="w-full"
              />
              <div className="form-hint">
                Total value of all your retirement accounts
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full"
                placeholder="e.g., Market conditions, major contributions, etc."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} className="btn-primary flex-1">
              Save Snapshot
            </button>
            <button onClick={handleCancel} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Portfolio Snapshot
        </button>
      )}

      {/* Snapshots List */}
      {snapshots.length === 0 ? (
        <div className="card text-center py-12">
          <TrendingUp size={48} className="mx-auto text-navy-500 mb-4" />
          <p className="text-navy-300 mb-4">No portfolio snapshots recorded yet</p>
          <p className="text-navy-400 text-sm max-w-md mx-auto">
            Start adding snapshots to track your actual portfolio performance against the projected values.
            This helps you stay on track with your retirement goals.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-navy-100">Portfolio History</h3>
          {sortedSnapshots.map((snapshot, idx) => {
            const nextSnapshot = idx < sortedSnapshots.length - 1 ? sortedSnapshots[idx + 1] : null;
            const change = nextSnapshot ? snapshot.totalValue - nextSnapshot.totalValue : 0;
            const changePercent = nextSnapshot ? (change / nextSnapshot.totalValue) * 100 : 0;

            return (
              <div key={snapshot.date.getTime()} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-navy-100">
                      ${snapshot.totalValue.toLocaleString()}
                    </h4>
                    <p className="text-sm text-navy-400 mt-1">
                      {new Date(snapshot.date).toLocaleDateString()}
                    </p>
                    {snapshot.notes && (
                      <p className="text-sm text-navy-300 mt-2">{snapshot.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {nextSnapshot && (
                      <div>
                        <p className={`text-lg font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {change >= 0 ? '+' : ''}{(change / 1000000).toFixed(2)}M
                        </p>
                        <p className={`text-sm ${changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => console.log('Delete snapshot')}
                      className="btn-danger mt-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-lg p-4">
        <h4 className="font-medium text-indigo-200 mb-2">📊 Portfolio Tracking Guide</h4>
        <ul className="text-sm text-indigo-300 space-y-1">
          <li>• Record snapshots quarterly or annually for best tracking</li>
          <li>• Each snapshot compares your actual vs. projected portfolio</li>
          <li>• Add notes about market conditions or major life events</li>
          <li>• Use this data to make adjustments to your plan if needed</li>
          <li>• Growth rate adjustments can be made based on historical performance</li>
        </ul>
      </div>
    </div>
  );
}
