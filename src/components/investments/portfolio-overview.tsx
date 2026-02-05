'use client';

import { Investment, SIPPlan } from '@/lib/investment-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '@/lib/utils';
import { Trash2, TrendingUp, AlertCircle, Target } from 'lucide-react';
import { useApp } from '@/hooks/use-app';
import SmartPortfolioInsights from './smart-portfolio-insights';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import PortfolioSummaryCards from './portfolio-summary-cards';

interface PortfolioOverviewProps {
  investments: Investment[];
  sipPlans: SIPPlan[];
  onDeleteInvestment?: (id: string) => void;
  onDeleteSIP?: (id: string) => void;
}

export default function PortfolioOverview({ investments, sipPlans, onDeleteInvestment, onDeleteSIP }: PortfolioOverviewProps) {

  const investmentsByType = investments.reduce((acc, inv) => {
    const existing = acc.find(item => item.name === inv.type);
    if (existing) {
      existing.value += inv.currentValue;
      existing.count += 1;
    } else {
      acc.push({ name: inv.type, value: inv.currentValue, count: 1 });
    }
    return acc;
  }, [] as { name: string; value: number; count: number }[]);

  const performanceData = investments.map(inv => ({
    name: inv.name.length > 15 ? inv.name.substring(0, 12) + '...' : inv.name,
    invested: inv.purchaseAmount,
    current: inv.currentValue,
    gain: inv.currentValue - inv.purchaseAmount,
  }));


  return (
    <div className="space-y-6">
      {/* Portfolio Summary Stats */}
      <PortfolioSummaryCards investments={investments} />

      {/* Smart Analysis Section */}
      <SmartPortfolioInsights investments={investments} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Asset Allocation</CardTitle>
            <CardDescription>Distribution across classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-4">
              {investmentsByType.length > 0 ? (
                <>
                  <div className="w-full md:w-1/2 h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={investmentsByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {investmentsByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-full md:w-1/2 space-y-2">
                    {investmentsByType.map((type, idx) => (
                      <div key={type.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                          <span className="text-xs font-medium">{type.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold">₹{type.value.toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full text-center py-12 text-muted-foreground">
                  No data to display
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Investment Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Growth Analysis</CardTitle>
            <CardDescription>Invested vs Current Market Value</CardDescription>
          </CardHeader>
          <CardContent>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.5)" />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                  <Bar dataKey="invested" fill="hsl(var(--primary)/0.4)" radius={[4, 4, 0, 0]} name="Invested" />
                  <Bar dataKey="current" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Value" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full text-center py-12 text-muted-foreground">
                No performance data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investments Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Holdings Details</CardTitle>
            <CardDescription>Manage your individual investments</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground italic">
              Your portfolio is currently empty.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Return</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map(inv => {
                    const gain = inv.currentValue - inv.purchaseAmount;
                    const returnPct = inv.purchaseAmount > 0 ? (gain / inv.purchaseAmount) * 100 : 0;
                    const isStock = inv.type === 'Stock';
                    const lastUpdated = inv.lastPriceFetchedAt
                      ? new Date(inv.lastPriceFetchedAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      : null;
                    return (
                      <TableRow key={inv.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm">{inv.name}</span>
                              {isStock && inv.symbol && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">
                                  {inv.symbol}
                                </span>
                              )}
                              {inv.quoteError && (
                                <span title={inv.quoteError}>
                                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase">{inv.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-muted-foreground">₹{inv.purchaseAmount.toLocaleString('en-IN')}</span>
                            {isStock && inv.quantity && (
                              <span className="text-muted-foreground">
                                {inv.quantity} shares
                                {inv.currentPrice && (
                                  <span className="ml-1">@ ₹{inv.currentPrice.toLocaleString('en-IN')}</span>
                                )}
                              </span>
                            )}
                            {isStock && lastUpdated && (
                              <span className="text-[10px] text-muted-foreground/70">Updated: {lastUpdated}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{inv.currentValue.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className={`text-right text-xs font-bold ${gain >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                          {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          {onDeleteInvestment && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Investment?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove '{inv.name}' from your portfolio?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDeleteInvestment(inv.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active SIPs */}
      {sipPlans.length > 0 && (
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">Systematic Investment Plans (SIP)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sipPlans.map(sip => (
                <div key={sip.id} className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow relative group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold">{sip.name}</h4>
                      <p className="text-xs text-muted-foreground">{sip.fundType} • Started {new Date(sip.startDate).toLocaleDateString()}</p>
                    </div>
                    {onDeleteSIP && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel SIP Plan?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will stop tracking this SIP plan. Historical data will be preserved if you've logged them as individual investments.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteSIP(sip.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Stop SIP</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <div>
                      <span className="text-2xl font-bold text-primary">₹{sip.monthlyAmount.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">/ month</span>
                    </div>
                    <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      Active
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
