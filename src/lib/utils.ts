import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { UserRole } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get role-based budget allocation percentages
 * - Student: 60% Needs, 30% Wants, 10% Savings (low income, unstable)
 * - Professional: 50% Needs, 30% Wants, 20% Savings (standard earning)
 * - Housewife: 55% Needs, 25% Wants, 20% Savings (household-heavy needs)
 */
export function getRoleBudgetSplit(role: UserRole): { needsPercent: number; wantsPercent: number; savingsPercent: number } {
  switch (role) {
    case 'Student':
      return { needsPercent: 0.60, wantsPercent: 0.30, savingsPercent: 0.10 };
    case 'Professional':
      return { needsPercent: 0.50, wantsPercent: 0.30, savingsPercent: 0.20 };
    case 'Housewife':
      return { needsPercent: 0.55, wantsPercent: 0.25, savingsPercent: 0.20 };
    default:
      // Fallback to Professional split
      return { needsPercent: 0.50, wantsPercent: 0.30, savingsPercent: 0.20 };
  }
}

/**
 * Calculate role-based budget allocation
 * Takes into account fixed expenses and dynamically adjusts Wants/Savings if Needs exceed threshold
 */
export function calculateRoleBudget(
  income: number,
  fixedExpensesTotal: number,
  role: UserRole
): { monthlyNeeds: number; monthlyWants: number; monthlySavings: number; dailyLimit: number } {
  if (income <= 0) {
    return { monthlyNeeds: 0, monthlyWants: 0, monthlySavings: 0, dailyLimit: 0 };
  }

  const { needsPercent, wantsPercent, savingsPercent } = getRoleBudgetSplit(role);
  const needs = fixedExpensesTotal;
  const needsThreshold = income * needsPercent;

  let wants = 0;
  let savings = 0;

  if (needs <= needsThreshold) {
    // Fixed expenses are within threshold — use role-based split
    const wantsTarget = income * wantsPercent;
    const savingsTarget = income * savingsPercent;

    // Put any remainder into Wants (discretionary)
    const remainder = income - (needs + wantsTarget + savingsTarget);
    wants = wantsTarget + (remainder > 0 ? remainder : 0);
    savings = savingsTarget;
  } else {
    // Fixed expenses exceed role threshold — allocate remaining disposable income
    const disposable = Math.max(income - needs, 0);
    if (disposable > 0) {
      // Split remaining disposable based on role's wants/savings ratio
      const totalFlexPercent = wantsPercent + savingsPercent;
      const wantsRatio = wantsPercent / totalFlexPercent;
      const savingsRatio = savingsPercent / totalFlexPercent;
      
      wants = disposable * wantsRatio;
      savings = disposable * savingsRatio;
    }
  }

  const dailyLimit = wants > 0 ? wants / 30 : 0;

  return { monthlyNeeds: needs, monthlyWants: wants, monthlySavings: savings, dailyLimit };
}

/**
 * Role-based success metric calculation
 * Different roles have different success criteria:
 * - Student: Minimize daily overspend (unstable income, focus on discipline)
 * - Professional: Maximize savings rate (stable income, focus on growth)
 * - Housewife: Maximize budget stability (household consistency, focus on planning)
 */
export function calculateRoleSuccessMetrics(
  role: UserRole,
  income: number,
  actualSavings: number,
  dailySpendingLimit: number,
  averageDailySpending: number,
  monthlyVariance: number // Standard deviation of monthly spending
): {
  metricName: string;
  metricValue: number;
  metricTarget: number;
  successRate: number;
  interpretation: string;
} {
  switch (role) {
    case 'Student': {
      // Success = Reduced daily overspend (lower is better)
      const dailyOverspend = Math.max(0, averageDailySpending - dailySpendingLimit);
      const target = 0; // Ideal: no overspend
      const successRate = dailySpendingLimit > 0 
        ? Math.max(0, 100 - (dailyOverspend / dailySpendingLimit) * 100)
        : 0;
      
      return {
        metricName: 'Daily Discipline Score',
        metricValue: dailyOverspend,
        metricTarget: target,
        successRate: Math.round(successRate),
        interpretation: successRate > 80 
          ? 'Excellent! Staying within daily limits.' 
          : successRate > 50 
          ? 'Good progress. Minor overspending detected.'
          : 'Focus on reducing daily overspend for better financial health.',
      };
    }

    case 'Professional': {
      // Success = Increased savings rate (higher is better)
      const savingsRate = income > 0 ? (actualSavings / income) * 100 : 0;
      const target = 20; // Target: 20% savings rate
      const successRate = Math.min(100, (savingsRate / target) * 100);
      
      return {
        metricName: 'Savings Growth Rate',
        metricValue: Math.round(savingsRate),
        metricTarget: target,
        successRate: Math.round(successRate),
        interpretation: savingsRate >= 20 
          ? 'Outstanding! You\'re building wealth effectively.' 
          : savingsRate >= 10 
          ? 'On track. Consider increasing savings contributions.'
          : 'Room for improvement. Review discretionary spending.',
      };
    }

    case 'Housewife': {
      // Success = Budget stability (lower variance is better)
      const stabilityScore = monthlyVariance > 0 
        ? Math.max(0, 100 - (monthlyVariance / income) * 100)
        : 100;
      const target = 90; // Target: 90% stability (low variance)
      const successRate = stabilityScore;
      
      return {
        metricName: 'Budget Consistency Score',
        metricValue: Math.round(stabilityScore),
        metricTarget: target,
        successRate: Math.round(successRate),
        interpretation: stabilityScore >= 90 
          ? 'Excellent! Your household budget is very consistent.' 
          : stabilityScore >= 70 
          ? 'Good stability. Minor fluctuations detected.'
          : 'Consider planning ahead to reduce monthly variance.',
      };
    }

    default: {
      // Fallback to Professional metrics
      const savingsRate = income > 0 ? (actualSavings / income) * 100 : 0;
      const target = 20;
      const successRate = Math.min(100, (savingsRate / target) * 100);
      
      return {
        metricName: 'Financial Health Score',
        metricValue: Math.round(savingsRate),
        metricTarget: target,
        successRate: Math.round(successRate),
        interpretation: 'Track your progress to improve financial health.',
      };
    }
  }
}
