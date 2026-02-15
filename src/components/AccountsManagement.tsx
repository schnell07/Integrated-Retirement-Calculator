import { useState, useMemo } from 'react';
import { RetirementAccount } from '../types';
import { Plus, Trash2, Edit2 } from 'lucide-react';

interface AccountsManagementProps {
  accounts: RetirementAccount[];
  onAdd: (account: RetirementAccount) => void;
  onUpdate: (id: string, updates: Partial<RetirementAccount>) => void;
  onDelete: (id: string) => void;
}

const ACCOUNT_TYPES = [
  'Traditional401k',
  'Roth401k',
  'TraditionalIRA',
  'RothIRA',
  'HSA',
  '529',
  'Taxable',
];

export default function AccountsManagement({
  accounts,
  onAdd,
  onUpdate,
  onDelete,
}: AccountsManagementProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<RetirementAccount>>({
    name: '',
    type: 'Traditional401k',
    currentValue: 0,
    annualContribution: 0,
    employerMatch: 0,
    employerMatchCap: 0,
    owner: 'user',
    growthRate: 0.07,
  });

  const handleAddClick = () => {
    setFormData({
      name: '',
      type: 'Traditional401k',
      currentValue: 0,
      annualContribution: 0,
      employerMatch: 0,
      employerMatchCap: 0,
      owner: 'user',
      growthRate: 0.07,
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEditClick = (account: RetirementAccount) => {
    setFormData(account);
    setEditingId(account.id);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!formData.name || !formData.type) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingId) {
      onUpdate(editingId, formData);
      setEditingId(null);
    } else {
      onAdd({
        id: Date.now().toString(),
        name: formData.name!,
        type: formData.type as any,
        currentValue: formData.currentValue || 0,
        annualContribution: formData.annualContribution || 0,
        employerMatch: formData.employerMatch || 0,
        employerMatchCap: formData.employerMatchCap || 0,
        owner: formData.owner as any,
        growthRate: formData.growthRate || 0.07,
      });
      setIsAdding(false);
    }

    setFormData({
      name: '',
      type: 'Traditional401k',
      currentValue: 0,
      annualContribution: 0,
      employerMatch: 0,
      employerMatchCap: 0,
      owner: 'user',
      growthRate: 0.07,
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '',
      type: 'Traditional401k',
      currentValue: 0,
      annualContribution: 0,
      employerMatch: 0,
      employerMatchCap: 0,
      owner: 'user',
      growthRate: 0.07,
    });
  };

  const { totalValue, totalContributions, averageGrowthRate } = useMemo(() => {
    const total = accounts.reduce((sum, acc) => sum + acc.currentValue, 0);
    const contributions = accounts.reduce((sum, acc) => sum + acc.annualContribution, 0);
    const avgGrowth = accounts.length > 0 
      ? (accounts.reduce((sum, acc) => sum + acc.growthRate, 0) / accounts.length) * 100
      : 0;
    return { totalValue: total, totalContributions: contributions, averageGrowthRate: avgGrowth };
  }, [accounts]);

  return (
    <div className="p-8 space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-header text-base">Total Account Value</div>
          <div className="text-3xl font-bold text-navy-100">
            ${(totalValue / 1000000).toFixed(2)}M
          </div>
          <p className="text-sm text-navy-400 mt-2">
            {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          </p>
        </div>

        <div className="card">
          <div className="card-header text-base">Annual Contributions</div>
          <div className="text-3xl font-bold text-navy-100">
            ${(totalContributions / 1000).toFixed(0)}K
          </div>
          <p className="text-sm text-navy-400 mt-2">
            Before employer matching
          </p>
        </div>

        <div className="card">
          <div className="card-header text-base">Average Growth Rate</div>
          <div className="text-3xl font-bold text-navy-100">
            {averageGrowthRate.toFixed(1)}%
          </div>
          <p className="text-sm text-navy-400 mt-2">
            Weighted average
          </p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="card border-2 border-navy-600">
          <div className="card-header">
            {editingId ? 'Edit Account' : 'Add New Account'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="form-group">
              <label className="form-label">Account Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Primary 401(k)"
                className="w-full"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Type *</label>
              <select
                value={formData.type || 'Traditional401k'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full"
              >
                {ACCOUNT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Current Value ($)</label>
              <input
                type="number"
                value={formData.currentValue || 0}
                onChange={(e) => setFormData({ ...formData, currentValue: Number(e.target.value) })}
                step={1000}
                min={0}
                className="w-full"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Owner</label>
              <select
                value={formData.owner || 'user'}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value as any })}
                className="w-full"
              >
                <option value="user">You</option>
                <option value="spouse">Spouse</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Annual Contribution ($)</label>
              <input
                type="number"
                value={formData.annualContribution || 0}
                onChange={(e) => setFormData({ ...formData, annualContribution: Number(e.target.value) })}
                step={500}
                min={0}
                className="w-full"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Growth Rate (%)</label>
              <input
                type="number"
                value={(formData.growthRate || 0.07) * 100}
                onChange={(e) => setFormData({ ...formData, growthRate: Number(e.target.value) / 100 })}
                step={0.1}
                min={0}
                max={15}
                className="w-full"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Employer Match Rate (%)</label>
              <input
                type="number"
                value={(formData.employerMatch || 0) * 100}
                onChange={(e) => setFormData({ ...formData, employerMatch: Number(e.target.value) / 100 })}
                step={0.1}
                min={0}
                max={100}
                className="w-full"
              />
              <div className="form-hint">
                e.g., 0.05 = 5% of contribution (0.05 × $X = match amount)
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Employer Match Cap (%)</label>
              <input
                type="number"
                value={(formData.employerMatchCap || 0) * 100}
                onChange={(e) => setFormData({ ...formData, employerMatchCap: Number(e.target.value) / 100 })}
                step={0.1}
                min={0}
                max={100}
                className="w-full"
              />
              <div className="form-hint">
                e.g., 0.06 = max 6% of salary matched
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} className="btn-primary flex-1">
              {editingId ? 'Update Account' : 'Add Account'}
            </button>
            <button onClick={handleCancel} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-navy-400 mb-4">No accounts yet</p>
          <button onClick={handleAddClick} className="btn-primary mx-auto flex items-center gap-2">
            <Plus size={18} />
            Add Your First Account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map(account => (
            <div key={account.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-navy-100">{account.name}</h4>
                  <div className="flex gap-2 mt-2">
                    <span className="badge badge-primary">{account.type}</span>
                    <span className="badge badge-secondary">{account.owner === 'user' ? '👤 You' : '👥 Spouse'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(account)}
                    className="btn-secondary"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(account.id)}
                    className="btn-danger"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-navy-400">Current Value</p>
                  <p className="font-bold text-navy-100">
                    ${account.currentValue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-navy-400">Annual Contribution</p>
                  <p className="font-bold text-navy-100">
                    ${account.annualContribution.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-navy-400">Growth Rate</p>
                  <p className="font-bold text-navy-100">
                    {(account.growthRate * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-navy-400">Employer Match</p>
                  <p className="font-bold text-navy-100">
                    {(account.employerMatch * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isAdding && !editingId && accounts.length > 0 && (
        <button onClick={handleAddClick} className="btn-primary w-full flex items-center justify-center gap-2">
          <Plus size={18} />
          Add Another Account
        </button>
      )}

      {/* Info Box */}
      <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-4">
        <h4 className="font-medium text-purple-200 mb-2">💡 Account Types</h4>
        <ul className="text-sm text-purple-300 space-y-2">
          <li><strong>401(k):</strong> Employer-sponsored, pre-tax contributions, may have employer match</li>
          <li><strong>IRA:</strong> Individual accounts, Traditional (pre-tax) or Roth (post-tax)</li>
          <li><strong>HSA:</strong> Health Savings Account, triple tax advantage</li>
          <li><strong>529:</strong> Education savings, tax-advantaged growth</li>
          <li><strong>Taxable:</strong> Regular investment account, no contribution limits</li>
        </ul>
      </div>
    </div>
  );
}
