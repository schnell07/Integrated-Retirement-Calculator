# Comprehensive Retirement Calculator

A production-ready financial planning web application that helps users project their retirement portfolio and plan for their financial future with dynamic, life-expectancy-aware calculations.

<!-- CI badge: replace OWNER and REPO with your GitHub owner/repo -->
[![CI](https://github.com/OWNER/REPO/actions/workflows/ci-deploy.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci-deploy.yml)

## Features

### 🎯 Dynamic Core Features

**Fully Customizable Inputs:**
- Personal information for user and spouse (optional)
- Birth years, retirement ages, and life expectancy ages
- Multiple income sources with independent growth rates
- Custom investment accounts (401k, IRA, Roth, HSA, 529, Taxable)
- Financial assumptions (inflation, tax rates, investment returns)

**Intelligent Calculation Engine:**
- Automatic projection to user's life expectancy year
- Life-cycle modeling: Both Alive → Surviving → Passed away
- Individual income cessation at retirement or life expectancy
- Survivor expense reduction (configurable percentage)
- Required Minimum Distribution (RMD) calculations
- Employer matching and contribution limits

**Portfolio Tracking System:**
- Record actual portfolio snapshots over time
- Compare actual vs. projected performance
- Track variance and adjust calculations accordingly
- Historical data persistence

**Dynamic Visualization:**
- Portfolio growth trajectory (area chart)
- Annual cash flow analysis (bar chart)
- Household income timeline (line chart)
- Year-by-year projection tables
- All charts automatically scale to relevant timeframe

### 📱 User Experience

- **Real-time calculations**: Updates automatically as you change inputs
- **Persistent storage**: Uses IndexedDB + localStorage backup
- **Responsive design**: Mobile-friendly interface
- **Dark theme**: Navy investment company aesthetic
- **Collapsible sidebar**: Clean, focused interface
- **Tab-based navigation**: Easy access to all sections

## Project Structure

```
src/
├── components/           # React components
│   ├── Dashboard.tsx     # Overview and KPI dashboard
│   ├── PersonalInfoForm.tsx      # User & spouse setup
│   ├── FinancialInputsForm.tsx    # Economic parameters
│   ├── AccountsManagement.tsx     # Retirement account management
│   ├── IncomeSourcesManagement.tsx # Income stream setup
│   ├── ProjectionCharts.tsx       # Visualization charts
│   └── PortfolioTracking.tsx      # Historical tracking
├── calculations/        # Core calculation logic
│   └── calculator.ts    # Retirement projection engine
├── types/              # TypeScript type definitions
│   └── index.ts
├── hooks/              # Custom React hooks
│   └── useRetirementCalculator.ts # State management
├── storage/            # Data persistence
│   └── database.ts     # IndexedDB + localStorage
├── App.tsx             # Main application component
├── main.tsx            # React entry point
└── index.css           # Tailwind CSS styles
```

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Database**: IndexedDB (with localStorage fallback)
- **State Management**: React Hooks

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will open at `http://localhost:5173/`

## Usage Guide

### 1. Set Up Personal Information
- Enter your birth year (auto-calculates age)
- Set retirement age (default: 65)
- Set life expectancy age (default: 90)
- Optionally add spouse information

### 2. Configure Financial Parameters
- Set investment growth rates (pre/post retirement)
- Configure inflation and tax rates
- Enter monthly retirement budget
- Set savings goal

### 3. Add Income Sources
- Create multiple income streams (salary, consulting, etc.)

## CI / Deployment

This repository includes a GitHub Actions workflow that builds the app on push to `main` and uploads the `dist/` artifact. It can optionally deploy to Netlify when the required secrets are provided.

To enable Netlify auto-deploys from the workflow:

1. Add the following repository secrets in GitHub (`Settings → Secrets & variables → Actions`):
	- `NETLIFY_AUTH_TOKEN` — your Netlify personal access token.
	- `NETLIFY_SITE_ID` — the Netlify site ID where the site should be published.

2. The workflow will run on push to `main` and, if secrets are present, will run `netlify deploy --dir=dist --prod` to publish.

If you prefer Vercel, connect the repository in Vercel dashboard (recommended) and it will handle builds and previews automatically.

### Vercel automatic deploy via GitHub Actions

If you want the workflow to deploy to Vercel automatically (optional), add the following repository secrets:

- `VERCEL_TOKEN` — your Vercel personal token (create at https://vercel.com/account/tokens).

The workflow will run the Vercel CLI deploy (`vercel --prod --token $VERCEL_TOKEN`). If your project is already linked in Vercel the deploy will publish to the right project.

If you want a post-deploy smoke test, add the secret `DEPLOY_URL` containing your site URL (for example `https://your-project.vercel.app`); the workflow will then ping that URL and fail if it does not return HTTP 200.

## Testing

### Local Tests

Run integration tests locally:

```bash
npm run test                # Run all tests (headless)
npm run test:ui            # Run tests with interactive UI
npm run test:headed        # Run tests with visible browser
```

Integration tests verify:
- Dashboard loads and displays KPI cards
- Export buttons (CSV, PDF) are visible and clickable
- Charts render correctly
- Tab navigation works without errors
- Responsive layout on mobile
- No critical console errors

### CI Integration Tests

When you push to `main` and deploy to Vercel/Netlify, if you provide the `DEPLOY_URL` secret, the workflow will:
1. Deploy the built `dist/` folder to your host
2. Run a curl smoke test to verify HTTP 200
3. Run Playwright integration tests against the deployed site
4. Upload test results as an artifact (available for 30 days)
- Set annual growth rates for each income
- Separately manage spouse income if applicable
- Income automatically stops at retirement age

### 4. Manage Retirement Accounts
- Add unlimited retirement accounts
- Support for: 401k, Roth 401k, Traditional IRA, Roth IRA, HSA, 529, Taxable
- Track current values and contribution rates
- Configure employer matching

### 5. View Projections
- Dashboard shows current portfolio and goal progress
- Charts display portfolio growth, cash flows, and income timeline
- Detailed year-by-year projection table
- Automatically scales to your life expectancy

### 6. Track Actual Performance
- Periodically add actual portfolio snapshots
- Compare actual vs. projected values
- Refine assumptions based on real data

## Calculation Details

### Projection Period
Projections run from the current year through the latest life expectancy year (maximum of user and spouse life expectancy ages).

### Living Status Transitions
The calculator models four stages:
- **Both Alive**: Full retirement budget expenses
- **User Only**: Reduced expenses (configurable %50-100)
- **Spouse Only**: Reduced expenses for surviving spouse
- **Both Passed**: Portfolio stops growing (estate value)

### Income Calculation
- Pre-retirement: Grows annually by configured growth rate
- At retirement age: Income stops (modeled as stopping point)
- Growth rate: Annual compounding (e.g., salary raises)

### Portfolio Growth
- **Pre-Retirement**: Higher growth rate (typically 6-8%)
- **Post-Retirement**: Conservative growth rate (typically 4-6%)
- Contributions stop at retirement
- Withdrawals begin when income insufficient

### Required Minimum Distributions (RMD)
- Calculation begins at age 72
- Based on IRS divisor tables
- Can force additional portfolio withdrawals

### Employer Matching
- Calculated as percentage of personal contribution
- Capped at maximum percentage of salary
- Example: 5% match capped at 6% of salary

## Data Persistence

### IndexedDB Structure
- **calculatorData**: Main projection data
- **portfolioSnapshots**: Historical portfolio records with dates

### LocalStorage Backup
- Auto-saves critical configuration
- Fallback if IndexedDB unavailable
- Key: `retirement_calculator_autosave`

## Advanced Features

### What-If Scenarios
- Modify any parameter and calculations update instantly
- Compare multiple scenarios by adjusting growth rates
- Adjust life expectancy to see impact on portfolio

### Variance Analysis
- Compare actual portfolio performance to projections
- Identify over/under-performance
- Gap analysis between current and goal

### Spouse Planning
- Independent retirement ages
- Separate income streams
- Different account allocations
- Survivor expense modeling

## Performance Considerations

- Calculations debounced to 500ms to prevent excessive recomputation
- Projections pre-calculated and cached
- Charts only re-render when data changes
- IndexedDB used for efficient data storage

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires JavaScript and IndexedDB support

## Known Limitations

- RMD calculations use simplified IRS table
- Tax calculations are simplified (effective tax rate only)
- No support for strategic Roth conversions
- Limited international currency support
- No data export to Excel/PDF (future feature)

## Future Enhancements

- [ ] PDF report generation
- [ ] Excel export functionality
- [ ] Monte Carlo simulation for probability analysis
- [ ] Multiple scenario comparison view
- [ ] Social Security integration
- [ ] Tax optimization recommendations
- [ ] Inflation-adjusted spending analysis
- [ ] Healthcare cost projections
- [ ] Multi-currency support
- [ ] Team/advisor sharing capabilities

## Contributing

This project is a comprehensive financial planning tool. Enhancements and bug fixes are welcome.

## License

MIT License - Feel free to use and modify as needed.

## Disclaimer

This calculator provides projections based on entered assumptions. These projections are estimates and should not be considered financial advice. Please consult with a qualified financial advisor for personalized guidance. Past performance does not guarantee future results.

## Support

For issues, questions, or feature requests, please use the issue tracker or contact support.

---

**Last Updated**: February 2026
**Version**: 1.0.0
