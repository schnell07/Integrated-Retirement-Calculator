# Quick Reference Guide

## Common Tasks

### Adding a New Retirement Account Type

1. **Update Type Definition** (`src/types/index.ts`):
```typescript
export interface RetirementAccount {
  type: 'Traditional401k' | 'Roth401k' | 'TraditionalIRA' | 'RothIRA' | 'HSA' | '529' | 'Taxable' | 'NewType';
  // ...rest remains same
}
```

2. **Update Component** (`src/components/AccountsManagement.tsx`):
```typescript
const ACCOUNT_TYPES = [
  'Traditional401k',
  'Roth401k',
  'TraditionalIRA',
  'RothIRA',
  'HSA',
  '529',
  'Taxable',
  'NewType',  // Add here
];
```

### Adjusting Investment Growth Rates

```typescript
// Default in hook
investmentGrowthPreRetirement: 0.07,  // 7% before retirement
investmentGrowthPostRetirement: 0.05,  // 5% after retirement

// Change in useRetirementCalculatorInitial()
// Or use Financial Inputs form in UI
```

### Changing the Navy Theme Color

1. **Edit Tailwind Config** (`tailwind.config.js`):
```javascript
extend: {
  colors: {
    navy: {
      50: '#f8f9ff',
      // ... adjust hex values
      950: '#0a0e3a',
    }
  }
}
```

2. **Update Background** (`index.html`):
```html
<body class="bg-navy-950 text-white">
```

### Adding a New Chart

1. **Create Chart Data**:
```typescript
const chartData = projections.map(p => ({
  year: p.year,
  customMetric: p.someValue,
}));
```

2. **Import Recharts**:
```typescript
import { LineChart, Line, ... } from 'recharts';
```

3. **Render Chart**:
```typescript
<ResponsiveContainer width="100%" height="100%">
  <LineChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" stroke="#1f2f8c" />
    <XAxis dataKey="year" />
    <YAxis />
    <Line type="monotone" dataKey="customMetric" stroke="#8884d8" />
  </LineChart>
</ResponsiveContainer>
```

### Modifying Calculation Logic

1. **Edit Calculator** (`src/calculations/calculator.ts`):
```typescript
private calculateAnnualIncome(...) {
  // Modify income calculation
  // Inflation-adjusted: baseAmount * (1 + rate)^years
  // Return total income for the year
}
```

2. **Test Changes**:
```bash
npm run build  # Verify no errors
npm run dev    # Test in browser
```

### Adding Portfolio Snapshot

In `PortfolioTracking.tsx`:
```typescript
const handleSave = () => {
  const newSnapshot: PortfolioSnapshot = {
    date: new Date(formData.date),
    totalValue: formData.totalValue,
    accountValues: {},  // Could populate with current values
    notes: formData.notes,
  };
  // Pass to parent component to save via hook
};
```

### Updating Financial Parameters

```typescript
// Via hook
const { updateFinancialInputs } = useRetirementCalculator();

updateFinancialInputs({
  ...currentInputs,
  inflationRate: 0.04,  // Changed from 0.03
  investmentGrowthPreRetirement: 0.08,
});
```

## API Reference

### RetirementCalculator Methods

```typescript
// Create calculator instance
const calc = new RetirementCalculator(data);

// Main calculation - returns year-by-year projections
const summary: ProjectionSummary = calc.calculate();

// Get variance between actual and projected
const variance = calc.calculateVariance(snapshots, projections);
```

### useRetirementCalculator Hook

```typescript
// In components:
const {
  data,                           // Current data object
  projectionSummary,              // Latest calculations
  isLoading,                      // true while loading
  error,                          // Error string or null
  
  // Update functions
  updateData,                     // Replace entire data
  updateHousehold,                // Update personal info
  updateFinancialInputs,          // Update economics
  addAccount,                     // Add new account
  updateAccount,                  // Modify existing account
  deleteAccount,                  // Remove account
  addIncomeSource,                // Add income stream
  updateIncomeSource,             // Modify income
  deleteIncomeSource,             // Remove income
} = useRetirementCalculator();
```

### Database Service

```typescript
import { DatabaseService } from './storage/database';

const db = new DatabaseService();

// Initialize
await db.init();

// Save/Load data
await db.saveData(calculatorData);
const data = await db.getData();

// Manage snapshots
const id = await db.addSnapshot(snapshot);
const snapshots = await db.getSnapshots();
await db.deleteSnapshot(id);

// Clear all
await db.clearAll();
```

## Component Patterns

### Form Input Pattern

```typescript
interface Props {
  data: RetirementCalculatorData;
  onUpdate: (updated: Partial<RetirementCalculatorData>) => void;
}

export default function MyForm({ data, onUpdate }: Props) {
  const handleChange = (field: string, value: any) => {
    onUpdate({
      ...data,
      [field]: value,
    });
  };

  return (
    <input
      value={data.someField}
      onChange={(e) => handleChange('someField', e.target.value)}
    />
  );
}
```

### Data Display Pattern

