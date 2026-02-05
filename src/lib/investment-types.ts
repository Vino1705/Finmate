// Investment & Wealth Building Types

export type InvestmentType = 'Stock' | 'Mutual Fund' | 'SIP' | 'Cryptocurrency' | 'Bonds' | 'Fixed Deposit' | 'Gold' | 'Real Estate';
export type InvestmentStatus = 'Active' | 'Matured' | 'Exited';

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  purchaseAmount: number; // Original investment amount
  currentValue: number; // Current market value
  purchaseDate: string; // ISO string
  quantity?: number | null; // For stocks, crypto, etc.
  currentPrice?: number | null; // Current price per unit
  status: InvestmentStatus;
  notes?: string | null;
  symbol?: string | null; // Stock ticker or fund code
  lastPriceFetchedAt?: string | null; // ISO string
  priceSource?: string | null; // e.g. 'Yahoo Finance'
  quoteError?: string | null; // Error message if price fetch failed
}

export interface SIPPlan {
  id: string;
  name: string;
  monthlyAmount: number;
  fundType: 'Mutual Fund' | 'Stock' | 'Gold'; // For SIP
  fundCode?: string;
  startDate: string; // ISO string
  endDate?: string; // ISO string (optional - for closed SIPs)
  isActive: boolean;
  contributions: { amount: number; date: string }[];
  targetAmount?: number;
  expectedMaturityDate?: string;
}

export interface TaxSaving {
  id: string;
  category: string; // '80C', '80D', '80E', '80G', etc.
  section: string; // Full name of section
  description: string;
  maxLimit: number; // Maximum deduction allowed
  currentAmount: number; // Amount user has already invested
  recommendedInvestment: string; // What they can invest in
  benefitPerYear: number; // Tax savings per year
}

export interface PortfolioMetrics {
  totalInvested: number;
  currentPortfolioValue: number;
  totalGain: number;
  gainPercentage: number;
  lastUpdated: string;
}

export interface InvestmentRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  reason: string; // Why it's recommended
  investmentType: InvestmentType;
  estimatedReturn: number; // Expected annual return %
  riskLevel: 'Low' | 'Medium' | 'High';
  minInvestment: number;
  createdDate: string;
}