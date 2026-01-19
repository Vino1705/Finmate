'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/hooks/use-app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, TrendingUp } from 'lucide-react';
import { Investment, SIPPlan } from '@/lib/investment-types';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import InvestmentDialog from '@/components/investments/investment-dialog';
import SIPCalculator from '@/components/investments/sip-calculator';
import TaxOptimizer from '@/components/investments/tax-optimizer';
import InvestmentRecommendations from '@/components/investments/investment-recommendations';
import PortfolioOverview from '@/components/investments/portfolio-overview';

export default function InvestmentsPage() {
  const { user, profile } = useApp();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [sipPlans, setSipPlans] = useState<SIPPlan[]>([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [portfolioGain, setPortfolioGain] = useState(0);
  const [gainPercentage, setGainPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showInvestmentDialog, setShowInvestmentDialog] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadInvestmentData();
  }, [user]);

  const loadInvestmentData = async () => {
    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', user!.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setInvestments(data.investments || []);
        setSipPlans(data.sipPlans || []);
        calculatePortfolioMetrics(data.investments || []);
      }
    } catch (error) {
      console.error('Error loading investment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePortfolioMetrics = (invests: Investment[]) => {
    const totalInvested = invests.reduce((sum, inv) => sum + inv.purchaseAmount, 0);
    const currentValue = invests.reduce((sum, inv) => sum + inv.currentValue, 0);
    const gain = currentValue - totalInvested;
    const percent = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

    setPortfolioValue(currentValue);
    setPortfolioGain(gain);
    setGainPercentage(percent);
  };

  const handleAddInvestment = async (investment: Investment) => {
    try {
      const userDocRef = doc(db, 'users', user!.uid);
      await updateDoc(userDocRef, {
        investments: arrayUnion(investment),
      });
      setInvestments([...investments, investment]);
      setShowInvestmentDialog(false);
      calculatePortfolioMetrics([...investments, investment]);
    } catch (error) {
      console.error('Error adding investment:', error);
      alert('Failed to add investment. Please try again.');
    }
  };

  const handleAddSIP = async (plan: SIPPlan) => {
    try {
      const userDocRef = doc(db, 'users', user!.uid);
      await updateDoc(userDocRef, {
        sipPlans: arrayUnion(plan),
      });
      setSipPlans([...sipPlans, plan]);
    } catch (error) {
      console.error('Error adding SIP plan:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading your investment portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Investments & Wealth Building</h1>
          <p className="text-muted-foreground">Track and grow your investment portfolio with AI-powered insights</p>
        </div>
        <Button onClick={() => setShowInvestmentDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Investment
        </Button>
      </div>

      {/* Welcome Alert */}
      <Alert className="bg-purple-50 border-purple-200">
        <TrendingUp className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-900">
          Welcome to FinMate's investment hub! Build long-term wealth with smart portfolio management, tax optimization, and AI recommendations tailored for you.
        </AlertDescription>
      </Alert>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-muted-foreground">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-bold">₹{portfolioValue.toLocaleString('en-IN')}</div>
            <p className="text-sm text-muted-foreground">Total current value of all investments</p>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-muted-foreground">Total Gain/Loss</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`text-4xl font-bold ${portfolioGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{Math.abs(portfolioGain).toLocaleString('en-IN')}
            </div>
            <p className={`text-sm ${gainPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {gainPercentage >= 0 ? '+' : ''}{gainPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-muted-foreground">Active Investments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-bold">{investments.length}</div>
            <p className="text-sm text-muted-foreground">Across {new Set(investments.map(i => i.type)).size} asset classes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Portfolio</TabsTrigger>
          <TabsTrigger value="sip">SIP Calculator</TabsTrigger>
          <TabsTrigger value="tax">Tax Optimizer</TabsTrigger>
          <TabsTrigger value="recommendations">AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <PortfolioOverview investments={investments} sipPlans={sipPlans} />
        </TabsContent>

        <TabsContent value="sip" className="space-y-4">
          <SIPCalculator sipPlans={sipPlans} onAddSIP={handleAddSIP} />
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <TaxOptimizer investments={investments} profile={profile ?? undefined} />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <InvestmentRecommendations profile={profile ?? undefined} investments={investments} />
        </TabsContent>
      </Tabs>

      {/* Investment Dialog Modal */}
      <InvestmentDialog
        open={showInvestmentDialog}
        onOpenChange={setShowInvestmentDialog}
        onSave={handleAddInvestment}
      />

      {/* Empty State */}
      {investments.length === 0 && (
        <Card className="text-center py-12 border-dashed">
          <TrendingUp className="w-12 h-12 mx-auto text-purple-300 mb-4" />
          <CardTitle>Start Building Your Investment Portfolio</CardTitle>
          <CardDescription className="mt-2 mb-4">
            Begin your wealth-building journey by adding your first investment
          </CardDescription>
          <Button onClick={() => setShowInvestmentDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Investment
          </Button>
        </Card>
      )}
    </div>
  );
}