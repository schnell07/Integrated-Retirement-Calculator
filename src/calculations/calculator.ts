import {
  RetirementCalculatorData,
  AnnualProjection,
  ProjectionSummary,
  IncomeSource,
  RetirementAccount,
  PortfolioSnapshot,
} from '../types';

/**
 * Core retirement calculation engine
 * Handles all projection logic, life cycle modeling, and financial calculations
 */
export class RetirementCalculator {
  private data: RetirementCalculatorData;

  constructor(data: RetirementCalculatorData) {
    this.data = data;
  }

  /**
   * Main calculation method - generates complete projection to life expectancy
   */
  calculate(): ProjectionSummary {
    try {
      const projections: AnnualProjection[] = [];
      
      const userBirthYear = this.data.household.user.birthYear;
      const spouseBirthYear = this.data.household.spouse?.birthYear;
      const currentYear = this.data.household.currentYear;
      const userLifeExpectancy = this.data.household.user.lifeExpectancyAge;
      const spouseLifeExpectancy = this.data.household.spouse?.lifeExpectancyAge || 0;

      // Validate input data
      if (!userBirthYear || !currentYear || !userLifeExpectancy) {
        throw new Error('Invalid birth year, current year, or life expectancy');
      }
      if (userLifeExpectancy < 1 || userLifeExpectancy > 150) {
        throw new Error('Life expectancy must be between 1 and 150');
      }
      if (currentYear < 1900 || currentYear > 2100) {
        throw new Error('Current year must be between 1900 and 2100');
      }
    
    // Calculate projection end year - latest life expectancy year
    const latestDeathYear = Math.max(
      userBirthYear + userLifeExpectancy,
      spouseBirthYear ? spouseBirthYear + spouseLifeExpectancy : userBirthYear + userLifeExpectancy
    );

    let portfolioValue = this.calculateCurrentPortfolioValue();
    let portfolioValueLowerLimit = portfolioValue;
    let portfolioValueUpperLimit = portfolioValue;
    let accountBalances: Record<string, number> = {};
    
    // Initialize account balances
    this.data.accounts.forEach(account => {
      accountBalances[account.id] = account.currentValue;
    });

    for (let year = currentYear; year <= latestDeathYear; year++) {
      const userAge = year - userBirthYear;
      const spouseAge = spouseBirthYear ? year - spouseBirthYear : undefined;

      // Determine living status
      const userAlive = userAge <= userLifeExpectancy;
      const spouseAlive = spouseBirthYear ? spouseAge! <= spouseLifeExpectancy : false;

      let livingStatus: 'bothAlive' | 'userOnly' | 'spouseOnly' | 'bothPassed';
      if (userAlive && spouseAlive) {
        livingStatus = 'bothAlive';
      } else if (userAlive && !spouseAlive) {
        livingStatus = 'userOnly';
      } else if (!userAlive && spouseAlive) {
        livingStatus = 'spouseOnly';
      } else {
        livingStatus = 'bothPassed';
      }

      // Calculate income for this year
      const incomeUser = this.calculateAnnualIncome(
        this.data.incomeSourcesUser,
        userAge,
        this.data.household.user.retirementAge,
        year
      );

      const incomeSpouse = this.calculateAnnualIncome(
        this.data.incomeSourcesSpouse || [],
        spouseAge || 0,
        this.data.household.spouse?.retirementAge || 0,
        year
      );

      // Calculate expenses
      let monthlyExpense = this.data.financialInputs.monthlyRetirementBudget;
      // Adjust for survivor - reduce expenses if spouse passes
      if (!spouseAlive && spouseBirthYear) {
        monthlyExpense *= this.data.financialInputs.survivorExpensePercentage;
      }
      if (!userAlive && spouseBirthYear) {
        monthlyExpense *= this.data.financialInputs.survivorExpensePercentage;
      }

      const annualExpenses = monthlyExpense * 12;

      // Calculate contributions and growth
      let contributions = 0;
      let investmentGrowth = 0;
      let investmentGrowthLower = 0;
      let investmentGrowthUpper = 0;
      let withdrawals = 0;
      let rmd = 0;

      if (livingStatus !== 'bothPassed') {
        // Calculate contributions
        contributions = this.calculateContributions(
          this.data.accounts,
          year,
          userAge,
          spouseAge
        );

        // Calculate investment growth based on stage
        const isRetired = (userAge >= this.data.household.user.retirementAge) ||
                         (spouseBirthYear && spouseAge! >= this.data.household.spouse!.retirementAge);
        
        const growthRate = isRetired
          ? this.data.financialInputs.investmentGrowthPostRetirement
          : this.data.financialInputs.investmentGrowthPreRetirement;

        investmentGrowth = portfolioValue * growthRate;
        
        // Calculate scenario bounds lower and upper limits
        investmentGrowthLower = portfolioValueLowerLimit * this.data.financialInputs.growthRateLowerLimit;
        investmentGrowthUpper = portfolioValueUpperLimit * this.data.financialInputs.growthRateUpperLimit;

        // Calculate required minimum distributions for eligible account holders 72+ years old
        rmd = this.calculateRMD(portfolioValue, userAge, spouseAge);

        // Calculate withdrawals (max of expenses - income, or more if needed)
        withdrawals = Math.max(0, annualExpenses - incomeUser - incomeSpouse, rmd);
      }

      portfolioValue = portfolioValue + contributions + investmentGrowth - withdrawals;
      portfolioValue = Math.max(0, portfolioValue); // Can't go negative
      
      // Update scenario bounds
      portfolioValueLowerLimit = portfolioValueLowerLimit + contributions + investmentGrowthLower - withdrawals;
      portfolioValueLowerLimit = Math.max(0, portfolioValueLowerLimit);
      
      portfolioValueUpperLimit = portfolioValueUpperLimit + contributions + investmentGrowthUpper - withdrawals;
      portfolioValueUpperLimit = Math.max(0, portfolioValueUpperLimit);

      const projection: AnnualProjection = {
        year,
        age: {
          user: userAge,
          spouse: spouseAge,
        },
        livingStatus,
        incomeUser,
        incomeSpouse,
        totalIncome: incomeUser + incomeSpouse,
        portfolioValueBefore: portfolioValue - contributions - investmentGrowth + withdrawals,
        contributions,
        investmentGrowth,
        requiredMinimumDistribution: rmd,
        withdrawals,
        portfolioValueAfter: portfolioValue,
        portfolioValueAfterLowerLimit: portfolioValueLowerLimit,
        portfolioValueAfterUpperLimit: portfolioValueUpperLimit,
        expenses: annualExpenses,
        surplus: (incomeUser + incomeSpouse) - annualExpenses,
        accountBalances: { ...accountBalances },
      };

      projections.push(projection);

      // Update account balances proportionally (simplified for demo)
      const totalAccountValue = Object.values(accountBalances).reduce((a, b) => a + b, 0);
      if (totalAccountValue > 0) {
        this.data.accounts.forEach(account => {
          const proportion = accountBalances[account.id] / totalAccountValue;
          const accountContribution = contributions * proportion;
          const accountGrowth = investmentGrowth * proportion;
          const accountWithdrawal = withdrawals * proportion;
          
          accountBalances[account.id] = accountBalances[account.id] + accountContribution + accountGrowth - accountWithdrawal;
          accountBalances[account.id] = Math.max(0, accountBalances[account.id]);
        });
      }
    }

    // Determine goal achievement
    const savingsGoalInflationAdjusted = this.data.financialInputs.savingsGoal *
      Math.pow(1 + this.data.financialInputs.inflationRate, (latestDeathYear - currentYear));

    const goalAchievingYear = projections.find(p => p.portfolioValueAfter >= savingsGoalInflationAdjusted)?.year;
    const goalAchievementProbability = goalAchievingYear ? 1.0 : 0.0;

      return {
        projections,
        goalAchievingYear,
        goalAchievementProbability,
        finalPortfolioValue: projections[projections.length - 1]?.portfolioValueAfter || 0,
        totalContributions: projections.reduce((sum, p) => sum + p.contributions, 0),
        totalWithdrawals: projections.reduce((sum, p) => sum + p.withdrawals, 0),
      };
    } catch (error) {
      console.error('Calculation failed:', error);
      throw error;
    }
  }

