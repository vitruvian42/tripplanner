
'use client';
import { useState } from 'react';
import type { Trip } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddExpenseDialog } from '@/components/trip/add-expense-dialog';
import { ExpenseList } from '@/components/trip/expense-list';
import { ExpenseSummary } from '@/components/trip/expense-summary';
import { useAuth } from '@/context/auth-context';


type ExpenseTrackerProps = {
    trip: Trip;
};

export function ExpenseTracker({ trip }: ExpenseTrackerProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { user } = useAuth();
    const expenses = trip.expenses || [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold font-headline">Transactions</h3>
                    <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
                    </Button>
                </div>
                <ExpenseList expenses={expenses} />
            </div>
            <div>
                 <h3 className="text-xl font-semibold font-headline mb-4">Summary</h3>
                 <ExpenseSummary expenses={expenses} collaborators={trip.collaborators} />
            </div>
            {user && (
                <AddExpenseDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    tripId={trip.id}
                    user={user}
                />
            )}
        </div>
    );
}
