"use client";

import { useEffect, useState } from 'react';
import { useApp } from '@/hooks/use-app';
import { format, parse, isAfter, startOfDay, isSameDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BellRing, Landmark } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReminderSystem() {
    const { profile, transactions } = useApp();
    const { toast } = useToast();
    const router = useRouter();
    const [showAlert, setShowAlert] = useState(false);
    const [lastReminderDate, setLastReminderDate] = useState<string | null>(null);

    useEffect(() => {
        if (!profile?.reminderTime) return;

        const checkReminder = () => {
            const now = new Date();
            const todayStr = format(now, 'yyyy-MM-dd');

            // Don't remind if already reminded today
            if (lastReminderDate === todayStr) return;

            // Check if user has logged any transaction today
            const hasTransactionsToday = transactions.some(t =>
                isSameDay(new Date(t.date), now)
            );

            if (hasTransactionsToday) {
                setLastReminderDate(todayStr); // Mark as done for today
                return;
            }

            // Parse reminder time
            try {
                const reminderTimeStr = profile.reminderTime!; // Already guarded
                const reminderTime = parse(reminderTimeStr, 'HH:mm', now);

                if (isAfter(now, reminderTime)) {
                    setShowAlert(true);
                    setLastReminderDate(todayStr); // Only show once per day
                }
            } catch (e) {
                console.error("Invalid reminder time format", e);
            }
        };

        // Run once on load and then every 5 minutes
        checkReminder();
        const interval = setInterval(checkReminder, 1000 * 60 * 5);
        return () => clearInterval(interval);
    }, [profile?.reminderTime, transactions, lastReminderDate]);

    return (
        <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
            <AlertDialogContent className="max-w-md border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
                <AlertDialogHeader className="items-center text-center">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <BellRing className="h-8 w-8 text-primary" />
                    </div>
                    <AlertDialogTitle className="text-2xl font-bold">Time for Daily Check-in!</AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-muted-foreground pt-2">
                        It's past <span className="font-bold text-primary">{profile?.reminderTime}</span> and you haven't recorded any transactions today.
                        Keep your <span className="font-bold text-orange-500">streak</span> alive!
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center gap-3 pt-6">
                    <button
                        onClick={() => setShowAlert(false)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors mr-4"
                    >
                        Dismiss
                    </button>
                    <AlertDialogAction
                        onClick={() => {
                            router.push('/check-in');
                            setShowAlert(false);
                        }}
                        className="px-8 bg-primary hover:bg-primary/90 flex items-center gap-2"
                    >
                        <Landmark className="h-4 w-4" />
                        Log Expenses Now
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
