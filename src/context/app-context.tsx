"use client";

import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { UserProfile, Goal, Transaction, FixedExpense, LoggedPayments, Contribution, EmergencyFundEntry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FirestoreService } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { format, formatISO, startOfDay, parseISO, subDays, isAfter, isSameDay, isBefore, addDays, startOfMonth } from 'date-fns';
import { BADGES, Badge, DEFAULT_GAMIFICATION_STATE, checkBadgeEligibility, BadgeCheckContext } from '@/lib/gamification';
import { calculateRoleBudget } from '@/lib/utils';

interface AppContextType {
  user: User | null | undefined;
  authLoaded: boolean;
  profile: UserProfile | null | undefined; // Allow undefined for initial loading state
  goals: Goal[];
  transactions: Transaction[];
  onboardingComplete: boolean;
  updateProfile: (profile: Partial<Omit<UserProfile, 'monthlyNeeds' | 'monthlyWants' | 'monthlySavings' | 'dailySpendingLimit'>>) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'currentAmount' | 'contributions'>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'> & { date?: string }) => void;
  updateGoal: (goalId: string, updatedGoal: Partial<Omit<Goal, 'id'>>) => void;
  getTodaysSpending: () => number;
  logout: () => void;
  deleteAccount: () => void;
  updateTransaction: (transactionId: string, updatedTransaction: Partial<Omit<Transaction, 'id' | 'date'>>) => void;
  deleteTransaction: (transactionId: string) => void;
  getTotalGoalContributions: () => number;
  contributeToGoal: (goalId: string, amount: number) => void;
  getCumulativeDailySavings: () => number;
  toggleFixedExpenseLoggedStatus: (expenseId: string) => void;
  isFixedExpenseLoggedForCurrentMonth: (expenseId: string) => boolean;
  getLoggedPaymentCount: (expenseId: string) => number;
  updateEmergencyFund: (action: 'deposit' | 'withdraw', amount: number, notes?: string) => void;
  setEmergencyFundTarget: (target: number) => void;
  // Gamification
  getCurrentStreak: () => number;
  getEarnedBadges: () => Badge[];
  awardBadge: (badgeId: string) => void;
  deleteGoal: (goalId: string) => Promise<void>;
  updateInvestments: (investments: import('@/lib/investment-types').Investment[]) => Promise<void>;
  deleteInvestment: (investmentId: string) => Promise<void>;
  updateSIPPlans: (plans: import('@/lib/investment-types').SIPPlan[]) => Promise<void>;
  deleteSIPPlan: (planId: string) => Promise<void>;
  allocateTds: (allocation: { emergencyFund: number, goals: { goalId: string, amount: number }[] }) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const KART_I_QUO_PREFIX = 'kart-i-quo-';
const PROFILE_KEY = `${KART_I_QUO_PREFIX}profile`;
const GOALS_KEY = `${KART_I_QUO_PREFIX}goals`;
const TRANSACTIONS_KEY = `${KART_I_QUO_PREFIX}transactions`;
const LOGGED_PAYMENTS_KEY = `${KART_I_QUO_PREFIX}logged-payments`;



export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined); // Start as undefined
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loggedPayments, setLoggedPayments] = useState<LoggedPayments>({});
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser ? `User ${currentUser.uid} logged in` : 'No user');
      setUser(currentUser);
      if (currentUser) {
        try {
          // Load profile from Firestore
          const userProfile = await FirestoreService.getProfile(currentUser.uid);
          if (userProfile) {
            const fixedExpensesTotal = userProfile.fixedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
            const budget = calculateRoleBudget(userProfile.income, fixedExpensesTotal, userProfile.role);
            const updatedProfile = {
              ...userProfile,
              ...budget,
              emergencyFund: userProfile.emergencyFund || { target: 0, current: 0, history: [] },
              gamification: userProfile.gamification || DEFAULT_GAMIFICATION_STATE,
            };
            setProfile(updatedProfile);
            setOnboardingComplete(!!updatedProfile.role);
          } else {
            setProfile(null);
          }

          // Load goals from Firestore
          const userGoals = await FirestoreService.getGoals(currentUser.uid);
          setGoals(userGoals || []);

          // Load transactions from Firestore
          const userTransactions = await FirestoreService.getTransactions(currentUser.uid);
          setTransactions(userTransactions || []);

          // Load logged payments from Firestore
          const firestoreLoggedPayments = await FirestoreService.getLoggedPayments(currentUser.uid);
          if (firestoreLoggedPayments) {
            setLoggedPayments(firestoreLoggedPayments);
          } else {
            // Migration/Fallback: check localStorage
            const storedLoggedPayments = localStorage.getItem(LOGGED_PAYMENTS_KEY);
            const initialPayments = storedLoggedPayments ? JSON.parse(storedLoggedPayments) : {};
            setLoggedPayments(initialPayments);
            if (Object.keys(initialPayments).length > 0) {
              await FirestoreService.saveLoggedPayments(currentUser.uid, initialPayments);
            }
          }

        } catch (error) {
          console.error("Failed to load data from localStorage", error);
          setProfile(null);
        }
      } else {
        // User is signed out, clear data
        setProfile(null);
        setGoals([]);
        setTransactions([]);
        setLoggedPayments({});
        setOnboardingComplete(false);
      }
      // Mark that auth state has been determined at least once
      setAuthLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  const persistState = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to persist ${key} to localStorage`, error);
    }
  };

  const updateProfile = async (newProfileData: Partial<Omit<UserProfile, 'monthlyNeeds' | 'monthlyWants' | 'monthlySavings' | 'dailySpendingLimit'>>) => {
    if (!user) return;

    try {
      // Prepare base profile data
      const income = newProfileData.income ?? profile?.income ?? 0;
      const role = newProfileData.role || profile?.role || '';
      const fixedExpenses = newProfileData.fixedExpenses?.map(exp => ({
        id: exp.id || crypto.randomUUID(),
        name: exp.name || '',
        amount: exp.amount || 0,
        category: exp.category || 'Other',
        timelineMonths: exp.timelineMonths,
        startDate: (exp.timelineMonths && !exp.startDate) ? formatISO(new Date()) : exp.startDate || formatISO(new Date())
      })) ?? profile?.fixedExpenses ?? [];

      const fixedExpensesTotal = fixedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const budget = calculateRoleBudget(income, fixedExpensesTotal, role);

      // Create a complete profile object with all required fields
      const updatedProfile: UserProfile = {
        ...profile,
        role,
        name: newProfileData.name || profile?.name || '',
        income,
        fixedExpenses,
        ...budget,
        emergencyFund: {
          target: newProfileData.emergencyFund?.target ?? profile?.emergencyFund?.target ?? 0,
          current: newProfileData.emergencyFund?.current ?? profile?.emergencyFund?.current ?? 0,
          history: newProfileData.emergencyFund?.history ?? profile?.emergencyFund?.history ?? []
        },
        gamification: profile?.gamification || DEFAULT_GAMIFICATION_STATE,
        investments: profile?.investments || [],
        sipPlans: profile?.sipPlans || [],
      };

      // Debug log before saving
      console.log('About to save profile:', JSON.stringify(updatedProfile, null, 2));

      await FirestoreService.updateProfile(user.uid, updatedProfile);
      setProfile(updatedProfile);
      setOnboardingComplete(true);

      console.log('Profile saved successfully');
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const addGoal = async (goalData: Omit<Goal, 'id' | 'currentAmount' | 'contributions'>) => {
    if (!user) return;

    try {
      const newGoal: Goal = {
        ...goalData,
        id: crypto.randomUUID(),
        currentAmount: 0,
        startDate: goalData.timelineMonths ? formatISO(new Date()) : undefined,
        contributions: [],
      };

      await FirestoreService.saveGoal(user.uid, newGoal);
      setGoals(prev => [...prev, newGoal]);

      toast({
        title: 'Goal Added!',
        description: `You're now saving for "${newGoal.name}".`,
      });
    } catch (error) {
      console.error("Failed to add goal:", error);
      toast({
        title: "Error",
        description: "Failed to add goal",
        variant: "destructive"
      });
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'date'> & { date?: string }) => {
    if (!user) return;

    try {
      // Force date to current time to prevent back-dating or tampering with streaks
      const newTransaction: Transaction = {
        ...transactionData,
        id: crypto.randomUUID(),
        date: formatISO(new Date()),
      };

      await FirestoreService.saveTransaction(user.uid, newTransaction);
      setTransactions(prev => [newTransaction, ...prev]);

      toast({
        title: "Success",
        description: "Transaction added successfully"
      });
    } catch (error) {
      console.error("Failed to add transaction:", error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive"
      });
    }
  };

  const updateGoal = (goalId: string, updatedData: Partial<Omit<Goal, 'id'>>) => {
    const newGoals = goals.map(g =>
      g.id === goalId ? { ...g, ...updatedData, startDate: (g.timelineMonths && !g.startDate) ? formatISO(new Date()) : g.startDate } : g
    );
    setGoals(newGoals);
    persistState(GOALS_KEY, newGoals);
    toast({
      title: 'Goal Updated',
      description: 'Your goal has been successfully updated.',
    });
  };

  const updateTransaction = async (transactionId: string, updatedData: Partial<Omit<Transaction, 'id' | 'date'>>) => {
    if (!user) return;

    try {
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) throw new Error("Transaction not found");

      const updatedTransaction = {
        ...transaction,
        ...updatedData
      };

      await FirestoreService.saveTransaction(user.uid, updatedTransaction);
      setTransactions(prev => prev.map(t => t.id === transactionId ? updatedTransaction : t));

      toast({
        title: "Success",
        description: "Transaction updated successfully"
      });
    } catch (error) {
      console.error("Failed to update transaction:", error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive"
      });
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!user) return;

    try {
      await FirestoreService.deleteTransaction(user.uid, transactionId);
      setTransactions(prev => prev.filter(t => t.id !== transactionId));

      toast({
        title: "Success",
        description: "Transaction deleted successfully"
      });
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive"
      });
    }
  };

  const getTodaysSpending = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return transactions
      .filter(t => t.date.startsWith(today))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const getTotalGoalContributions = useCallback(() => {
    return goals.reduce((sum, g) => sum + g.monthlyContribution, 0);
  }, [goals]);

  const getCumulativeDailySavings = useCallback(() => {
    if (!profile) {
      return 0;
    }

    // 1. Get last reset date - default to start of current month to avoid 1970 bug
    const lastResetDateStr = profile.lastTdsResetDate;
    const lastResetDate = lastResetDateStr ? parseISO(lastResetDateStr) : startOfMonth(new Date());

    // 2. Group expenses by day
    const spendingByDay = transactions
      .reduce((acc, t) => {
        const tDate = parseISO(t.date);
        if (isBefore(tDate, lastResetDate) && !isSameDay(tDate, lastResetDate)) {
          return acc;
        }

        const day = startOfDay(tDate).toISOString();
        if (!acc[day]) {
          acc[day] = 0;
        }
        acc[day] += t.amount;
        return acc;
      }, {} as { [key: string]: number });

    const today = startOfDay(new Date()).toISOString();

    // 3. Get all days that have transactions OR are between lastResetDate and yesterday
    const daysToProcess: string[] = [];
    let current = startOfDay(lastResetDate);
    const yesterday = startOfDay(subDays(new Date(), 1));

    while (current <= yesterday) {
      daysToProcess.push(current.toISOString());
      current = addDays(current, 1);
    }

    // Also include today if there's spending
    if (spendingByDay[today] !== undefined) {
      daysToProcess.push(today);
    }

    // Sort unique days
    const allDays = Array.from(new Set([...daysToProcess, ...Object.keys(spendingByDay)]))
      .sort((a, b) => a.localeCompare(b));

    let balance = profile.totalDailySavings || 0;
    for (const day of allDays) {
      const spending = spendingByDay[day] || 0;
      const diff = profile.dailySpendingLimit - spending;

      if (day === today) {
        // Requirement 3 & 5: Only deduct overspending for today
        if (diff < 0) {
          balance += diff;
        }
      } else {
        // Past days: add savings or deduct overspending
        balance += diff;
      }

      // Requirement 7: TDS never becomes negative
      if (balance < 0) {
        balance = 0;
      }
    }

    return balance;
  }, [profile, transactions]);

  const contributeToGoal = (goalId: string, amount: number) => {
    const newContribution: Contribution = {
      amount,
      date: new Date().toISOString(),
    };

    const newGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const newCurrentAmount = goal.currentAmount + amount;
        return {
          ...goal,
          currentAmount: newCurrentAmount > goal.targetAmount ? goal.targetAmount : newCurrentAmount,
          contributions: [newContribution, ...(goal.contributions || [])],
        };
      }
      return goal;
    });
    setGoals(newGoals);
    persistState(GOALS_KEY, newGoals);
    toast({
      title: 'Contribution Successful!',
      description: `You've added ₹${amount.toFixed(2)} to your goal.`,
    });
  };

  const isFixedExpenseLoggedForCurrentMonth = (expenseId: string) => {
    const currentMonthKey = format(new Date(), 'yyyy-MM');
    return loggedPayments[expenseId]?.includes(currentMonthKey) || false;
  };

  const getLoggedPaymentCount = (expenseId: string) => {
    return loggedPayments[expenseId]?.length || 0;
  };

  const toggleFixedExpenseLoggedStatus = (expenseId: string) => {
    const currentMonthKey = format(new Date(), 'yyyy-MM');
    const existingLogs = loggedPayments[expenseId] || [];
    const isLogged = existingLogs.includes(currentMonthKey);

    let newLogs;
    if (isLogged) {
      newLogs = existingLogs.filter(month => month !== currentMonthKey);
      toast({ title: 'Expense marked as unpaid.' });
    } else {
      newLogs = [...existingLogs, currentMonthKey];
      toast({ title: 'Expense marked as paid.' });
    }

    const updatedLoggedPayments = {
      ...loggedPayments,
      [expenseId]: newLogs,
    };

    setLoggedPayments(updatedLoggedPayments);
    persistState(LOGGED_PAYMENTS_KEY, updatedLoggedPayments);

    if (user) {
      FirestoreService.saveLoggedPayments(user.uid, updatedLoggedPayments).catch(err => {
        console.error("Failed to sync logged payments:", err);
      });
    }
  };

  const updateEmergencyFund = (action: 'deposit' | 'withdraw', amount: number, notes?: string) => {
    if (!profile) return;

    const newEntry: EmergencyFundEntry = {
      id: Date.now().toString(),
      amount,
      date: new Date().toISOString(),
      type: action === 'deposit' ? 'deposit' : 'withdrawal',
      notes,
    };

    const newCurrent = action === 'deposit'
      ? profile.emergencyFund.current + amount
      : profile.emergencyFund.current - amount;

    const updatedProfile: UserProfile = {
      ...profile,
      emergencyFund: {
        ...profile.emergencyFund,
        current: newCurrent < 0 ? 0 : newCurrent,
        history: [newEntry, ...profile.emergencyFund.history],
      },
    };

    setProfile(updatedProfile);
    persistState(PROFILE_KEY, updatedProfile);

    if (user) {
      FirestoreService.updateProfile(user.uid, updatedProfile).catch(err => {
        console.error("Failed to sync emergency fund:", err);
      });
    }

    toast({
      title: `Fund ${action === 'deposit' ? 'Added' : 'Withdrawn'}`,
      description: `₹${amount.toFixed(2)} has been ${action === 'deposit' ? 'added to' : 'withdrawn from'} your emergency fund.`,
    });
  };

  const setEmergencyFundTarget = (target: number) => {
    if (!profile) return;
    const updatedProfile: UserProfile = {
      ...profile,
      emergencyFund: {
        ...profile.emergencyFund,
        target,
      },
    };
    setProfile(updatedProfile);
    persistState(PROFILE_KEY, updatedProfile);

    if (user) {
      FirestoreService.updateProfile(user.uid, updatedProfile).catch(err => {
        console.error("Failed to sync emergency fund target:", err);
      });
    }

    toast({
      title: `Target Updated`,
      description: `Your new emergency fund target is ₹${target.toFixed(2)}.`,
    });
  };

  const deleteGoal = async (goalId: string) => {
    if (!user) return;
    try {
      await FirestoreService.deleteGoal(user.uid, goalId);
      const updatedGoals = goals.filter(g => g.id !== goalId);
      setGoals(updatedGoals);
      persistState(GOALS_KEY, updatedGoals);
      toast({ title: 'Goal deleted successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete goal.' });
    }
  };

  const updateInvestments = async (newInvestments: import('@/lib/investment-types').Investment[]) => {
    if (!user || !profile) return;
    const updatedProfile = { ...profile, investments: newInvestments };
    setProfile(updatedProfile);
    persistState(PROFILE_KEY, updatedProfile);
    await FirestoreService.updateProfile(user.uid, updatedProfile);
  };

  const deleteInvestment = async (investmentId: string) => {
    if (!user || !profile?.investments) return;
    const updatedInvestmentsList = profile.investments.filter(i => i.id !== investmentId);
    await updateInvestments(updatedInvestmentsList);
    toast({ title: 'Investment removed.' });
  };

  const updateSIPPlans = async (newPlans: import('@/lib/investment-types').SIPPlan[]) => {
    if (!user || !profile) return;
    const updatedProfile = { ...profile, sipPlans: newPlans };
    setProfile(updatedProfile);
    persistState(PROFILE_KEY, updatedProfile);
    await FirestoreService.updateProfile(user.uid, updatedProfile);
  };

  const deleteSIPPlan = async (planId: string) => {
    if (!user || !profile?.sipPlans) return;
    const updatedPlans = profile.sipPlans.filter(p => p.id !== planId);
    await updateSIPPlans(updatedPlans);
    toast({ title: 'SIP Plan removed.' });
  };

  const allocateTds = async (allocation: { emergencyFund: number, goals: { goalId: string, amount: number }[] }) => {
    if (!user || !profile) return;

    try {
      // 1. Update goals with contributions
      if (allocation.goals.length > 0) {
        const updatedGoals = goals.map(goal => {
          const goalAllocation = allocation.goals.find(a => a.goalId === goal.id);
          if (goalAllocation) {
            const newContribution: Contribution = {
              amount: goalAllocation.amount,
              date: formatISO(new Date()),
            };
            const newCurrentAmount = goal.currentAmount + goalAllocation.amount;
            return {
              ...goal,
              currentAmount: newCurrentAmount > goal.targetAmount ? goal.targetAmount : newCurrentAmount,
              contributions: [newContribution, ...(goal.contributions || [])],
            };
          }
          return goal;
        });

        // Save goals to Firestore
        await Promise.all(allocation.goals.map(async (a) => {
          const goal = updatedGoals.find(g => g.id === a.goalId);
          if (goal) await FirestoreService.saveGoal(user.uid, goal);
        }));
        setGoals(updatedGoals);
      }

      const currentTdsBalance = getCumulativeDailySavings();
      const totalAmountAllocated = allocation.emergencyFund + allocation.goals.reduce((sum, g) => sum + g.amount, 0);
      const remainingTds = Math.max(0, currentTdsBalance - totalAmountAllocated);

      // 2. Prepare updated profile
      const updatedProfile: UserProfile = {
        ...profile,
        lastTdsResetDate: formatISO(new Date()),
        totalDailySavings: remainingTds,
      };

      // 3. Update emergency fund if allocated
      if (allocation.emergencyFund > 0) {
        const newEntry: EmergencyFundEntry = {
          id: Date.now().toString(),
          amount: allocation.emergencyFund,
          date: formatISO(new Date()),
          type: 'deposit',
          notes: 'Allocation from Total Daily Savings',
        };

        updatedProfile.emergencyFund = {
          ...profile.emergencyFund,
          current: profile.emergencyFund.current + allocation.emergencyFund,
          history: [newEntry, ...profile.emergencyFund.history],
        };
      }

      await FirestoreService.updateProfile(user.uid, updatedProfile);
      setProfile(updatedProfile);

      toast({
        title: "Allocation Successful",
        description: "Your daily savings have been allocated and reset.",
      });
    } catch (error) {
      console.error("Failed to allocate TDS:", error);
      toast({
        title: "Error",
        description: "Failed to allocate savings",
        variant: "destructive"
      });
    }
  };


  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Logout failed", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "An error occurred while logging out. Please try again.",
      })
    }
  };

  const deleteAccount = async () => {
    try {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(GOALS_KEY);
      localStorage.removeItem(TRANSACTIONS_KEY);
      localStorage.removeItem(LOGGED_PAYMENTS_KEY);

      if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        await FirestoreService.deleteUserData(userId);
        await signOut(auth);
      }

      toast({
        title: "Account Deleted",
        description: "Your account and all data have been successfully deleted.",
      });

      router.push('/signup');
    } catch (error) {
      console.error("Account deletion failed", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "An error occurred while deleting your account. Please try again.",
      });
    }
  };

  // Gamification Functions
  const getCurrentStreak = useCallback(() => {
    if (!profile) return 0;
    if (transactions.length === 0) return 0; // No history, no streak

    const dailyLimit = profile.dailySpendingLimit;
    const today = startOfDay(new Date());

    // 1. Check TODAY first. If over budget today, streak is broken immediately.
    const todaysSpending = transactions
      .filter(t => isSameDay(parseISO(t.date), today))
      .reduce((sum, t) => sum + t.amount, 0);

    if (todaysSpending > dailyLimit) return 0;

    // 2. Find the start date (date of first transaction)
    const sortedDates = transactions
      .map(t => startOfDay(parseISO(t.date)).getTime())
      .sort((a, b) => a - b);

    if (sortedDates.length === 0) return 0;
    const startDate = new Date(sortedDates[0]);

    // 3. Count backwards from YESTERDAY
    let streak = 0;
    let checkDate = subDays(today, 1);

    // Group transactions by day for efficiency
    const spendingByDay: Record<string, number> = {};
    transactions.forEach(t => {
      const day = startOfDay(parseISO(t.date)).toISOString();
      spendingByDay[day] = (spendingByDay[day] || 0) + t.amount;
    });

    // Max 365 days or until start date
    for (let i = 0; i < 365; i++) {
      // Stop if we go before the first transaction
      if (checkDate < startDate) break;

      const dayKey = checkDate.toISOString();
      const daySpending = spendingByDay[dayKey] || 0;

      if (daySpending <= dailyLimit) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break; // Streak broken
      }
    }

    // Optional: Add 1 for today if it's "so far so good"?
    // Standard practice: "Current Streak" usually implies completed days OR active streak.
    // If we count today, it motivates. If we don't, it feels lagging.
    // Let's count today as +1 if they are currently under budget.
    if (todaysSpending <= dailyLimit) {
      streak++;
    }

    return streak;
  }, [profile, transactions]);

  const getEarnedBadges = useCallback((): Badge[] => {
    if (!profile?.gamification?.earnedBadges) return [];
    return profile.gamification.earnedBadges
      .map(id => BADGES.find(b => b.id === id))
      .filter((b): b is Badge => b !== undefined);
  }, [profile]);

  const awardBadge = async (badgeId: string) => {
    if (!profile || !user) return;

    const currentBadges = profile.gamification?.earnedBadges || [];
    if (currentBadges.includes(badgeId)) return; // Already earned

    const badge = BADGES.find(b => b.id === badgeId);
    if (!badge) return;

    const updatedGamification = {
      ...profile.gamification,
      earnedBadges: [...currentBadges, badgeId],
      currentStreak: getCurrentStreak(),
      longestStreak: Math.max(profile.gamification?.longestStreak || 0, getCurrentStreak()),
      lastStreakDate: new Date().toISOString(),
    };

    const updatedProfile: UserProfile = {
      ...profile,
      gamification: updatedGamification,
    };

    try {
      await FirestoreService.updateProfile(user.uid, updatedProfile);
      setProfile(updatedProfile);

      toast({
        title: `🏆 Badge Earned!`,
        description: `${badge.emoji} ${badge.name} - ${badge.description}`,
      });
    } catch (error) {
      console.error("Failed to award badge:", error);
    }
  };

  // Auto-check and award eligible badges
  const checkAndAwardBadges = useCallback(async () => {
    if (!profile || !user) return;

    const earnedBadges = profile.gamification?.earnedBadges || [];
    const streak = getCurrentStreak();

    // Calculate total daily savings (cumulative)
    const totalSaved = getCumulativeDailySavings();

    // Check for completed goals
    const hasCompletedGoal = goals.some(g => g.currentAmount >= g.targetAmount);

    // Check for zero spend days
    const today = startOfDay(new Date());
    const todaysSpending = getTodaysSpending();
    const hasZeroSpendDay = transactions.some(t => {
      const txDate = startOfDay(parseISO(t.date));
      const daySpending = transactions
        .filter(tx => isSameDay(parseISO(tx.date), txDate))
        .reduce((sum, tx) => sum + tx.amount, 0);
      return daySpending === 0;
    }) || todaysSpending === 0;

    // Count consecutive zero spend days
    let consecutiveZeroSpendDays = 0;
    let checkDate = subDays(today, 1);
    for (let i = 0; i < 30; i++) {
      const daySpending = transactions
        .filter(t => isSameDay(parseISO(t.date), checkDate))
        .reduce((sum, t) => sum + t.amount, 0);
      if (daySpending === 0) {
        consecutiveZeroSpendDays++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    // Check weekend under budget (simplified)
    const hasWeekendUnderBudget = streak >= 2;

    // Build context
    const context: BadgeCheckContext = {
      currentStreak: streak,
      longestStreak: profile.gamification?.longestStreak || 0,
      totalSaved,
      monthlyIncome: profile.income,
      monthlySavings: profile.monthlySavings,
      emergencyFund: profile.emergencyFund?.current || 0,
      monthlyExpenses: profile.monthlyNeeds + profile.monthlyWants,
      hasCompletedGoal,
      hasZeroSpendDay,
      consecutiveZeroSpendDays,
      hasWeekendUnderBudget,
      earnedBadges,
    };

    // Check eligibility
    const newBadges = checkBadgeEligibility(context);

    // Update last check date
    const updatedGamification = {
      ...(profile.gamification || DEFAULT_GAMIFICATION_STATE),
      lastBadgeCheckDate: formatISO(new Date()),
    };

    const updatedProfile: UserProfile = {
      ...profile,
      gamification: updatedGamification,
    };

    if (newBadges.length > 0) {
      // Award new badges
      for (const badgeId of newBadges) {
        await awardBadge(badgeId);
      }
    } else {
      // Just update the check date
      await FirestoreService.updateProfile(user.uid, updatedProfile);
      setProfile(updatedProfile);
    }
  }, [profile, user, transactions, goals, getCurrentStreak, getCumulativeDailySavings, getTodaysSpending]);

  // Check badges only when a new day starts or on initial load
  useEffect(() => {
    if (profile && user && authLoaded) {
      const lastCheck = profile.gamification?.lastBadgeCheckDate;
      const today = startOfDay(new Date());

      if (!lastCheck || isBefore(parseISO(lastCheck), today)) {
        checkAndAwardBadges();
      }
    }
  }, [profile?.id, authLoaded]);

  const value: AppContextType = {
    user,
    authLoaded,
    profile,
    goals,
    transactions,
    onboardingComplete,
    updateProfile,
    addGoal,
    addTransaction,
    updateGoal,
    getTodaysSpending,
    logout,
    deleteAccount,
    updateTransaction,
    deleteTransaction,
    getTotalGoalContributions,
    contributeToGoal,
    getCumulativeDailySavings,
    toggleFixedExpenseLoggedStatus,
    isFixedExpenseLoggedForCurrentMonth,
    getLoggedPaymentCount,
    updateEmergencyFund,
    setEmergencyFundTarget,
    // Gamification
    getCurrentStreak,
    getEarnedBadges,
    awardBadge,
    deleteGoal,
    updateInvestments,
    deleteInvestment,
    updateSIPPlans,
    deleteSIPPlan,
    allocateTds,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}