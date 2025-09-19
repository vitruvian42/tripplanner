
'use client';
import { useState } from 'react';
import type { Trip, Collaborator } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddExpenseDialog } from '@/components/trip/add-expense-dialog';
import { ExpenseList } from '@/components/trip/expense-list';
import { ExpenseSummary } from '@/components/trip/expense-summary';


type ExpenseTrackerProps = {
    trip: Trip;
    collaborators: Collaborator[];
};

export function ExpenseTracker({ trip, collaborators }: ExpenseTrackerProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // Filter out expenses that are missing the `split` property to handle old data.
    const expenses = (trip.expenses || []).filter(e => e.split);

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
                 <h3 className="text-xl font-semibold font-headline mb-4">Balances</h3>
                 <ExpenseSummary expenses={expenses} collaborators={collaborators} />
            </div>
            {collaborators && (
                <AddExpenseDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    tripId={trip.id}
                    collaborators={collaborators}
                />
            )}
        </div>
    );
}
