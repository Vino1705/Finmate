// Gamification System - Badge Definitions and Streak Logic

export type BadgeCategory = 'achievement' | 'milestone' | 'challenge' | 'seasonal';

export type BadgeRequirementType =
    | 'streak'
    | 'total_saved'
    | 'monthly_savings_percent'
    | 'emergency_fund_months'
    | 'completed_goals'
    | 'zero_spend_days'
    | 'weekend_warrior'
    | 'app_usage_days';

export interface Badge {
    id: string;
    name: string;
    emoji: string;
    description: string;
    category: BadgeCategory;
    requirement?: {
        type: BadgeRequirementType;
        value: number;
    };
}

export interface GamificationState {
    earnedBadges: string[];  // Badge IDs
    currentStreak: number;
    longestStreak: number;
    lastStreakDate: string | null;  // ISO date string
    lastBadgeCheckDate: string | null; // ISO date string
}

export const DEFAULT_GAMIFICATION_STATE: GamificationState = {
    earnedBadges: [],
    currentStreak: 0,
    longestStreak: 0,
    lastStreakDate: null,
    lastBadgeCheckDate: null,
};

// All available badges
export const BADGES: Badge[] = [
    // Achievement Badges
    { id: 'first_saver', name: 'First Saver', emoji: '🌱', description: 'First day under budget', category: 'achievement', requirement: { type: 'streak', value: 1 } },
    { id: 'week_warrior', name: 'Week Warrior', emoji: '⚡', description: '7-day under-budget streak', category: 'achievement', requirement: { type: 'streak', value: 7 } },
    { id: 'fortnight_fighter', name: 'Fortnight Fighter', emoji: '🔥', description: '14-day streak', category: 'achievement', requirement: { type: 'streak', value: 14 } },
    { id: 'month_master', name: 'Month Master', emoji: '🏅', description: '30-day streak', category: 'achievement', requirement: { type: 'streak', value: 30 } },
    { id: 'quarter_champion', name: 'Quarter Champion', emoji: '💫', description: '90-day streak', category: 'achievement', requirement: { type: 'streak', value: 90 } },
    { id: 'goal_getter', name: 'Goal Getter', emoji: '🎯', description: 'Completed first savings goal', category: 'achievement', requirement: { type: 'completed_goals', value: 1 } },
    { id: 'budget_boss', name: 'Budget Boss', emoji: '👑', description: 'Entire month under budget', category: 'achievement', requirement: { type: 'streak', value: 30 } },
    { id: 'early_bird', name: 'Early Bird', emoji: '🚀', description: 'Logged expense before 9 AM', category: 'achievement' },

    // Milestone Badges
    { id: 'bronze_saver', name: 'Bronze Saver', emoji: '🥉', description: '₹1,000 total saved', category: 'milestone', requirement: { type: 'total_saved', value: 1000 } },
    { id: 'silver_saver', name: 'Silver Saver', emoji: '🥈', description: '₹5,000 total saved', category: 'milestone', requirement: { type: 'total_saved', value: 5000 } },
    { id: 'gold_saver', name: 'Gold Saver', emoji: '🥇', description: '₹10,000 total saved', category: 'milestone', requirement: { type: 'total_saved', value: 10000 } },
    { id: 'diamond_saver', name: 'Diamond Saver', emoji: '💎', description: '₹25,000 total saved', category: 'milestone', requirement: { type: 'total_saved', value: 25000 } },
    { id: 'platinum_elite', name: 'Platinum Elite', emoji: '👑', description: '₹50,000 total saved', category: 'milestone', requirement: { type: 'total_saved', value: 50000 } },
    { id: 'lakh_legend', name: 'Lakh Legend', emoji: '🏆', description: '₹1,00,000 total saved', category: 'milestone', requirement: { type: 'total_saved', value: 100000 } },
    { id: 'ten_percent_club', name: '10% Club', emoji: '📈', description: 'Saved 10% of monthly income', category: 'milestone', requirement: { type: 'monthly_savings_percent', value: 0.1 } },
    { id: 'twenty_percent_pro', name: '20% Pro', emoji: '📊', description: 'Saved 20% of monthly income', category: 'milestone', requirement: { type: 'monthly_savings_percent', value: 0.2 } },
    { id: 'thirty_percent_champion', name: '30% Champion', emoji: '💪', description: 'Saved 30% of monthly income', category: 'milestone', requirement: { type: 'monthly_savings_percent', value: 0.3 } },
    { id: 'emergency_ready', name: 'Emergency Ready', emoji: '🛡️', description: 'Emergency fund = 3 months expenses', category: 'milestone', requirement: { type: 'emergency_fund_months', value: 3 } },
    { id: 'fortress_built', name: 'Fortress Built', emoji: '🏰', description: 'Emergency fund = 6 months expenses', category: 'milestone', requirement: { type: 'emergency_fund_months', value: 6 } },

    // Challenge Badges
    { id: 'weekend_warrior', name: 'Weekend Warrior', emoji: '🌙', description: 'Under budget Sat + Sun', category: 'challenge', requirement: { type: 'weekend_warrior', value: 1 } },
    { id: 'perfect_week', name: 'Perfect Week', emoji: '🏆', description: 'All 7 days under budget', category: 'challenge', requirement: { type: 'streak', value: 7 } },
    { id: 'no_takeout_champion', name: 'No Takeout Champion', emoji: '🍕', description: '7 days without food delivery', category: 'challenge' },
    { id: 'coffee_cutter', name: 'Coffee Cutter', emoji: '☕', description: '7 days without café spending', category: 'challenge' },
    { id: 'shopping_stopper', name: 'Shopping Stopper', emoji: '🛒', description: 'No impulse shopping for 14 days', category: 'challenge' },
    { id: 'entertainment_economist', name: 'Entertainment Economist', emoji: '🎬', description: 'Entertainment under ₹500 for a month', category: 'challenge' },
    { id: 'zero_day_hero', name: 'Zero Day Hero', emoji: '🚫', description: 'A day with ₹0 spent', category: 'challenge', requirement: { type: 'zero_spend_days', value: 1 } },
    { id: 'triple_zero', name: 'Triple Zero', emoji: '🌟', description: '3 consecutive zero-spend days', category: 'challenge', requirement: { type: 'zero_spend_days', value: 3 } },
    { id: 'first_week_finisher', name: 'First Week Finisher', emoji: '📅', description: 'Under budget first 7 days of month', category: 'challenge' },
    { id: 'month_end_master', name: 'Month End Master', emoji: '🎊', description: 'Under budget last 7 days of month', category: 'challenge' },
    { id: 'biggest_saver', name: 'Biggest Saver', emoji: '💸', description: 'Personal best daily savings', category: 'challenge' },
    { id: 'comeback_king', name: 'Comeback King', emoji: '🔄', description: 'Recovered from overspending day', category: 'challenge' },
    { id: 'financial_scholar', name: 'Financial Scholar', emoji: '🎓', description: 'Used the app for 30 days straight', category: 'challenge', requirement: { type: 'app_usage_days', value: 30 } },

    // Seasonal Badges
    { id: 'diwali_discipline', name: 'Diwali Discipline', emoji: '🪔', description: 'Under budget during Diwali week', category: 'seasonal' },
    { id: 'holiday_hero', name: 'Holiday Hero', emoji: '🎄', description: 'Under budget during December', category: 'seasonal' },
    { id: 'new_year_ninja', name: 'New Year Ninja', emoji: '🎉', description: 'Under budget first week of January', category: 'seasonal' },
    { id: 'valentine_saver', name: 'Valentine Saver', emoji: '💕', description: 'Under budget on Feb 14th', category: 'seasonal' },
];

