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

  // Initialize and load data
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.info('🔄 Initializing retirement calculator...');
        await db.init();
        console.info('✅ Database initialized');
        
        let savedData = await db.getData();
        console.info('📦 Data from DB:', savedData ? 'Found' : 'Not found');
        
        if (!savedData) {
          // Load default data if available
          const autosavedData = localStorageService.getKey<RetirementCalculatorData>(AUTOSAVE_KEY);
          console.info('💾 Autosaved data:', autosavedData ? 'Found' : 'Not found');
          if (autosavedData) {
            savedData = autosavedData;
          } else {
            // Create initial default data
            console.info('🆕 Creating new default data');
            savedData = useRetirementCalculatorInitial();
          }
        }
        
        console.info('✅ Data loaded:', {
          household: savedData?.household,
          accountsCount: savedData?.accounts?.length,
          incomeSourcesCount: (savedData?.incomeSourcesUser?.length || 0) + (savedData?.incomeSourcesSpouse?.length || 0),
        });
        
        setData(savedData);
        setError(null);
      } catch (err) {
        console.error('❌ Failed to initialize database:', err);
        // Set default data on error
        console.info('⚠️ Using fallback default data');
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
    if (!data) return;

    const saveAndCalculate = async () => {
      try {
        console.info('💾 Saving and calculating...');
        
        // Validate data before calculating
        if (!data.household || !data.accounts) {
          console.warn('⚠️ Invalid data structure, skipping calculation', { household: !!data.household, accounts: !!data.accounts });
          return;
        }

        // Save to IndexedDB
        try {
          console.info('💾 Saving to IndexedDB...');
          await db.saveData(data);
          console.info('✅ Saved to IndexedDB');
        } catch (saveErr) {
          console.warn('⚠️ Failed to save to IndexedDB:', saveErr);
        }
        
        // Backup to localStorage
        try {
          console.info('💾 Saving to localStorage...');
          localStorageService.saveKey(AUTOSAVE_KEY, data);
          console.info('✅ Saved to localStorage');
        } catch (localErr) {
          console.warn('⚠️ Failed to save to localStorage:', localErr);
        }

        // Recalculate projections
        try {
          console.info('🧮 Starting calculation...');
          const calculator = new RetirementCalculator(data);
          console.info('📊 Calculator created, calling calculate()');
          const summary = calculator.calculate();
          console.info('✅ Calculation complete:', {
            years: summary.projections.length,
            endingPortfolioValue: summary.finalPortfolioValue,
          });
          setProjectionSummary(summary);
          setError(null); // Clear any previous errors
        } catch (calcErr) {
          console.error('❌ Calculation error:', calcErr, { 
            message: calcErr instanceof Error ? calcErr.message : 'Unknown error',
            stack: calcErr instanceof Error ? calcErr.stack : undefined,
          });
          setError(`Calculation failed: ${calcErr instanceof Error ? calcErr.message : 'Unknown error'}`);
        }
      } catch (err) {
        console.error('❌ Failed to save or calculate:', err);
        setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    const timeoutId = setTimeout(saveAndCalculate, 500); // Debounce calculations
    return () => clearTimeout(timeoutId);
  }, [data]);

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
