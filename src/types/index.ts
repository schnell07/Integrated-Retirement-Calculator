// Core data types for retirement calculator

export interface PersonalInfo {
  name: string;
  birthYear: number;
  retirementAge: number;
  lifeExpectancyAge: number;
}

export interface HouseholdInfo {
  currentYear: number;
  user: PersonalInfo;
  spouse?: PersonalInfo;
}

export interface IncomeSource {
  id: string;
  name: string;
  annualAmount: number;
  growthRate: number;
  owner: 'user' | 'spouse' | 'both'; // who earns this income
  cessationAge?: number; // when does this income stop
  cessationYear?: number; // calculated year when income stops
}

export interface RetirementAccount {
  id: string;
  name: string;
  type: 'Traditional401k' | 'Roth401k' | 'TraditionalIRA' | 'RothIRA' | 'HSA' | '529' | 'Taxable';
  currentValue: number;
  annualContribution: number;
  employerMatch: number;
  employerMatchCap: number;
  owner: 'user' | 'spouse';
  growthRate: number;
}

export interface FinancialInputs {
  inflationRate: number;
  taxRate: number;
  monthlyRetirementBudget: number;
  survivorExpensePercentage: number; // 0.75 for 75%, etc
  savingsGoal: number;
  investmentGrowthPreRetirement: number;
  investmentGrowthPostRetirement: number;
  growthRateLowerLimit: number; // e.g., 0.03 for 3%
  growthRateUpperLimit: number; // e.g., 0.09 for 9%
}

export interface RetirementScenario {
  optimistic: number; // growth rate + percentage buffer
  conservative: number; // growth rate - percentage buffer
}

export interface PortfolioSnapshot {
  date: Date;
  totalValue: number;
  accountValues: Record<string, number>; // account id -> value
  notes?: string;
}

export interface RetirementCalculatorData {
  household: HouseholdInfo;
  incomeSourcesUser: IncomeSource[];
  incomeSourcesSpouse: IncomeSource[];
  accounts: RetirementAccount[];
  financialInputs: FinancialInputs;
  portfolioSnapshots: PortfolioSnapshot[];
  scenarios: Record<string, RetirementScenario>; // scenario name -> upper/lower bounds
  lastUpdated: Date;
}

export interface AnnualProjection {
  year: number;
  age: {
    user: number;
    spouse?: number;
  };
  livingStatus: 'bothAlive' | 'userOnly' | 'spouseOnly' | 'bothPassed';
  
  // Income projections
  incomeUser: number;
  incomeSpouse: number;
  totalIncome: number;
  
  // Portfolio values
  portfolioValueBefore: number;
  contributions: number;
  investmentGrowth: number;
  requiredMinimumDistribution: number;
  withdrawals: number;
  portfolioValueAfter: number;
  
  // Growth scenario bounds
  portfolioValueAfterLowerLimit: number;
  portfolioValueAfterUpperLimit: number;
  
  // Expense tracking
  expenses: number;
  surplus: number;
  
  // Account-level
  accountBalances: Record<string, number>;
}

export interface ProjectionSummary {
  projections: AnnualProjection[];
  goalAchievingYear?: number;
  goalAchievementProbability: number;
  finalPortfolioValue: number;
  totalContributions: number;
  totalWithdrawals: number;
}
