import { useState, useCallback, useEffect } from 'react';
import { RetirementCalculatorData, ProjectionSummary } from '../types';
import { RetirementCalculator } from '../calculations/calculator';
import { DatabaseService, localStorageService } from '../storage/database';

const db = new DatabaseService();
const AUTOSAVE_KEY = 'retirement_calculator_autosave';

export const useRetirementCalculator = () => {
  const [data, setData] = useState<RetirementCalculatorData | null>(null);
  const [projectionSummary, setProjectionSummary] = useState<ProjectionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldSkipCalculation, setShouldSkipCalculation] = useState(false);

  // Initialize and load data
  useEffect(() => {
    const initializeData = async () => {
      try {
        await db.init();
        
        let savedData = await db.getData();
        
        if (!savedData) {
          // Load default data if available
          const autosavedData = localStorageService.getKey<RetirementCalculatorData>(AUTOSAVE_KEY);
          if (autosavedData) {
            savedData = autosavedData;
          } else {
            // Create initial default data
            savedData = useRetirementCalculatorInitial();
          }
        }
        
        // Sanitize all numeric fields to ensure they're in valid ranges
        if (savedData.household?.user) {
          const user = savedData.household.user;
          const currentYear = new Date().getFullYear();
          
          // Validate and fix birth year (should be 1900-2025)
          if (!user.birthYear || user.birthYear < 1900 || user.birthYear > currentYear) {
            user.birthYear = 1970;
          }
          
          // Validate and fix retirement age (should be 50-85)
          if (user.retirementAge < 50 || user.retirementAge > 85) {
            user.retirementAge = 65;
          }
          
          // Validate and fix life expectancy age (should be 70-120)
          if (user.lifeExpectancyAge < 70 || user.lifeExpectancyAge > 120) {
            user.lifeExpectancyAge = 90;
          }
        }
        
        // Same for spouse if exists
        if (savedData.household?.spouse) {
          const spouse = savedData.household.spouse;
          const currentYear = new Date().getFullYear();
          
          if (!spouse.birthYear || spouse.birthYear < 1900 || spouse.birthYear > currentYear) {
            spouse.birthYear = 1975;
          }
          
          if (spouse.retirementAge < 50 || spouse.retirementAge > 85) {
            spouse.retirementAge = 65;
          }
          
          if (spouse.lifeExpectancyAge < 70 || spouse.lifeExpectancyAge > 120) {
            spouse.lifeExpectancyAge = 92;
          }
        }
        
        // Sanitize account values
        if (savedData.accounts) {
          savedData.accounts.forEach(acc => {
            if (acc.currentValue < 0 || !Number.isFinite(acc.currentValue)) {
              acc.currentValue = 0;
            }
            if (acc.annualContribution < 0 || !Number.isFinite(acc.annualContribution)) {
              acc.annualContribution = 0;
            }
            if (acc.employerMatch < 0 || acc.employerMatch > 1) {
              acc.employerMatch = 0.05;
            }
            if (acc.employerMatchCap < 0 || !Number.isFinite(acc.employerMatchCap)) {
              acc.employerMatchCap = 0;
            }
          });
        }
        
        // Sanitize income sources
        if (savedData.incomeSourcesUser) {
          savedData.incomeSourcesUser.forEach(src => {
            if (src.annualAmount < 0 || !Number.isFinite(src.annualAmount)) {
              src.annualAmount = 0;
            }
            if (src.growthRate < -0.5 || src.growthRate > 0.5) {
              src.growthRate = 0.03;
            }
          });
        }
        
        if (savedData.incomeSourcesSpouse) {
          savedData.incomeSourcesSpouse.forEach(src => {
            if (src.annualAmount < 0 || !Number.isFinite(src.annualAmount)) {
              src.annualAmount = 0;
            }
            if (src.growthRate < -0.5 || src.growthRate > 0.5) {
              src.growthRate = 0.03;
            }
          });
        }
        
        // Sanitize growth rates to ensure they're within valid bounds
        if (savedData.financialInputs) {
          const sanitized = { ...savedData.financialInputs };
          if (sanitized.growthRateLowerLimit < -0.5 || sanitized.growthRateLowerLimit > 0.5 || 
              sanitized.growthRateUpperLimit < -0.5 || sanitized.growthRateUpperLimit > 0.5 ||
              sanitized.growthRateLowerLimit > sanitized.growthRateUpperLimit) {
            sanitized.growthRateLowerLimit = 0.03;
            sanitized.growthRateUpperLimit = 0.10;
            savedData = { ...savedData, financialInputs: sanitized };
          }
        }
        
        setData(savedData);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        // Set default data on error
        setData(useRetirementCalculatorInitial());
        setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Auto-save data and recalculate when data changes
  useEffect(() => {
    if (!data || shouldSkipCalculation) return;

    const timeoutId = setTimeout(async () => {
      try {
        // Validate data before calculating
        if (!data.household || !data.accounts) {
          return;
        }

        // Save to IndexedDB
        try {
          await db.saveData(data);
        } catch (saveErr) {
          console.error('Failed to save to IndexedDB:', saveErr);
        }
        
        // Backup to localStorage
        try {
          localStorageService.saveKey(AUTOSAVE_KEY, data);
        } catch (localErr) {
          console.error('Failed to save to localStorage:', localErr);
        }

        // Recalculate projections
        try {
          const calculator = new RetirementCalculator(data);
          const summary = calculator.calculate();
          setProjectionSummary(summary);
          setError(null); // Clear any previous errors
          setShouldSkipCalculation(false);
        } catch (calcErr) {
          const errorMsg = calcErr instanceof Error ? calcErr.message : 'Unknown error';
          console.error('Calculation error:', errorMsg);
          setError(`Calculation failed: ${errorMsg}`);
          // Don't skip calculation - allow retry on data change
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to save or calculate:', err);
        setError(`Error: ${errorMsg}`);
      }
    }, 500); // Debounce calculations

    return () => clearTimeout(timeoutId);
  }, [data, shouldSkipCalculation]);

  const updateData = useCallback((updates: Partial<RetirementCalculatorData>) => {
    setData(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const updateHousehold = useCallback((household: RetirementCalculatorData['household']) => {
    setData(prev => prev ? { ...prev, household } : null);
  }, []);

  const updateFinancialInputs = useCallback((inputs: RetirementCalculatorData['financialInputs']) => {
    setData(prev => prev ? { ...prev, financialInputs: inputs } : null);
  }, []);

  const addAccount = useCallback((account: RetirementCalculatorData['accounts'][0]) => {
    setData(prev => prev ? {
      ...prev,
      accounts: [...prev.accounts, account]
    } : null);
  }, []);

  const updateAccount = useCallback((accountId: string, updates: Partial<RetirementCalculatorData['accounts'][0]>) => {
    setData(prev => prev ? {
      ...prev,
      accounts: prev.accounts.map(acc => acc.id === accountId ? { ...acc, ...updates } : acc)
    } : null);
  }, []);

  const deleteAccount = useCallback((accountId: string) => {
    setData(prev => prev ? {
      ...prev,
      accounts: prev.accounts.filter(acc => acc.id !== accountId)
    } : null);
  }, []);

  const addIncomeSource = useCallback((source: RetirementCalculatorData['incomeSourcesUser'][0], owner: 'user' | 'spouse') => {
    setData(prev => {
      if (!prev) return null;
      
      if (owner === 'user') {
        return {
          ...prev,
          incomeSourcesUser: [...prev.incomeSourcesUser, source]
        };
      } else {
        return {
          ...prev,
          incomeSourcesSpouse: [...(prev.incomeSourcesSpouse || []), source]
        };
      }
    });
  }, []);

  const updateIncomeSource = useCallback((sourceId: string, updates: Partial<RetirementCalculatorData['incomeSourcesUser'][0]>, owner: 'user' | 'spouse') => {
    setData(prev => {
      if (!prev) return null;

      if (owner === 'user') {
        return {
          ...prev,
          incomeSourcesUser: prev.incomeSourcesUser.map(src => src.id === sourceId ? { ...src, ...updates } : src)
        };
      } else {
        return {
          ...prev,
          incomeSourcesSpouse: (prev.incomeSourcesSpouse || []).map(src => src.id === sourceId ? { ...src, ...updates } : src)
        };
      }
    });
  }, []);

  const deleteIncomeSource = useCallback((sourceId: string, owner: 'user' | 'spouse') => {
    setData(prev => {
      if (!prev) return null;

      if (owner === 'user') {
        return {
          ...prev,
          incomeSourcesUser: prev.incomeSourcesUser.filter(src => src.id !== sourceId)
        };
      } else {
        return {
          ...prev,
          incomeSourcesSpouse: (prev.incomeSourcesSpouse || []).filter(src => src.id !== sourceId)
        };
      }
    });
  }, []);

  const resetToDefaults = useCallback(async () => {
    const defaults = useRetirementCalculatorInitial();
    setData(defaults);
    setShouldSkipCalculation(false);
    setError(null);
    try {
      await db.saveData(defaults);
      localStorageService.saveKey(AUTOSAVE_KEY, defaults);
      console.info('✅ Reset to default data');
    } catch (err) {
      console.warn('⚠️ Failed to save reset data:', err);
    }
  }, []);

  const retryCalculation = useCallback(() => {
    setShouldSkipCalculation(false);
    setError(null);
  }, []);

  return {
    data,
    projectionSummary,
    isLoading,
    error,
    updateData,
    updateHousehold,
    updateFinancialInputs,
    addAccount,
    updateAccount,
    deleteAccount,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
    resetToDefaults,
    retryCalculation,
  };
};

export const useRetirementCalculatorInitial = (): RetirementCalculatorData => {
  return {
    household: {
      currentYear: new Date().getFullYear(),
      user: {
        name: 'You',
        birthYear: 1970,
        retirementAge: 65,
        lifeExpectancyAge: 90,
      },
      spouse: undefined,
    },
    incomeSourcesUser: [
      {
        id: '1',
        name: 'Salary',
        annualAmount: 100000,
        growthRate: 0.03,
        owner: 'user',
      }
    ],
    incomeSourcesSpouse: [],
    accounts: [
      {
        id: '1',
        name: '401(k)',
        type: 'Traditional401k',
        currentValue: 250000,
        annualContribution: 23500,
        employerMatch: 0.05,
        employerMatchCap: 0.05,
        owner: 'user',
        growthRate: 0.07,
      }
    ],
    financialInputs: {
      inflationRate: 0.03,
      taxRate: 0.25,
      monthlyRetirementBudget: 8000,
      survivorExpensePercentage: 0.75,
      savingsGoal: 1000000,
      investmentGrowthPreRetirement: 0.07,
      investmentGrowthPostRetirement: 0.05,
      growthRateLowerLimit: 0.03,
      growthRateUpperLimit: 0.10,
    },
    portfolioSnapshots: [],
    scenarios: {
      base: {
        optimistic: 0.09,
        conservative: 0.05,
      }
    },
    lastUpdated: new Date(),
  };
};
