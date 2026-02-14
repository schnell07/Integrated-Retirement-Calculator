import { useState } from 'react';
import { IncomeSource } from '../types';
import { Plus, Trash2, Edit2 } from 'lucide-react';

interface IncomeSourcesManagementProps {
  userSources: IncomeSource[];
  spouseSources: IncomeSource[];
  onAddUser: (source: IncomeSource) => void;
  onAddSpouse: (source: IncomeSource) => void;
  onUpdateUser: (id: string, updates: Partial<IncomeSource>) => void;
  onUpdateSpouse: (id: string, updates: Partial<IncomeSource>) => void;
  onDeleteUser: (id: string) => void;
  onDeleteSpouse: (id: string) => void;
}

export default function IncomeSourcesManagement({
  userSources,
  spouseSources,
  onAddUser,
  onAddSpouse,
  onUpdateUser,
  onUpdateSpouse,
  onDeleteUser,
  onDeleteSpouse,
}: IncomeSourcesManagementProps) {
  const [isAdding, setIsAdding] = useState<'none' | 'user' | 'spouse'>('none');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingOwner, setEditingOwner] = useState<'user' | 'spouse'>('user');
  const [formData, setFormData] = useState<Partial<IncomeSource>>({
    name: '',
    annualAmount: 0,
    growthRate: 0.03,
    owner: 'user',
  });

  const handleAddClick = (owner: 'user' | 'spouse') => {
    setFormData({
      name: '',
      annualAmount: 0,
      growthRate: 0.03,
      owner,
    });
    setIsAdding(owner);
    setEditingId(null);
  };

  const handleEditClick = (source: IncomeSource, owner: 'user' | 'spouse') => {
    setFormData(source);
    setEditingId(source.id);
    setEditingOwner(owner);
    setIsAdding('none');
  };

  const handleSave = () => {
    if (!formData.name || !formData.annualAmount) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingId) {
      if (editingOwner === 'user') {
        onUpdateUser(editingId, formData);
      } else {
        onUpdateSpouse(editingId, formData);
      }
      setEditingId(null);
    } else {
      const newSource: IncomeSource = {
        id: Date.now().toString(),
        name: formData.name!,
        annualAmount: formData.annualAmount!,
        growthRate: formData.growthRate || 0.03,
        owner: formData.owner as any,
      };

      if (isAdding === 'user') {
        onAddUser(newSource);
      } else if (isAdding === 'spouse') {
        onAddSpouse(newSource);
      }
    }

    setIsAdding('none');
    setFormData({
      name: '',
      annualAmount: 0,
      growthRate: 0.03,
      owner: 'user',
    });
  };

  const handleCancel = () => {
    setIsAdding('none');
    setEditingId(null);
    setFormData({
      name: '',
      annualAmount: 0,
      growthRate: 0.03,
      owner: 'user',
    });
  };

  const renderIncomeList = (sources: IncomeSource[], owner: 'user' | 'spouse', title: string) => {
    const totalAnnualIncome = sources.reduce((sum, src) => sum + src.annualAmount, 0);

    return (
      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-navy-100">{title}</h3>
          <div className="text-right">
            <p className="text-sm text-navy-400">Total Annual</p>
            <p className="text-lg font-bold text-navy-100">
              ${totalAnnualIncome.toLocaleString()}
            </p>
          </div>
        </div>

        {sources.length === 0 ? (
          <div className="card text-center py-8 text-navy-400">
            <p className="mb-4">No income sources added yet</p>
            <button
              onClick={() => handleAddClick(owner)}
              className="btn-primary mx-auto flex items-center gap-2"
            >
              <Plus size={18} />
              Add Income Source
            </button>
          </div>
        ) : (
          <>
            {sources.map(source => (
              <div key={source.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-navy-100">{source.name}</h4>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(source, owner)}
                      className="btn-secondary"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => owner === 'user' ? onDeleteUser(source.id) : onDeleteSpouse(source.id)}
                      className="btn-danger"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-navy-400">Annual Amount</p>
                    <p className="font-bold text-navy-100">
                      ${source.annualAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-navy-400">Annual Growth</p>
                    <p className="font-bold text-navy-100">
                      {(source.growthRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-navy-400">In 10 Years</p>
                    <p className="font-bold text-navy-100">
                      ${(source.annualAmount * Math.pow(1 + source.growthRate, 10)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isAdding !== owner && editingOwner !== owner && !editingId && (
              <button
                onClick={() => handleAddClick(owner)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Add Income Source
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 space-y-8">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header text-base">Your Income</div>
          <div className="text-3xl font-bold text-navy-100">
            ${userSources.reduce((sum, src) => sum + src.annualAmount, 0).toLocaleString()}
          </div>
          <p className="text-sm text-navy-400 mt-2">
            {userSources.length} {userSources.length === 1 ? 'source' : 'sources'}
          </p>
        </div>

        <div className="card">
          <div className="card-header text-base">Spouse Income</div>
          <div className="text-3xl font-bold text-navy-100">
            ${spouseSources.reduce((sum, src) => sum + src.annualAmount, 0).toLocaleString()}
          </div>
          <p className="text-sm text-navy-400 mt-2">
            {spouseSources.length} {spouseSources.length === 1 ? 'source' : 'sources'}
          </p>
        </div>
      </div>

      {/* Form */}
      {(isAdding !== 'none' || editingId) && (
        <div className="card border-2 border-navy-600">
          <div className="card-header">
            {editingId ? 'Edit Income Source' : 'Add Income Source'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="form-group">
              <label className="form-label">Income Source Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Salary, Consulting, Rental Income"
                className="w-full"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Annual Amount ($) *</label>
              <input
                type="number"
                value={formData.annualAmount || 0}
                onChange={(e) => setFormData({ ...formData, annualAmount: Number(e.target.value) })}
                step={1000}
                min={0}
                className="w-full"
              />
            </div>

            <div className="form-group col-span-full">
              <label className="form-label">Annual Growth Rate (%)</label>
              <input
                type="number"
                value={(formData.growthRate || 0.03) * 100}
                onChange={(e) => setFormData({ ...formData, growthRate: Number(e.target.value) / 100 })}
                step={0.1}
                min={-5}
                max={10}
                className="w-full"
              />
              <div className="form-hint">
                Salary growth is typically 2-3%, side income might vary
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} className="btn-primary flex-1">
              {editingId ? 'Update Income' : 'Add Income'}
            </button>
            <button onClick={handleCancel} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Your Income */}
      {renderIncomeList(userSources, 'user', '👤 Your Income Sources')}

      {/* Spouse Income */}
      {renderIncomeList(spouseSources, 'spouse', '👥 Spouse Income Sources')}

      {/* Info Box */}
      <div className="bg-cyan-900/30 border border-cyan-700/50 rounded-lg p-4">
        <h4 className="font-medium text-cyan-200 mb-2">💡 Income Management Tips</h4>
        <ul className="text-sm text-cyan-300 space-y-1">
          <li>• Include all sources: W-2 salary, consulting, rental income, pensions, etc.</li>
          <li>• Income automatically stops at your retirement age</li>
          <li>• Growth rates represent annual increases (salary raises, etc.)</li>
          <li>• Add different sources for different growth patterns</li>
          <li>• You can manage spouse income separately to model different retirement ages</li>
        </ul>
      </div>
    </div>
  );
}