```typescript
<div className="card">
  <div className="card-header">Section Title</div>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <p className="text-navy-400">Label</p>
      <p className="font-bold">{value}</p>
    </div>
  </div>
</div>
```

### Chart Pattern

```typescript
<div className="card">
  <h3 className="card-header">Chart Title</h3>
  <div className="w-full h-80">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2f8c" />
        <XAxis dataKey="year" stroke="#7a94ff" />
        <YAxis stroke="#7a94ff" />
        <Tooltip />
        <Line dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>
```

## Styling with Tailwind

### Common Utilities

```typescript
// Layout
className="flex items-center justify-between"
className="grid grid-cols-2 md:grid-cols-3 gap-4"

// Spacing
className="p-6"    // Padding
className="m-4"    // Margin
className="gap-4"  // Grid gap

// Colors - Using navy palette
className="bg-navy-900"  // Background
className="text-navy-100" // Text - light
className="text-navy-400" // Text - muted
className="border border-navy-700" // Border

// Typography
className="text-3xl font-bold text-navy-100"
className="text-sm text-navy-400"

// Responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Interactive
className="hover:bg-navy-800 transition-colors"
className="focus:outline-none focus:ring-2 focus:ring-navy-400"
```

### Custom Classes in index.css

```css
.card { }               /* Blue background card */
.card-header { }        /* Card title styling */
.btn-primary { }        /* Primary button */
.btn-secondary { }      /* Secondary button */
.form-group { }         /* Form field group */
.form-label { }         /* Form label */
.badge { }              /* Status badge */
```

## Testing Calculations

### Manual Test Data

```typescript
const testData: RetirementCalculatorData = {
  household: {
    currentYear: 2026,
    user: {
      name: 'Test User',
      birthYear: 1970,
      retirementAge: 65,
      lifeExpectancyAge: 90,
    },
  },
  incomeSourcesUser: [{
    id: '1',
    name: 'Salary',
    annualAmount: 100000,
    growthRate: 0.03,
    owner: 'user',
  }],
  incomeSourcesSpouse: [],
  accounts: [{
    id: '1',
    name: '401k',
    type: 'Traditional401k',
    currentValue: 500000,
    annualContribution: 23500,
    employerMatch: 0.05,
    employerMatchCap: 0.05,
    owner: 'user',
    growthRate: 0.07,
  }],
  financialInputs: {
    inflationRate: 0.03,
    taxRate: 0.25,
    monthlyRetirementBudget: 5000,
    survivorExpensePercentage: 0.75,
    savingsGoal: 2000000,
    investmentGrowthPreRetirement: 0.07,
    investmentGrowthPostRetirement: 0.05,
  },
  portfolioSnapshots: [],
  scenarios: {},
  lastUpdated: new Date(),
};
```

### Calculation Verification

```typescript
const calc = new RetirementCalculator(testData);
const result = calc.calculate();

console.log('First year:', result.projections[0]);
console.log('Goal achieved:', result.goalAchievingYear);
console.log('Final value:', result.finalPortfolioValue);
```

## Debugging Checklist

- [ ] Check browser console for errors
- [ ] Verify IndexedDB has data: DevTools → Application → IndexedDB
- [ ] Check localStorage: DevTools → Application → Storage → Local Storage
- [ ] Verify React components render: React DevTools browser extension
- [ ] Check network requests (if using backend): Network tab
- [ ] Validate TypeScript: `npm run build`
- [ ] Compare calculation with spreadsheet
- [ ] Test with edge cases (age 120, $0 portfolio, etc.)

## Performance Tips

1. **Memoize Components**:
```typescript
import { memo } from 'react';
export default memo(MyComponent);
```

2. **Debounce Calculations** (already done in hook):
```typescript
const timeoutId = setTimeout(saveAndCalculate, 500);
return () => clearTimeout(timeoutId);
```

3. **Lazy Load Images/Charts**:
```typescript
const Charts = lazy(() => import('./ProjectionCharts'));
<Suspense fallback={<LoadingSpinner />}>
  <Charts data={data} />
</Suspense>
```

4. **Profile Bundle**:
```bash
npm install -D rollup-plugin-visualizer
# Add to vite.config.ts
```

## Useful Links

- **Recharts Docs**: https://recharts.org/api
- **Tailwind Components**: https://tailwindui.com
- **React Hooks**: https://react.dev/reference/react
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Vite Docs**: https://vitejs.dev/
- **IndexedDB MDN**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

## Common Formulas

### Compound Growth
```
Future Value = Present Value × (1 + Rate)^Years
Example: $100K × (1.07)^10 = $196,715
```

### Inflation Adjustment
```
Future Amount = Current Amount × (1 + Inflation Rate)^Years
Example: $5,000/month × (1.03)^20 = $9,030/month
```

### RMD Calculation
```
RMD = Account Balance / IRS Divisor
Age 72: Divisor = 27.4
```

### Employer Match
```
Match Amount = Employee Contribution × Match Rate → Capped at % of Salary
Example: $10K contrib × 50% = $5K match → Capped at 6% salary ($7.2K max)
```

---

Quick tip: Use `Ctrl+F` to find specific patterns or methods in this guide!
