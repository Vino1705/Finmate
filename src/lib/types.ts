
export type UserRole = 'Student' | 'Professional' | 'Housewife' | '';

export interface UserProfile {
  name?: string;
  role: UserRole;
  income: number;
  fixedExpenses: FixedExpense[];
  dailySpendingLimit: number;
  monthlyNeeds: number;
  monthlyWants: number;
  monthlySavings: number;
  emergencyFund: {
    target: number;
    current: number;
    history: EmergencyFundEntry[];
  };
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  timelineMonths?: number;
  startDate?: string; // Should be an ISO string
}

export interface Contribution {
    amount: number;
    date: string; // ISO string
}

export interface Goal {
  id:string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  timelineMonths: number;
  startDate?: string;
  contributions: Contribution[];
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO string for simplicity
}

export const expenseCategories = [
  'Food & Dining',
  'Groceries',
  'Transport',
  'Shopping',
  'Entertainment',
  'Utilities',
  'Rent/EMI',
  'Healthcare',
  'Education',
  'Other',
];

/**
 * Role-specific expense categories for better categorization
 * Shows most relevant categories first based on user role
 */
export const roleSpecificCategories = {
  Student: [
    'Education',
    'Food & Dining',
    'Transport',
    'Entertainment',
    'Shopping',
    'Rent/EMI',
    'Healthcare',
    'Groceries',
    'Utilities',
    'Other',
  ],
  Professional: [
    'Food & Dining',
    'Transport',
    'Rent/EMI',
    'Healthcare',
    'Shopping',
    'Entertainment',
    'Education',
    'Groceries',
    'Utilities',
    'Other',
  ],
  Housewife: [
    'Groceries',
    'Healthcare',
    'Education',
    'Utilities',
    'Shopping',
    'Food & Dining',
    'Transport',
    'Rent/EMI',
    'Entertainment',
    'Other',
  ],
};

/**
 * Get expense categories ordered by relevance to user role
 */
export function getRoleExpenseCategories(role: UserRole): string[] {
  return roleSpecificCategories[role as keyof typeof roleSpecificCategories] || expenseCategories;
}

/**
 * Role-specific suggested financial goals
 * Shows most relevant goal templates based on user role
 */
export const roleGoalTemplates = {
  Student: [
    { name: 'Laptop Fund', suggestedAmount: 50000, timelineMonths: 12 },
    { name: 'Semester Fees', suggestedAmount: 30000, timelineMonths: 6 },
    { name: 'Emergency Buffer', suggestedAmount: 10000, timelineMonths: 6 },
    { name: 'Internship Prep', suggestedAmount: 15000, timelineMonths: 4 },
  ],
  Professional: [
    { name: 'Emergency Fund (6 months)', suggestedAmount: 180000, timelineMonths: 24 },
    { name: 'Vacation', suggestedAmount: 80000, timelineMonths: 12 },
    { name: 'Investment Corpus', suggestedAmount: 200000, timelineMonths: 18 },
    { name: 'Car Down Payment', suggestedAmount: 150000, timelineMonths: 24 },
  ],
  Housewife: [
    { name: 'Kids Education', suggestedAmount: 100000, timelineMonths: 24 },
    { name: 'Family Medical Fund', suggestedAmount: 50000, timelineMonths: 12 },
    { name: 'Festival Savings', suggestedAmount: 30000, timelineMonths: 10 },
    { name: 'Home Improvement', suggestedAmount: 60000, timelineMonths: 18 },
  ],
};

/**
 * Get suggested goal templates based on user role
 */
export function getRoleGoalTemplates(role: UserRole): Array<{ name: string; suggestedAmount: number; timelineMonths: number }> {
  return roleGoalTemplates[role as keyof typeof roleGoalTemplates] || roleGoalTemplates.Professional;
}

// Represents a record of which month a payment was logged for a specific expense.
// e.g., { "expense-id-123": ["2024-01", "2024-02"] }
export type LoggedPayments = Record<string, string[]>;

export interface EmergencyFundEntry {
    id: string;
    amount: number;
    date: string; // ISO string
    type: 'deposit' | 'withdrawal';
    notes?: string;
}
    