  private calculateCurrentPortfolioValue(): number {
    return this.data.accounts.reduce((sum, account) => sum + account.currentValue, 0);
  }

  private calculateAnnualIncome(
    sources: IncomeSource[],
    age: number,
    retirementAge: number,
    year: number
  ): number {
    return sources.reduce((total, source) => {
      // Check if income has ceased
      if (source.cessationAge && age >= source.cessationAge) {
        return total;
      }

      // Check if person is retired
      if (age >= retirementAge) {
        return total; // Income stops at retirement for personal income
      }

      // Calculate inflation-adjusted income
      const yearsSinceStart = year - this.data.household.currentYear;
      const inflatedIncome = source.annualAmount * 
        Math.pow(1 + source.growthRate, yearsSinceStart);

      return total + inflatedIncome;
    }, 0);
  }

  private calculateContributions(
    accounts: RetirementAccount[],
    _year: number,
    userAge: number,
    spouseAge?: number
  ): number {
    return accounts.reduce((total, account) => {
      const owner = account.owner;
      const age = owner === 'user' ? userAge : spouseAge || 0;
      const retirementAge = owner === 'user' 
        ? this.data.household.user.retirementAge
        : this.data.household.spouse?.retirementAge || 0;

      // No contributions after retirement
      if (age >= retirementAge) {
        return total;
      }

      const contribution = account.annualContribution;
      const match = Math.min(
        account.employerMatch * contribution,
        account.employerMatchCap
      );

      return total + contribution + match;
    }, 0);
  }

