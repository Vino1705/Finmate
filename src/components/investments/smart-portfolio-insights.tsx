'use client';

import React, { useMemo } from 'react';
import { Investment } from '@/lib/investment-types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, TrendingUp, TrendingDown, Target, ShieldAlert, Sparkles } from 'lucide-react';

interface SmartPortfolioInsightsProps {
    investments: Investment[];
}

export default function SmartPortfolioInsights({ investments }: SmartPortfolioInsightsProps) {
    const insights = useMemo(() => {
        if (investments.length === 0) return [];

        const results = [];
        const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);

        // 1. Concentration Alert (> 20% in one asset)
        investments.forEach(inv => {
            const weight = (inv.currentValue / totalValue) * 100;
            if (weight > 20) {
                results.push({
                    type: 'risk',
                    title: 'High Concentration',
                    message: `${inv.name} makes up ${weight.toFixed(1)}% of your portfolio. High exposure to a single asset increases risk.`,
                    icon: <ShieldAlert className="h-5 w-5 text-amber-500" />
                });
            }
        });

        // 2. Performance Insights
        const sortedByReturn = [...investments].map(inv => ({
            ...inv,
            returnPct: inv.purchaseAmount > 0 ? ((inv.currentValue - inv.purchaseAmount) / inv.purchaseAmount) * 100 : 0
        })).sort((a, b) => b.returnPct - a.returnPct);

        if (sortedByReturn.length > 0) {
            const top = sortedByReturn[0];
            if (top.returnPct > 15) {
                results.push({
                    type: 'success',
                    title: 'Star Performer',
                    message: `${top.name} has grown by ${top.returnPct.toFixed(1)}%. Consider if you want to rebalance or ride the trend.`,
                    icon: <TrendingUp className="h-5 w-5 text-green-500" />
                });
            }

            const bottom = sortedByReturn[sortedByReturn.length - 1];
            if (bottom.returnPct < -5) {
                results.push({
                    type: 'warning',
                    title: 'Underperformer',
                    message: `${bottom.name} is down ${Math.abs(bottom.returnPct).toFixed(1)}%. Review the fundamentals of this investment.`,
                    icon: <TrendingDown className="h-5 w-5 text-destructive" />
                });
            }
        }

        // 3. Stagnation Alert (older than 1y, growth < 5%)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        investments.forEach(inv => {
            const pDate = new Date(inv.purchaseDate);
            const growth = inv.purchaseAmount > 0 ? ((inv.currentValue - inv.purchaseAmount) / inv.purchaseAmount) * 100 : 0;
            if (pDate < oneYearAgo && growth < 5 && growth > -5) {
                results.push({
                    type: 'info',
                    title: 'Stagnant Growth',
                    message: `${inv.name} has moved less than 5% in the last year. It might be dead capital.`,
                    icon: <AlertCircle className="h-5 w-5 text-blue-500" />
                });
            }
        });

        // 4. Diversification Check
        const types = new Set(investments.map(inv => inv.type));
        if (types.size < 3) {
            results.push({
                type: 'suggestion',
                title: 'Diversify Your Assets',
                message: 'You are invested in only ' + types.size + ' asset classes. Adding Gold or Bonds could reduce volatility.',
                icon: <Sparkles className="h-5 w-5 text-purple-500" />
            });
        }

        return results.slice(0, 4); // Show top 4 insights
    }, [investments]);

    if (investments.length === 0) return null;

    return (
        <Card className="border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Finmate Smart Insights
                </CardTitle>
                <CardDescription>AI-generated analysis of your portfolio health</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insights.length > 0 ? (
                        insights.map((insight, idx) => (
                            <div key={idx} className="flex gap-4 p-4 rounded-xl border bg-card/50 backdrop-blur-sm hover:shadow-sm transition-shadow">
                                <div className="mt-1 shrink-0">{insight.icon}</div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-sm">{insight.title}</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{insight.message}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-8 text-center text-muted-foreground italic">
                            Keep logging your investments to unlock deeper smart insights.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
