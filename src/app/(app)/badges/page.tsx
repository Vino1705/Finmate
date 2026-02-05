"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/hooks/use-app';
import { BADGES, Badge, BadgeCategory, BadgeCheckContext, calculateBadgeProgress } from '@/lib/gamification';
import { Flame, Lock, CheckCircle2, Trophy, Target, Star, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { startOfDay, isSameDay, parseISO, subDays } from 'date-fns';

export default function BadgesPage() {
    const {
        profile,
        getCurrentStreak,
        getCumulativeDailySavings,
        transactions,
        goals,
        getTodaysSpending
    } = useApp();

    const earnedBadgeIds = useMemo(() => profile?.gamification?.earnedBadges || [], [profile]);
    const currentStreak = getCurrentStreak();
    const longestStreak = profile?.gamification?.longestStreak || 0;
    const totalSaved = getCumulativeDailySavings();

    // Build context for progress calculation
    const badgeContext: BadgeCheckContext = useMemo(() => {
        if (!profile) return {
            currentStreak: 0,
            longestStreak: 0,
            totalSaved: 0,
            monthlyIncome: 0,
            monthlySavings: 0,
            emergencyFund: 0,
            monthlyExpenses: 0,
            hasCompletedGoal: false,
            hasZeroSpendDay: false,
            consecutiveZeroSpendDays: 0,
            hasWeekendUnderBudget: false,
            earnedBadges: [],
        };

        const today = startOfDay(new Date());
        const todaysSpending = getTodaysSpending();
        const hasZeroSpendDay = transactions.some(t => {
            const txDate = startOfDay(parseISO(t.date));
            const daySpending = transactions
                .filter(tx => isSameDay(parseISO(tx.date), txDate))
                .reduce((sum, tx) => sum + tx.amount, 0);
            return daySpending === 0;
        }) || todaysSpending === 0;

        let consecutiveZeroSpendDays = 0;
        let cDate = subDays(today, 1);
        for (let i = 0; i < 30; i++) {
            const daySpending = transactions
                .filter(t => isSameDay(parseISO(t.date), cDate))
                .reduce((sum, t) => sum + t.amount, 0);
            if (daySpending === 0) {
                consecutiveZeroSpendDays++;
                cDate = subDays(cDate, 1);
            } else {
                break;
            }
        }

        return {
            currentStreak,
            longestStreak,
            totalSaved,
            monthlyIncome: profile.income,
            monthlySavings: profile.monthlySavings,
            emergencyFund: profile.emergencyFund?.current || 0,
            monthlyExpenses: profile.monthlyNeeds + profile.monthlyWants,
            hasCompletedGoal: goals.some(g => g.currentAmount >= g.targetAmount),
            hasZeroSpendDay,
            consecutiveZeroSpendDays,
            hasWeekendUnderBudget: currentStreak >= 2,
            earnedBadges: earnedBadgeIds,
        };
    }, [profile, transactions, goals, currentStreak, longestStreak, totalSaved, earnedBadgeIds, getTodaysSpending]);

    const displayEarnedCount = earnedBadgeIds.length;

    const categories: { key: BadgeCategory; label: string; icon: React.ReactNode }[] = [
        { key: 'achievement', label: 'Achievements', icon: <Trophy className="h-4 w-4" /> },
        { key: 'milestone', label: 'Milestones', icon: <Target className="h-4 w-4" /> },
        { key: 'challenge', label: 'Challenges', icon: <Star className="h-4 w-4" /> },
        { key: 'seasonal', label: 'Seasonal', icon: <Calendar className="h-4 w-4" /> },
    ];

    if (!profile) return null;

    return (
        <div className="w-full space-y-8 pb-12">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold tracking-tight">Financial Hall of Fame</h1>
                    <p className="text-lg text-muted-foreground">Level up your financial discipline and collect unique badges.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                        {earnedBadgeIds.slice(0, 3).map((id, i) => (
                            <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xl overflow-hidden shadow-md">
                                {BADGES.find(b => b.id === id)?.emoji}
                            </div>
                        ))}
                        {earnedBadgeIds.length < 3 && [...Array(3 - earnedBadgeIds.length)].map((_, i) => (
                            <div key={i + earnedBadgeIds.length} className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xl overflow-hidden shadow-md opacity-40">
                                ❔
                            </div>
                        ))}
                    </div>
                    <div className="text-sm font-medium">
                        <span className="text-2xl font-bold">{displayEarnedCount}</span>
                        <span className="text-muted-foreground ml-1">/ {BADGES.length} Badges</span>
                    </div>
                </div>
            </header>

            {/* Top Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Flame className="h-16 w-16 text-orange-500" />
                    </div>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-orange-500/20 p-3 rounded-2xl">
                                <Flame className="h-8 w-8 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-orange-500/80 uppercase tracking-wider">Current Streak</p>
                                <p className="text-4xl font-black text-orange-500">{currentStreak} <span className="text-lg font-bold">Days</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy className="h-16 w-16 text-primary" />
                    </div>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/20 p-3 rounded-2xl">
                                <Trophy className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-primary/80 uppercase tracking-wider">Best Streak</p>
                                <p className="text-4xl font-black text-primary">{longestStreak} <span className="text-lg font-bold">Days</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Star className="h-16 w-16 text-emerald-500" />
                    </div>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-500/20 p-3 rounded-2xl">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-emerald-500/80 uppercase tracking-wider">Completion</p>
                                <p className="text-4xl font-black text-emerald-500">{((displayEarnedCount / BADGES.length) * 100).toFixed(0)}<span className="text-lg font-bold">%</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs System */}
            <Tabs defaultValue="achievement" className="w-full space-y-8">
                <div className="flex justify-center">
                    <TabsList className="bg-muted/50 p-1 h-auto flex-wrap justify-center border border-border/50 rounded-2xl">
                        {categories.map(cat => (
                            <TabsTrigger
                                key={cat.key}
                                value={cat.key}
                                className="px-6 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all gap-2"
                            >
                                {cat.icon}
                                <span className="font-semibold">{cat.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {categories.map(cat => (
                    <TabsContent key={cat.key} value={cat.key} className="mt-0 outline-none">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6"
                        >
                            {BADGES.filter(b => b.category === cat.key).map(badge => (
                                <BadgeCard
                                    key={badge.id}
                                    badge={badge}
                                    isEarned={earnedBadgeIds.includes(badge.id)}
                                    progress={calculateBadgeProgress(badge.id, badgeContext)}
                                />
                            ))}
                        </motion.div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

function BadgeCard({ badge, isEarned, progress }: { badge: Badge; isEarned: boolean; progress: number }) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="h-full"
        >
            <Card className={`h-full border-2 transition-all duration-300 relative overflow-hidden ${isEarned
                ? 'bg-gradient-to-br from-primary/10 via-background to-primary/5 border-primary/30 shadow-indigo-500/5'
                : 'bg-muted/10 border-border/40 grayscale-[0.8] opacity-80'
                }`}>

                {/* Visual Accent */}
                {isEarned && (
                    <div className="absolute -top-2 -right-2 bg-primary/20 blur-2xl w-24 h-24 rounded-full pointer-events-none" />
                )}

                <CardContent className="pt-8 pb-6 px-6 flex flex-col items-center text-center h-full">
                    {/* Ring Progress or Icon */}
                    <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
                        {/* Background Ring */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90 scale-x-[-1]">
                            <circle
                                cx="56"
                                cy="56"
                                r="52"
                                className={`stroke-current fill-none stroke-[6px] ${isEarned ? 'text-primary/20' : 'text-muted/20'}`}
                            />
                            <circle
                                cx="56"
                                cy="56"
                                r="52"
                                className={`stroke-current fill-none stroke-[6px] transition-all duration-1000 ease-out ${isEarned ? 'text-primary' : 'text-primary/40'}`}
                                strokeDasharray={`${progress * 3.26} 326`}
                                strokeLinecap="round"
                            />
                        </svg>

                        {/* Centered Emoji or Lock */}
                        <div className={`relative z-10 transition-transform duration-300 ${isEarned ? 'scale-125' : 'scale-100'}`}>
                            {isEarned ? (
                                <span className="text-5xl" role="img" aria-label={badge.name}>
                                    {badge.emoji}
                                </span>
                            ) : (
                                <div className="bg-muted/50 p-4 rounded-full">
                                    <Lock className="h-10 w-10 text-muted-foreground/50" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Text Details */}
                    <div className="space-y-2 flex-1">
                        <h3 className={`font-bold text-xl tracking-tight ${isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {badge.name}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed px-2">
                            {badge.description}
                        </p>
                    </div>

                    {/* Bottom Status */}
                    <div className="mt-8 w-full pt-4 border-t border-border/50">
                        {isEarned ? (
                            <div className="flex items-center justify-center gap-1.5 text-primary font-bold text-sm bg-primary/10 py-2 rounded-xl">
                                <CheckCircle2 className="h-4 w-4" />
                                COLLECTED
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] items-center px-1 font-bold text-muted-foreground uppercase tracking-widest">
                                    <span>Progress</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary/50 transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}