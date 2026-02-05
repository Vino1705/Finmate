'use client';

import { Investment } from '@/lib/investment-types';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, PieChart } from 'lucide-react';

interface PortfolioSummaryCardsProps {
    investments: Investment[];
}

interface SummaryCardData {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    bgGradient: string;
}

export default function PortfolioSummaryCards({ investments }: PortfolioSummaryCardsProps) {
    // Calculate key metrics
    const totalInvested = investments.reduce((sum, inv) => sum + inv.purchaseAmount, 0);
    const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalGain = currentValue - totalInvested;
    const returnPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    // Find top gainer and top loser
    const sortedByGain = [...investments]
        .map(inv => ({
            ...inv,
            gain: inv.currentValue - inv.purchaseAmount,
            gainPercent: inv.purchaseAmount > 0 ? ((inv.currentValue - inv.purchaseAmount) / inv.purchaseAmount) * 100 : 0,
        }))
        .sort((a, b) => b.gainPercent - a.gainPercent);

    const topGainer = sortedByGain.length > 0 ? sortedByGain[0] : null;
    const topLoser = sortedByGain.length > 0 ? sortedByGain[sortedByGain.length - 1] : null;

    // Count by type for diversification
    const typeCount = investments.reduce((acc, inv) => {
        acc[inv.type] = (acc[inv.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const cards: SummaryCardData[] = [
        {
            title: 'Portfolio Value',
            value: `₹${currentValue.toLocaleString('en-IN')}`,
            subtitle: `Invested ₹${totalInvested.toLocaleString('en-IN')}`,
            icon: <Wallet className="h-5 w-5" />,
            trend: totalGain >= 0 ? 'up' : 'down',
            trendValue: `${returnPercent >= 0 ? '+' : ''}${returnPercent.toFixed(1)}%`,
            bgGradient: 'from-violet-500/20 via-violet-500/10 to-transparent',
        },
        {
            title: 'Total Returns',
            value: `${totalGain >= 0 ? '+' : ''}₹${Math.abs(totalGain).toLocaleString('en-IN')}`,
            subtitle: `${returnPercent >= 0 ? 'Profit' : 'Loss'} on investments`,
            icon: totalGain >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />,
            trend: totalGain >= 0 ? 'up' : 'down',
            trendValue: `${returnPercent >= 0 ? '+' : ''}${returnPercent.toFixed(1)}%`,
            bgGradient: totalGain >= 0 ? 'from-emerald-500/20 via-emerald-500/10 to-transparent' : 'from-red-500/20 via-red-500/10 to-transparent',
        },
        {
            title: 'Top Gainer',
            value: topGainer ? topGainer.name : '—',
            subtitle: topGainer ? `+${topGainer.gainPercent.toFixed(1)}% (₹${topGainer.gain.toLocaleString('en-IN')})` : 'No data',
            icon: <ArrowUpRight className="h-5 w-5" />,
            trend: 'up',
            bgGradient: 'from-green-500/20 via-green-500/10 to-transparent',
        },
        {
            title: 'Top Loser',
            value: topLoser && topLoser.gainPercent < 0 ? topLoser.name : '—',
            subtitle: topLoser && topLoser.gainPercent < 0 ? `${topLoser.gainPercent.toFixed(1)}% (₹${topLoser.gain.toLocaleString('en-IN')})` : 'No losing assets',
            icon: <ArrowDownRight className="h-5 w-5" />,
            trend: 'down',
            bgGradient: 'from-rose-500/20 via-rose-500/10 to-transparent',
        },
    ];

    if (investments.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                    <PieChart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>Add investments to see portfolio summary</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, index) => (
                <Card key={index} className="relative overflow-hidden border-0 shadow-md">
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient}`} />

                    <CardContent className="relative p-4">
                        <div className="flex items-start justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {card.title}
                            </span>
                            <div className={`p-1.5 rounded-lg ${card.trend === 'up' ? 'bg-green-100 text-green-600' :
                                card.trend === 'down' ? 'bg-red-100 text-red-600' :
                                    'bg-muted text-muted-foreground'
                                }`}>
                                {card.icon}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-lg font-bold truncate" title={card.value}>
                                {card.value}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                                {card.subtitle}
                            </p>
                        </div>

                        {card.trendValue && (
                            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${card.trend === 'up'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}>
                                {card.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {card.trendValue}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}