export function getBadgeById(id: string): Badge | undefined {
    return BADGES.find(b => b.id === id);
}

export function getBadgesByCategory(category: BadgeCategory): Badge[] {
    return BADGES.filter(b => b.category === category);
}

// Context needed to evaluate badge eligibility
export interface BadgeCheckContext {
    currentStreak: number;
    longestStreak: number;
    totalSaved: number;  // Cumulative daily savings
    monthlyIncome: number;
    monthlySavings: number;
    emergencyFund: number;
    monthlyExpenses: number;
    hasCompletedGoal: boolean;
    hasZeroSpendDay: boolean;
    consecutiveZeroSpendDays: number;
    hasWeekendUnderBudget: boolean;
    earnedBadges: string[];
}

// Check which new badges the user is eligible for
export function checkBadgeEligibility(context: BadgeCheckContext): string[] {
    const newBadges: string[] = [];
    const { earnedBadges } = context;

    // Helper to check if already earned
    const notEarned = (id: string) => !earnedBadges.includes(id);

    // Filter out badges that are already earned
    const potentialBadges = BADGES.filter(b => notEarned(b.id));

    for (const badge of potentialBadges) {
        const progress = calculateBadgeProgress(badge.id, context);
        if (progress >= 100) {
            newBadges.push(badge.id);
        }
    }

    return newBadges;
}

/**
 * Calculates current progress for a badge as a percentage (0-100)
 */
export function calculateBadgeProgress(badgeId: string, context: BadgeCheckContext): number {
    const badge = getBadgeById(badgeId);
    if (!badge || !badge.requirement) return 0;

    const { type, value } = badge.requirement;
    let current = 0;

    switch (type) {
        case 'streak':
            current = context.currentStreak;
            break;
        case 'total_saved':
            current = context.totalSaved;
            break;
        case 'monthly_savings_percent':
            current = context.monthlyIncome > 0 ? (context.monthlySavings / context.monthlyIncome) : 0;
            break;
        case 'emergency_fund_months':
            current = context.monthlyExpenses > 0 ? (context.emergencyFund / context.monthlyExpenses) : 0;
            break;
        case 'completed_goals':
            current = context.hasCompletedGoal ? 1 : 0;
            break;
        case 'zero_spend_days':
            current = context.hasZeroSpendDay ? Math.max(context.consecutiveZeroSpendDays, 1) : 0;
            break;
        case 'weekend_warrior':
            current = context.hasWeekendUnderBudget ? 1 : 0;
            break;
        case 'app_usage_days':
            current = context.longestStreak; // Simplified for now
            break;
        default:
            return 0;
    }

    // Multiply by 100 for percentage
    const progress = (current / value) * 100;
    return Math.min(100, Math.max(0, progress));
}
