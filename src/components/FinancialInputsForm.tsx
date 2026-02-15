
import { FinancialInputs } from '../types';

interface FinancialInputsFormProps {
  data: {
    financialInputs: FinancialInputs;
  };
  onUpdate: (inputs: FinancialInputs) => void;
}

export default function FinancialInputsForm({ data, onUpdate }: FinancialInputsFormProps) {
  const { financialInputs } = data;

  const handleChange = (field: keyof FinancialInputs, value: string, isPercentage = false) => {
    const numValue = Number(value);
    
    // Validate growth rate fields to prevent infinite loops
    if (field === 'growthRateLowerLimit' || field === 'growthRateUpperLimit' || 
        field === 'investmentGrowthPreRetirement' || field === 'investmentGrowthPostRetirement') {
      // When user enters percentages (e.g., 7 for 7%), validate they're between -50 and +50
      if (numValue < -50 || numValue > 50) {
        return; // Ignore invalid input silently
      }
      
      // Ensure lower limit is not greater than upper limit
      if (field === 'growthRateLowerLimit' && numValue > (financialInputs.growthRateUpperLimit * 100)) {
        return;
      }
      if (field === 'growthRateUpperLimit' && numValue < (financialInputs.growthRateLowerLimit * 100)) {
        return;
      }
    }

    // Convert percentage fields (divide by 100), store non-percentage fields as-is
    const finalValue = isPercentage ? numValue / 100 : numValue;

    onUpdate({
      ...financialInputs,
      [field]: finalValue,
    });
  };

  return (
    <div className="p-8 space-y-8">
      {/* Investment Growth Rates */}
      <div className="card">
        <div className="card-header">Investment Growth Rates</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label">Pre-Retirement Growth Rate (%)</label>
            <input
              type="number"
              value={financialInputs.investmentGrowthPreRetirement * 100}
              onChange={(e) => handleChange('investmentGrowthPreRetirement', e.target.value, true)}
              step={0.1}
              min={-50}
              max={50}
              className="w-full"
            />
            <div className="form-hint">
              Annual growth rate while accumulating: {(financialInputs.investmentGrowthPreRetirement * 100).toFixed(1)}%
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Post-Retirement Growth Rate (%)</label>
            <input
              type="number"
              value={financialInputs.investmentGrowthPostRetirement * 100}
              onChange={(e) => handleChange('investmentGrowthPostRetirement', e.target.value, true)}
              step={0.1}
              min={-50}
              max={50}
              className="w-full"
            />
            <div className="form-hint">
              Annual growth rate while withdrawing: {(financialInputs.investmentGrowthPostRetirement * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Growth Scenario Limits */}
      <div className="card-accent">
        <div className="card-header">Growth Projection Bounds</div>
        <p className="text-sm text-gray-400 mb-6">Set lower and upper limit growth rates to visualize best-case and worst-case scenarios</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label">Lower Limit Growth Rate (%)</label>
            <input
              type="number"
              value={financialInputs.growthRateLowerLimit * 100}
              onChange={(e) => handleChange('growthRateLowerLimit', e.target.value, true)}
              step={0.5}
              min={-50}
              max={50}
              className="w-full"
            />
            <div className="form-hint">
              Conservative scenario: {(financialInputs.growthRateLowerLimit * 100).toFixed(1)}%
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Upper Limit Growth Rate (%)</label>
            <input
              type="number"
              value={financialInputs.growthRateUpperLimit * 100}
              onChange={(e) => handleChange('growthRateUpperLimit', e.target.value, true)}
              step={0.5}
              min={-50}
              max={50}
              className="w-full"
            />
            <div className="form-hint">
              Optimistic scenario: {(financialInputs.growthRateUpperLimit * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Inflation & Tax */}
      <div className="card">
        <div className="card-header">Economic Assumptions</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label">Inflation Rate (%)</label>
            <input
              type="number"
              value={financialInputs.inflationRate * 100}
              onChange={(e) => handleChange('inflationRate', e.target.value, true)}
              step={0.1}
              min={0}
              max={50}
              className="w-full"
            />
            <div className="form-hint">
              Annual inflation: {(financialInputs.inflationRate * 100).toFixed(1)}%
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tax Rate (%)</label>
            <input
              type="number"
              value={financialInputs.taxRate * 100}
              onChange={(e) => handleChange('taxRate', e.target.value, true)}
              step={0.1}
              min={0}
              max={50}
              className="w-full"
            />
            <div className="form-hint">
              Effective tax rate: {(financialInputs.taxRate * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Retirement Expenses */}
      <div className="card">
        <div className="card-header">Retirement Expenses</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label">Monthly Retirement Budget ($)</label>
            <input
              type="number"
              value={financialInputs.monthlyRetirementBudget}
              onChange={(e) => handleChange('monthlyRetirementBudget', e.target.value)}
              step={100}
              min={1000}
              className="w-full"
            />
            <div className="form-hint">
              Annual: ${(financialInputs.monthlyRetirementBudget * 12).toLocaleString()}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Survivor Expense Percentage (%)</label>
            <input
              type="number"
              value={financialInputs.survivorExpensePercentage * 100}
              onChange={(e) => handleChange('survivorExpensePercentage', e.target.value, true)}
              step={1}
              min={25}
              max={100}
              className="w-full"
            />
            <div className="form-hint">
              When surviving, reduce expenses to: {(financialInputs.survivorExpensePercentage * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="card">
        <div className="card-header">Financial Goals</div>
        <div className="form-group">
          <label className="form-label">Savings Goal ($)</label>
          <input
            type="number"
            value={financialInputs.savingsGoal}
            onChange={(e) => handleChange('savingsGoal', e.target.value)}
            step={10000}
            min={100000}
            className="w-full"
          />
          <div className="form-hint">
            Target portfolio value: ${financialInputs.savingsGoal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Context Box */}
      <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4">
        <h4 className="font-semibold text-neon-green mb-2 tracking-tight">Setting Realistic Rates</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• <strong>Pre-Retirement Growth:</strong> Historical stock market average is ~7-8% annually</li>
          <li>• <strong>Post-Retirement Growth:</strong> More conservative (5-6%) with balanced portfolio</li>
          <li>• <strong>Inflation:</strong> Historical average 2-3%, current conditions may vary</li>
          <li>• <strong>Monthly Budget:</strong> Think about healthcare, travel, hobbies, emergencies</li>
          <li>• <strong>Growth Bounds:</strong> Use lower/upper limits to model different market scenarios</li>
        </ul>
      </div>
    </div>
  );
}
