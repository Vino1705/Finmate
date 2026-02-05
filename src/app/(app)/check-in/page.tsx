"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApp } from '@/hooks/use-app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { expenseCategories, Transaction } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMemo, useState } from 'react';
import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { CalendarIcon, Pencil, PieChart, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EndOfDaySummary } from '@/components/end-of-day-summary';
import { Cell, Legend, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import MicRecorder from '@/components/mic-recorder';
import OcrUploader from '@/components/ocr-uploader';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const expenseSchema = z.object({
  id: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'Amount must be positive'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().optional(),
});

type ExpenseValues = z.infer<typeof expenseSchema>;

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function CheckInPage() {
  const { profile, addTransaction, transactions, updateTransaction, deleteTransaction } = useApp();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  const categories = expenseCategories;

  const form = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      category: '',
      description: '',
      date: new Date().toISOString(),
    },
  });

  const editForm = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema)
  });

  const watchedDate = form.watch('date') || new Date().toISOString();
  const selectedDayKey = watchedDate.split('T')[0];

  const todaysTransactions = transactions
    .filter(t => t.date.startsWith(selectedDayKey))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const todaysSpending = todaysTransactions.reduce((sum, t) => sum + t.amount, 0);
  const dailyLimit = profile?.dailySpendingLimit || 0;
  const progress = dailyLimit > 0 ? (todaysSpending / dailyLimit) * 100 : 0;
  const remaining = dailyLimit - todaysSpending;

  const todaysExpenseData = useMemo(() => {
    const categoryTotals = todaysTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [todaysTransactions]);

  function onSubmit(data: ExpenseValues) {
    addTransaction(data);
    form.reset({ amount: 0, category: '', description: '', date: data.date });

    if (profile && (todaysSpending + data.amount) > profile.dailySpendingLimit && isSameDay(parseISO(data.date || ''), new Date())) {
      toast({
        variant: "destructive",
        title: 'Daily Limit Exceeded!',
        description: `You've spent ₹${(todaysSpending + data.amount).toFixed(2)} today, which is over your ₹${profile.dailySpendingLimit.toFixed(2)} limit.`,
      });
    }
  }

  function onEditSubmit(data: ExpenseValues) {
    if (!editingTransaction) return;
    updateTransaction(editingTransaction.id, data);
    setIsEditDialogOpen(false);
    setEditingTransaction(null);
  }

  function handleEditClick(transaction: Transaction) {
    setEditingTransaction(transaction);
    editForm.reset(transaction);
    setIsEditDialogOpen(true);
  }

  function handleDelete(transactionId: string) {
    deleteTransaction(transactionId);
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-primary/20">
          <CardHeader>
            <CardTitle>Log Expense</CardTitle>
            <CardDescription>Logging for {format(new Date(), "PPP")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 p-2 rounded-lg bg-muted/40">
                <div className="flex-1 w-full min-w-0">
                  <MicRecorder
                    targetForm="expense"
                    onResult={({ text, parsed }) => {
                      if (parsed && parsed.description && (parsed.amount || parsed.amount === 0)) {
                        const cat = parsed.categoryNormalized || parsed.category || 'Other';
                        addTransaction({
                          description: parsed.description,
                          amount: Number(parsed.amount),
                          category: cat,
                          date: new Date().toISOString(),
                        });
                        toast({ title: 'Expense added from voice', description: `${parsed.description} — ${cat}` });
                        form.reset({ amount: 0, category: '', description: '' });
                      } else {
                        toast({
                          variant: "destructive",
                          title: "Voice capture failed",
                          description: "We couldn't extract the amount or description. Please try again.",
                        });
                      }
                    }}
                  />
                </div>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <OcrUploader
                  targetForm="expense"
                  onResult={({ text, parsed }) => {
                    if (parsed && parsed.description && (parsed.amount || parsed.amount === 0)) {
                      const cat = parsed.categoryNormalized || parsed.category || 'Other';
                      addTransaction({
                        description: parsed.description,
                        amount: Number(parsed.amount),
                        category: cat,
                        date: new Date().toISOString(),
                      });
                      toast({ title: 'Expense added from image', description: `${parsed.description} — ${cat}` });
                      form.reset({ amount: 0, category: '', description: '' });
                    } else {
                      toast({
                        variant: "destructive",
                        title: "OCR failed",
                        description: "Could not read the receipt details. Try a clearer photo.",
                      });
                    }
                  }}
                />
              </div>

              <div className="w-full flex items-center text-muted-foreground my-2">
                <div className="flex-grow h-px bg-muted mr-2" />
                <div className="text-sm px-2">OR</div>
                <div className="flex-grow h-px bg-muted ml-2" />
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Lunch with friends" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat: string) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full">Add Transaction</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">{isSameDay(parseISO(watchedDate), new Date()) ? "Today's" : format(parseISO(watchedDate), "MMM do")} Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Budget Utilization</span>
                  <span>₹{todaysSpending.toFixed(2)} / ₹{dailyLimit.toFixed(2)}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className={`text-center font-bold text-lg ${remaining >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                  {remaining >= 0 ? `₹${remaining.toFixed(2)} Remaining` : `₹${Math.abs(remaining).toFixed(2)} Over Limit`}
                </div>
              </div>
            </CardContent>
          </Card>

          {todaysTransactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={todaysExpenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {todaysExpenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => `₹${v.toFixed(2)}`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Transactions List</CardTitle>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{todaysTransactions.length} entries</span>
            </CardHeader>
            <CardContent>
              {todaysTransactions.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[100px]">Time</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[80px] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todaysTransactions.map((t) => (
                        <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="text-xs text-muted-foreground">
                            {format(parseISO(t.date), "hh:mm a")}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{t.description}</span>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.category}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">₹{t.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditClick(t)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                                    <AlertDialogDescription>This will remove this record from your history.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <PieChart className="h-12 w-12 opacity-20 mb-4" />
                  <p>No activity recorded for this date.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EndOfDaySummary />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat: string) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full">Save Changes</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
