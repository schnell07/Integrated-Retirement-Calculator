# Development Guide

## Project Overview

This is a comprehensive retirement calculator web application built with React, TypeScript, and Vite. It provides sophisticated financial planning capabilities with dynamic, life-expectancy-aware projections.

## Architecture

### Core Components

#### 1. **Calculation Engine** (`src/calculations/calculator.ts`)
The heart of the application - performs all projection calculations.

**Key Methods:**
- `calculate()`: Generates complete year-by-year projections to life expectancy
- `calculateCurrentPortfolioValue()`: Sums all account values
- `calculateAnnualIncome()`: Computes income with growth rates
- `calculateContributions()`: Determines contributions + employer matching
- `calculateRMD()`: Computes required minimum distributions

**Life-Cycle Modeling:**
```
Both Alive → User/Spouse Only → Both Passed
```

The calculator models transitions through these stages and adjusts expenses accordingly.

#### 2. **Data Types** (`src/types/index.ts`)
Strong TypeScript interfaces for type safety:

```typescript
- RetirementCalculatorData: Main data container
- PersonalInfo: Individual demographic data
- HouseholdInfo: Household composition
- RetirementAccount: Account holdings
- IncomeSource: Income stream definition
- FinancialInputs: Economic parameters
- AnnualProjection: Single year's projection
- ProjectionSummary: Complete projection results
```

#### 3. **State Management** (`src/hooks/useRetirementCalculator.ts`)
Custom React hook managing application state:

**Responsibilities:**
- Load/save data from IndexedDB
- Trigger calculations on data changes
- Provide CRUD operations for accounts and income
- Debounce calculations (500ms) for performance
- Auto-save to localStorage as backup

**State Structure:**
```
{
  data: RetirementCalculatorData (null while loading)
  projectionSummary: ProjectionSummary (null while computing)
  isLoading: boolean
  error: string | null
}
```

#### 4. **Data Persistence** (`src/storage/database.ts`)
Manages IndexedDB and localStorage:

**IndexedDB Stores:**
- `calculatorData`: Main configuration (single entry)
- `portfolioSnapshots`: Historical portfolio records (with date index)

**LocalStorage:**
- Backup of main data
- Key: `retirement_calculator_autosave`
- Retrieved if IndexedDB unavailable

#### 5. **Components**

**Dashboard** (`src/components/Dashboard.tsx`)
- KPI cards with current portfolio, goal progress, timeline
- Personal information summary
- Financial overview
- Goal achievement status

**Personal Information Form** (`src/components/PersonalInfoForm.tsx`)
- Birth year (auto-calculates current age)
- Retirement age with year projection
- Life expectancy age with death year projection
- Spouse management (add/remove)

**Financial Inputs Form** (`src/components/FinancialInputsForm.tsx`)
- Investment growth rates (pre/post retirement)
- Inflation and tax rates
- Monthly retirement budget
- Survivor expense percentage
- Savings goal

**Accounts Management** (`src/components/AccountsManagement.tsx`)
- Add/edit/delete retirement accounts
- Support for 7 account types
- Current value and contribution tracking
- Employer matching configuration
- Account-level growth rates

**Income Sources Management** (`src/components/IncomeSourcesManagement.tsx`)
- Manage multiple income streams
- Separate user vs. spouse income
- Annual growth rates for each source
- 10-year projection preview

**Projection Charts** (`src/components/ProjectionCharts.tsx`)
- Portfolio growth trajectory (area chart)
- Annual cash flow analysis (bar chart)
- Household income timeline (line chart)
- Year-by-year projection table (first 20 years)

**Portfolio Tracking** (`src/components/PortfolioTracking.tsx`)
- Record portfolio snapshots with dates
- Compare actual vs. projected values
- Track growth between snapshots
- Notes field for context

### Data Flow

```
User Input
    ↓
Component State Updates
    ↓
useRetirementCalculator Hook
    ↓
Debounce (500ms)
    ↓
RetirementCalculator.calculate()
    ↓
Updated Projections
    ↓
Save to IndexedDB + localStorage
    ↓
Component Re-renders
```

## Key Algorithms

### Portfolio Projection Algorithm

```
For each year from current to life_expectancy_year:
  1. Determine living status (both alive, surviving, both passed)
  2. Calculate annual income (inflation-adjusted)
  3. Calculate expenses (reduced for survivor)
  4. Calculate contributions (stops at retirement)
  5. Calculate investment growth (based on balance)
  6. Calculate RMD (age 72+)
  7. Calculate withdrawals (needs-based or RMD)
  8. Update portfolio value
  9. Distribute across accounts proportionally
```

### Income Calculation

**Base Formula:**
```
Annual Income = Base Amount × (1 + Growth Rate)^(Years Since Now)
```

**Conditions:**
- Income only during working years (pre-retirement)
- Grows with configured growth rate (salary raises, etc.)
- Stops at retirement age OR if cessation age reached

### Contribution Calculation

**For Each Account:**
```
Employee Contribution: Configured annual contribution
Employer Match: min(
  Employee Contribution × Match Rate,
  Annual Salary × Match Cap %
)
Total Contribution = Employee + Employer
Stops at retirement age
```

### RMD Calculation

