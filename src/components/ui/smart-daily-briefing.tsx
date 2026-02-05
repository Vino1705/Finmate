"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useApp } from '@/hooks/use-app';
import { getDailyBriefing, DailyBriefingInput, DailyBriefingOutput } from '@/ai/flows/daily-briefing';
import { Loader2, Sparkles, AlertTriangle, Lightbulb, ChevronDown, HelpCircle, Flame, Trophy } from 'lucide-react';
import { format, getDate, getDaysInMonth, subDays, addDays, parseISO, startOfDay, isSameDay, isSameMonth } from 'date-fns';
import Link from 'next/link';

export function SmartDailyBriefing() {
    const { profile, transactions, getTodaysSpending, getCurrentStreak, getEarnedBadges } = useApp();
    const [briefing, setBriefing] = useState<DailyBriefingOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isReasoningOpen, setIsReasoningOpen] = useState(false);
    const [lastInputHash, setLastInputHash] = useState<string | null>(null);

    useEffect(() => {
        async function fetchBriefing() {
            if (!profile) {
                setIsLoading(false);
                return;
            }

            try {
                const now = new Date();
                const dayOfWeek = format(now, 'EEEE');
                const daysInMonth = getDaysInMonth(now);
                const currentDay = getDate(now);
                const daysLeftInMonth = daysInMonth - currentDay + 1;

                // Calculate remaining monthly budget
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthlySpending = transactions
                    .filter(t => new Date(t.date) >= monthStart)
                    .reduce((sum, t) => sum + t.amount, 0);
                const remainingMonthlyBudget = profile.monthlyWants - monthlySpending;

                // Extract today's transactions for the AI
                const today = startOfDay(now);
                const todaysTransactions = transactions
                    .filter(t => isSameDay(parseISO(t.date), today))
                    .map(t => ({
                        amount: t.amount,
                        category: t.category || 'Other',
                        description: t.description,
                    }));

                // Create a hash of the current state to avoid redundant calls
                const todaysSpending = getTodaysSpending();
                const currentHash = JSON.stringify({
                    income: profile.income,
                    limit: profile.dailySpendingLimit,
                    spent: todaysSpending,
                    remaining: remainingMonthlyBudget,
                    txCount: transactions.length,
                    todayTxHash: JSON.stringify(todaysTransactions)
                });

                if (currentHash === lastInputHash && briefing) {
                    setIsLoading(false);
                    return;
                }

                setIsLoading(true);
                setError(null);

                // Get last 30 days of transactions (excluding today for history patterns)
                const thirtyDaysAgo = subDays(now, 30);
                const recentRawTransactions = transactions
                    .filter(t => new Date(t.date) >= thirtyDaysAgo && !isSameDay(parseISO(t.date), today));

                const recentTransactions = recentRawTransactions
                    .slice(0, 50)
                    .map(t => ({
                        amount: t.amount,
                        category: t.category || 'Other',
                        date: format(new Date(t.date), 'MMM d'),
                        dayOfWeek: format(new Date(t.date), 'EEEE'),
                    }));

                // Pre-calculate run out date for accuracy
                let runOutDate: string | undefined = undefined;

                // Calculate average daily spending over last 30 days
                const totalRecentSpent = recentRawTransactions.reduce((sum, t) => sum + t.amount, 0);

                let divisor = 30;
                try {
                    if (recentRawTransactions.length > 0) {
                        const dates = recentRawTransactions
                            .map(t => parseISO(t.date).getTime())
                            .filter(t => !isNaN(t));

                        if (dates.length > 0) {
                            const earliestDate = new Date(Math.min(...dates));
                            const diffTime = Math.abs(now.getTime() - earliestDate.getTime());
                            const daysDiff = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                            divisor = Math.min(30, daysDiff);
                        }
                    }
                } catch (e) {
                    divisor = 30;
                }

                const avgDailySpend = divisor > 0 ? totalRecentSpent / divisor : 0;

                if (avgDailySpend > profile.dailySpendingLimit && remainingMonthlyBudget > 0 && avgDailySpend > 0) {
                    const daysUntilEmpty = remainingMonthlyBudget / avgDailySpend;
                    if (daysUntilEmpty < 365) {
                        const runOutDateObj = addDays(now, Math.ceil(daysUntilEmpty));
                        runOutDate = format(runOutDateObj, 'MMMM do');
                    }
                } else if (remainingMonthlyBudget <= 0) {
                    runOutDate = "today";
                }

                // Define category mappings (aligned with chatbot)
                const needsCategories = ['Groceries', 'Transport', 'Utilities', 'Rent/EMI', 'Healthcare', 'Education'];
                const wantsCategories = ['Food & Dining', 'Shopping', 'Entertainment', 'Other'];

                const essentialExpensesLogged = transactions
                    .filter(t => isSameMonth(new Date(t.date), now) && needsCategories.includes(t.category))
                    .reduce((sum, t) => sum + t.amount, 0);

                const discretionaryExpensesLogged = transactions
                    .filter(t => isSameMonth(new Date(t.date), now) && wantsCategories.includes(t.category))
                    .reduce((sum, t) => sum + t.amount, 0);

                const input: DailyBriefingInput = {
                    income: profile.income,
                    dailySpendingLimit: profile.dailySpendingLimit,
                    todaysSpending,
                    dayOfWeek,
                    daysLeftInMonth,
                    remainingMonthlyBudget,
                    todaysTransactions,
                    recentTransactions,
                    runOutDate,
                    essentialExpensesLogged,
                    discretionaryExpensesLogged,
                    savingsGoal: profile.monthlySavings,
                };

                const result = await getDailyBriefing(input);
                setBriefing(result);
                setLastInputHash(currentHash);
            } catch (err) {
                console.error('Failed to fetch daily briefing:', err);
                setError('Could not load your daily briefing');
                const spendable = Math.max(0, (profile?.dailySpendingLimit || 0) - getTodaysSpending());
                setBriefing({
                    spendableToday: spendable,
                    mainMessage: `You can spend ₹${spendable.toFixed(0)} today.`,
                    reasoning: 'Based on your daily spending limit.',
                });
            } finally {
                setIsLoading(false);
            }
        }

        fetchBriefing();
    }, [profile, transactions, getTodaysSpending, lastInputHash, briefing]);

    if (!profile) {
        return null;
    }

    if (isLoading) {
        return (
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
                <CardContent className="py-8 flex items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-muted-foreground">Getting your daily briefing...</span>
                </CardContent>
            </Card>
        );
    }

    if (!briefing) {
        return null;
    }

    return (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden relative">
            {/* Top bar with streak and badges */}
            <div className="absolute top-3 right-3 flex items-center gap-3">
                {/* Streak counter */}
                {getCurrentStreak() > 0 && (
                    <div className="flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded-full">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-bold text-orange-500">{getCurrentStreak()}</span>
                    </div>
                )}
                {/* Badges link */}
                <Link href="/badges" className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full hover:bg-primary/20 transition-colors">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-primary">{getEarnedBadges().length}</span>
                </Link>
            </div>

            <CardContent className="py-6 space-y-4">
                {/* Main decision line */}
                <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                        Today's Money Status
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                        {briefing.mainMessage}
                    </p>
                </div>

                {/* Warning message */}
                {briefing.warningMessage && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive font-medium">
                            {briefing.warningMessage}
                        </p>
                    </div>
                )}

                {/* Behavioral nudge */}
                {briefing.behaviorNudge && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                        <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                            {briefing.behaviorNudge}
                        </p>
                    </div>
                )}

                {/* Why? Collapsible Section */}
                {briefing.reasoning && (
                    <Collapsible open={isReasoningOpen} onOpenChange={setIsReasoningOpen}>
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-between text-muted-foreground hover:text-foreground"
                            >
                                <span className="flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4" />
                                    Why this suggestion?
                                </span>
                                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isReasoningOpen ? 'rotate-180' : ''}`} />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2">
                            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {briefing.reasoning}
                                </p>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </CardContent>
        </Card>
    );
}