  private calculateRMD(portfolioValue: number, userAge: number, spouseAge?: number): number {
    const RMD_AGE = 72;
    let rmd = 0;

    if (userAge >= RMD_AGE) {
      const divisor = this.getRMDDivisor(userAge);
      rmd += portfolioValue / divisor;
    }

    if (spouseAge && spouseAge >= RMD_AGE) {
      const divisor = this.getRMDDivisor(spouseAge);
      rmd += portfolioValue / divisor;
    }

    return rmd;
  }

  private getRMDDivisor(age: number): number {
    // IRS RMD divisor table (simplified)
    const divisors: Record<number, number> = {
      72: 27.4,
      73: 26.5,
      74: 25.5,
      75: 24.6,
      76: 23.7,
      77: 22.9,
      78: 22.0,
      79: 21.1,
      80: 20.2,
      81: 19.4,
      82: 18.5,
      83: 17.7,
      84: 16.8,
      85: 16.0,
    };

    if (age in divisors) {
      return divisors[age];
    }

    // For ages beyond table
    if (age > 85) {
      return 14.8;
    }

    return 27.4; // Default
  }

  /**
   * Calculate variance between actual and projected values
   */
  calculateVariance(actualSnapshots: PortfolioSnapshot[], projections: AnnualProjection[]): {
    variance: number;
    lastActual: number;
    lastProjected: number;
  } {
    if (actualSnapshots.length === 0) {
      return { variance: 0, lastActual: 0, lastProjected: 0 };
    }

    const lastSnapshot = actualSnapshots[actualSnapshots.length - 1];
    const matchingYear = projections.find(p => p.year === lastSnapshot.date.getFullYear());

    if (!matchingYear) {
      return { variance: 0, lastActual: lastSnapshot.totalValue, lastProjected: 0 };
    }

    const variance = lastSnapshot.totalValue - matchingYear.portfolioValueAfter;
    return {
      variance,
      lastActual: lastSnapshot.totalValue,
      lastProjected: matchingYear.portfolioValueAfter,
    };
  }
}