**Triggers at Age 72:**
```
RMD = Portfolio Balance / RMD Divisor
RMD Divisor from IRS tables (27.4 at 72, decreasing by age)
```

## Performance Optimizations

1. **Debounced Calculations**: 500ms debounce prevents excessive recomputation
2. **Cached Projections**: Stored in component state, only recalculated on data change
3. **Efficient Re-renders**: React memoization on chart components
4. **IndexedDB Indexing**: Date index on portfolio snapshots for efficient queries
5. **Lazy Loading**: Charts lazy-loaded after initial load

## Configuration

### Vite Config (`vite.config.ts`)
```typescript
{
  server: { port: 5173, open: true },
  build: { rollupOptions: {...} }
}
```

### Tailwind Config (`tailwind.config.js`)
- Custom navy color palette (investment company aesthetic)
- Dark-first design
- Responsive utilities

### TypeScript Config (`tsconfig.json`)
- Target: ES2020
- Strict mode enabled
- React JSX transform

## Development Workflow

### Setting Up

```bash
# Install dependencies
npm install

# Start dev server (opens browser automatically)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### File Organization

- **Components**: One component per file in `components/` directory
- **Types**: Centralized in `types/index.ts`
- **Utilities**: Calculation logic in `calculations/`, storage in `storage/`
- **Hooks**: Custom hooks in `hooks/`
- **Styles**: Global styles in `index.css` (Tailwind)

### Adding a New Feature

1. **Define Types**: Add necessary interfaces to `types/index.ts`
2. **Calculation Logic**: Implement in `calculations/calculator.ts` if needed
3. **Component**: Create new component in `components/`
4. **Integration**: Wire up in `App.tsx` navigation and `useRetirementCalculator` hook
5. **Styling**: Use Tailwind utilities + `index.css` classes

### Debugging

1. **Redux DevTools**: Components log their state in console
2. **React DevTools**: Browser extension for component inspection
3. **Calculation Debugging**: Add console.logs to `calculator.ts` methods
4. **IndexedDB Debugging**: Use browser DevTools "Storage" → "Indexed Databases"

## Testing Scenarios

### Scenario 1: Basic Single User
- User: Age 40, retire at 65, life expectancy 85
- $500K current portfolio, $15K annual contribution
- Goal: $2M at retirement

**Expected**: Portfolio reaches ~$1.2M at retirement, life expectancy year shows ~$150K remaining

### Scenario 2: Couple with Different Ages
- User: Age 45, spouse 42
- Different retirement ages (user 65, spouse 63)
- Joint accounts + separate accounts
- Survivor expense: 75%

**Expected**: Projections extend to latest life expectancy, expenses reduce when one spouse passes

### Scenario 3: Multiple Income Streams
- Primary salary: $100K, growing 3% annually
- Side income: $30K, growing 2% annually
- Both stop at retirement at age 65

**Expected**: Income peaks pre-retirement, drops to zero at retirement age

### Scenario 4: Inflation Impact
- Monthly budget: $5K (today's dollars)
- Inflation: 3% annually
- 30-year retirement

**Expected**: Actual spending grows to ~$12K/month by age 95

## Deployment

### Building for Production

```bash
npm run build
```

Creates optimized `dist/` folder ready for hosting:
- `index.html`: Main HTML entry point
- `assets/`: Bundled JS and CSS
- Size: ~600KB uncompressed (mostly recharts library)

### Hosting Options

1. **Vercel** (recommended for Vite)
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Netlify**
   - Connect GitHub repo
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Traditional Server**
   - Upload `dist/` to web server
   - Configure server to serve `index.html` for all routes (SPA)

## Browser Support

- Chrome/Edge 90+ (primary)
- Firefox 88+
- Safari 14+
- Requires:
  - ES2020 JavaScript support
  - IndexedDB API
  - LocalStorage
  - CSS Grid/Flexbox

## Future Enhancement Areas

### Phase 2 (Medium-term)
- [ ] Monte Carlo simulation for probability analysis
- [ ] Social Security integration with automatic calculations
- [ ] Tax optimization recommendations
- [ ] Healthcare cost projections

### Phase 3 (Long-term)
- [ ] PDF report generation
- [ ] Excel export with formulas
- [ ] Multi-currency support
- [ ] Advisor/team sharing capabilities
- [ ] Real-time market data integration
- [ ] Mobile app (React Native)

### Infrastructure
- [ ] Backend API for multi-device sync
- [ ] User authentication
- [ ] Cloud data backup
- [ ] Premium features tier

## Common Issues

### Issue: IndexedDB Not Persisting
**Solution**: Browser may be in private/incognito mode or quota exceeded
- Use fallback localStorage
- Clear old data with `localStorage.clear()`

### Issue: Large Bundle Size
**Cause**: Recharts library (~200KB gzipped)
**Solutions**:
1. Code split with dynamic imports
2. Use lighter charting library (react-simple-charts)
3. Lazy load charts component

### Issue: Slow Calculations
**Solution**: Enable debouncing in hook
- Current: 500ms debounce
- Increase if needed
- Add loading indicator during calculation

## Related Documentation

- [Vite Documentation](https://vitejs.dev)
- [React 18 Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

**Last Updated**: February 2026
