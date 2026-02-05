"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/hooks/use-app';
import { ShieldCheck, Target, PiggyBank, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

interface TdsAllocationDialogProps {
    children: React.ReactNode;
}

export function TdsAllocationDialog({ children }: TdsAllocationDialogProps) {
    const { goals, allocateTds, getCumulativeDailySavings } = useApp();
    const [open, setOpen] = useState(false);
    const [allocation, setAllocation] = useState<{
        emergencyFund: number;
        goals: { goalId: string; amount: number }[];
    }>({
        emergencyFund: 0,
        goals: [],
    });

    const tdsBalance = getCumulativeDailySavings();

    useEffect(() => {
        if (open) {
            setAllocation({
                emergencyFund: 0,
                goals: goals.map(g => ({ goalId: g.id, amount: 0 })),
            });
        }
    }, [open, goals]);

    const totalAllocated = useMemo(() => {
        return allocation.emergencyFund + allocation.goals.reduce((sum, g) => sum + g.amount, 0);
    }, [allocation]);

    const remaining = tdsBalance - totalAllocated;
    const isOverAllocated = totalAllocated > tdsBalance;

    const handleGoalChange = (goalId: string, value: string) => {
        const amount = value === '' ? 0 : parseFloat(value);
        if (isNaN(amount)) return;

        setAllocation(prev => ({
            ...prev,
            goals: prev.goals.map((g: { goalId: string; amount: number }) =>
                g.goalId === goalId ? { ...g, amount } : g
            ),
        }));
    };

    const handleEmergencyFundChange = (value: string) => {
        const amount = value === '' ? 0 : parseFloat(value);
        if (isNaN(amount)) return;
        setAllocation(prev => ({ ...prev, emergencyFund: amount }));
    };

    const setMaxForEF = () => {
        const currentAllocatedToGoals = allocation.goals.reduce((sum, g) => sum + g.amount, 0);
        const available = Math.max(0, tdsBalance - currentAllocatedToGoals);
        setAllocation(prev => ({ ...prev, emergencyFund: available }));
    };

    const setMaxForGoal = (goalId: string) => {
        const currentGoalAmount = allocation.goals.find(g => g.goalId === goalId)?.amount || 0;
        const available = Math.max(0, tdsBalance - (totalAllocated - currentGoalAmount));
        setAllocation(prev => ({
            ...prev,
            goals: prev.goals.map((g: { goalId: string; amount: number }) =>
                g.goalId === goalId ? { ...g, amount: available } : g
            ),
        }));
    };

    const handleSubmit = async () => {
        if (isOverAllocated) return;
        await allocateTds(allocation);
        setOpen(false);
    };

    const distributeEvenly = () => {
        const count = goals.length + 1; // Goals + EF
        const share = Math.floor((tdsBalance / count) * 100) / 100;
        setAllocation({
            emergencyFund: share,
            goals: goals.map(g => ({ goalId: g.id, amount: share })),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl shadow-2xl">
                <div className="bg-primary/10 p-6 pb-4 border-b border-primary/20">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-primary">
                            <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
                                <PiggyBank className="h-6 w-6 text-primary-foreground" />
                            </div>
                            Allocate Savings
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground pt-2 text-sm">
                            Distribute your accumulated daily buffer of <span className="text-foreground font-bold font-mono">₹{tdsBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> between your funds.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6 max-h-[60vh] overflow-y-auto space-y-6">
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-8 bg-background/50" onClick={distributeEvenly}>
                            Split Evenly
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-8 bg-background/50" onClick={() => setAllocation({ emergencyFund: tdsBalance, goals: goals.map(g => ({ goalId: g.id, amount: 0 })) })}>
                            All to EF
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-8 bg-background/50" onClick={() => setAllocation({ emergencyFund: 0, goals: goals.map(g => ({ goalId: g.id, amount: 0 })) })}>
                            Clear
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                            <ShieldCheck className="h-3 w-3" /> Allocation Targets
                        </h4>

                        <Card className="p-4 border-muted/50 bg-muted/10 shadow-none">
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="ef" className="font-bold text-sm">Emergency Fund</Label>
                                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">General safety net fund</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                                        <Input
                                            id="ef"
                                            type="number"
                                            className="w-32 pl-6 pr-2 text-right font-mono text-sm h-9 border-muted bg-background"
                                            value={allocation.emergencyFund || ''}
                                            placeholder="0"
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEmergencyFundChange(e.target.value)}
                                        />
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-9 px-2 text-[10px] hover:text-primary" onClick={setMaxForEF}>
                                        MAX
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-3">
                            {goals.map((goal) => (
                                <div key={goal.id} className="flex items-center justify-between gap-4 px-4 py-2 rounded-lg border border-transparent hover:border-muted-foreground/10 transition-colors">
                                    <div className="space-y-0.5 flex-1">
                                        <Label htmlFor={goal.id} className="text-sm font-medium">{goal.name}</Label>
                                        <div className="flex items-center gap-1.5">
                                            <Target className="h-3 w-3 text-accent" />
                                            <div className="w-24 h-1 bg-muted rounded-full">
                                                <div
                                                    className="h-full bg-accent rounded-full"
                                                    style={{ width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono">₹</span>
                                            <Input
                                                id={goal.id}
                                                type="number"
                                                className="w-32 pl-6 pr-2 text-right font-mono text-sm h-8 border-muted bg-background/50"
                                                value={allocation.goals.find(g => g.goalId === goal.id)?.amount || ''}
                                                placeholder="0"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleGoalChange(goal.id, e.target.value)}
                                            />
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] hover:text-accent" onClick={() => setMaxForGoal(goal.id)}>
                                            MAX
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-6 bg-muted/30 border-t border-border/50">
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Remaining Balance</p>
                                <div className={`text-2xl font-bold font-mono tracking-tight transition-colors ${isOverAllocated ? 'text-destructive' : 'text-green-500'}`}>
                                    ₹{remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Allocated</p>
                                <div className="text-lg font-bold font-mono">
                                    ₹{totalAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        {isOverAllocated && (
                            <Alert variant="destructive" className="py-2 bg-destructive/5 border-destructive/20 animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs font-medium">
                                    You've over-allocated by ₹{Math.abs(remaining).toFixed(2)}. Please reduce your amounts.
                                </AlertDescription>
                            </Alert>
                        )}

                        {!isOverAllocated && remaining > 0 && (
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
                                <TrendingUp className="h-3 w-3 text-blue-500" />
                                The unallocated balance will stay in your savings buffer for next time.
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-6 flex gap-3">
                        <Button variant="ghost" className="flex-1 text-xs" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button
                            className="flex-[2] text-xs font-bold shadow-lg shadow-primary/20"
                            disabled={isOverAllocated}
                            onClick={handleSubmit}
                        >
                            Confirm Allocation
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
