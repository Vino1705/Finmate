"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { IndianRupee, Target, TrendingUp, TrendingDown, PiggyBank, Wallet, ShoppingCart, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/hooks/use-app';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { SpendingForecast } from '@/components/spending-forecast';
import { SmartDailyBriefing } from '@/components/ui/smart-daily-briefing';
import { RecentAchievements } from '@/components/ui/recent-achievements';
import { TdsAllocationDialog } from '@/components/total-daily-savings';
import { isLastDayOfMonth } from 'date-fns';

function StatCard({ title, value, icon, change, changeType }: { title: string, value: string, icon: React.ReactNode, change?: string, changeType?: 'increase' | 'decrease' }) {
  return (
    <Card className="shadow-sm border-muted">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {changeType === 'increase' ? <TrendingUp className="h-4 w-4 mr-1 text-green-500" /> : <TrendingDown className="h-4 w-4 mr-1 text-red-500" />}
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, profile, goals, transactions, getTodaysSpending, getTotalGoalContributions, getCumulativeDailySavings } = useApp();

  const totalGoalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const todaysSpending = getTodaysSpending();
  const overallSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
  const income = profile?.income || 0;
  const spendingVsIncome = income > 0 ? `${((overallSpending / income) * 100).toFixed(0)}% of income` : '';

  const recentTransactions = transactions.slice(0, 7).reverse();
  const chartData = recentTransactions.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    amount: t.amount,
  }));

  const {
    monthlyNeeds,
    monthlyWants,
    monthlySavings,
    dailySpendingLimit,
    goalContributions,
  } = React.useMemo(() => {
    if (!profile) {
      return {
        monthlyNeeds: 0,
        monthlyWants: 0,
        monthlySavings: 0,
        dailySpendingLimit: 0,
        goalContributions: 0,
      };
    }

    const totalGoalContributions = getTotalGoalContributions();

    return {
      monthlyNeeds: profile.monthlyNeeds,
      monthlyWants: profile.monthlyWants,
      monthlySavings: profile.monthlySavings,
      dailySpendingLimit: profile.dailySpendingLimit,
      goalContributions: totalGoalContributions,
    };
  }, [profile, getTotalGoalContributions]);

  const todaysSavings = dailySpendingLimit - todaysSpending;
  const cumulativeSavings = getCumulativeDailySavings();

  const emergencyFund = profile?.emergencyFund;
  const emergencyFundProgress = emergencyFund && emergencyFund.target > 0 ? (emergencyFund.current / emergencyFund.target) * 100 : 0;

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Welcome to FinMate!</h2>
        <p className="text-muted-foreground mb-6">Please complete the onboarding to start managing your finances.</p>
        <Button asChild>
          <Link href="/onboarding">Start Onboarding</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">
          {profile?.name ? `Hello, ${profile.name.split(' ')[0]}!` : 'Welcome back!'}
        </h2>
      </div>

      <SmartDailyBriefing />

      <RecentAchievements />

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Monthly Income"
          value={`₹${income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={<IndianRupee className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Overall Spending"
          value={`₹${overallSpending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
          change={spendingVsIncome}
          changeType={income > overallSpending ? 'increase' : 'decrease'}
        />
        <Link href="/goals" className="block">
          <StatCard
            title="Total Goal Savings"
            value={`₹${totalGoalSaved.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            icon={<Target className="h-4 w-4 text-muted-foreground" />}
          />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-primary" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold">Total Daily Savings</CardTitle>
              <CardDescription className="text-xs">Buffered from daily unspent limits.</CardDescription>
            </div>
            <PiggyBank className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-between pt-0">
            <div className="py-4">
              <div className="text-4xl font-bold tracking-tight">₹{cumulativeSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <p className={`text-xs mt-2 flex items-center font-medium ${todaysSavings >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {todaysSavings >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {todaysSavings >= 0 ? `₹${todaysSavings.toFixed(2)} saved today` : `₹${Math.abs(todaysSavings).toFixed(2)} limit exceeded today`}
              </p>
            </div>

            <div className="space-y-3">
              {cumulativeSavings === 0 && todaysSavings < 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-[10px] text-destructive leading-tight font-medium">
                    Buffer exhausted. Your daily overspending is now directly impacting your planned savings.
                  </p>
                </div>
              )}

              <TdsAllocationDialog>
                <Button size="sm" variant="default" className="w-full text-xs h-9 shadow-sm" disabled={cumulativeSavings <= 0 && !isLastDayOfMonth(new Date())}>
                  <Target className="mr-2 h-3.5 w-3.5" />
                  Allocate to Goals/EF
                </Button>
              </TdsAllocationDialog>
            </div>
          </CardContent>
        </Card>

        <Link href="/emergency-fund" className="block h-full">
          <Card className="h-full hover:border-primary/50 transition-colors flex flex-col border-muted shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-orange-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-bold">Emergency Fund</CardTitle>
                <CardDescription className="text-xs">Your financial safety net.</CardDescription>
              </div>
              <ShieldAlert className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between pt-0">
              <div className="py-4">
                <div className="text-4xl font-bold tracking-tight">
                  ₹{(emergencyFund?.current || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                {emergencyFund && emergencyFund.target > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      <span>Goal: ₹{emergencyFund.target.toLocaleString('en-IN')}</span>
                      <span>{Math.round(emergencyFundProgress)}%</span>
                    </div>
                    <Progress value={emergencyFundProgress} className="h-1.5" />
                  </div>
                )}
              </div>
              <Button className="w-full text-xs h-9 mt-auto" variant="secondary">
                Manage Emergency Fund
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Financial Breakdown</CardTitle>
            <CardDescription>Monthly budget allocation across Needs, Wants, and Savings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-xl bg-muted/20 border border-border/50 flex flex-col items-center">
                <Wallet className="h-5 w-5 text-primary mb-2 opacity-80" />
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Needs</p>
                <p className="text-xl font-bold">₹{monthlyNeeds.toFixed(0)}</p>
              </div>
              <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex flex-col items-center">
                <ShoppingCart className="h-5 w-5 text-orange-500 mb-2 opacity-80" />
                <p className="text-[10px] uppercase font-bold text-orange-500/70 tracking-widest">Wants</p>
                <p className="text-xl font-bold">₹{monthlyWants.toFixed(0)}</p>
              </div>
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 flex flex-col items-center">
                <PiggyBank className="h-5 w-5 text-green-600 mb-2 opacity-80" />
                <p className="text-[10px] uppercase font-bold text-green-600/70 tracking-widest">Savings</p>
                <p className="text-xl font-bold">₹{monthlySavings.toFixed(0)}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Target className="h-4 w-4" /> Committed to Goals</span>
                <span className="font-semibold">₹{goalContributions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Available for Buffer</span>
                <span className="font-semibold">₹{Math.max(0, monthlySavings - goalContributions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-base font-bold pt-2 border-t">
                <span>Total Savings Target</span>
                <span>₹{monthlySavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <SpendingForecast />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="h-full shadow-sm">
          <CardHeader>
            <CardTitle>Recent Spending</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => `₹${value.toFixed(2)}`}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-full shadow-sm">
          <CardHeader>
            <CardTitle>Active Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.length > 0 ? goals.map(goal => (
              <div key={goal.id}>
                <div className="flex justify-between mb-1.5 align-baseline">
                  <span className="text-sm font-semibold">{goal.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ₹{goal.currentAmount.toLocaleString('en-IN')} / ₹{goal.targetAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <Progress value={(goal.currentAmount / goal.targetAmount) * 100} className="h-2" />
              </div>
            )) : (
              <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                <p className="text-sm">No active goals yet.</p>
                <Button variant="link" asChild className="mt-1 text-xs">
                  <Link href="/goals">Set one now</Link>
                </Button>
              </div>
            )}
            {goals.length > 0 && (
              <Button className="w-full mt-4 text-xs h-9" asChild variant="outline">
                <Link href="/goals">Manage Goals</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
