
'use client';
import type { Expense } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Users } from 'lucide-react';

type ExpenseListProps = {
  expenses: Expense[];
};

export function ExpenseList({ expenses }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-lg border-2 border-dashed">
        <p className="text-lg font-medium text-muted-foreground">No expenses yet!</p>
        <p className="text-sm text-muted-foreground mt-1">Click "Add Expense" to start tracking your spending.</p>
      </div>
    );
  }

  // Sort expenses by date, most recent first
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-3">
      {sortedExpenses.map((expense) => (
        <Card key={expense.id} className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{expense.description}</p>
              <p className="text-sm text-muted-foreground">
                Paid by {expense.paidBy.name} on {format(new Date(expense.createdAt), 'MMM d, yyyy')}
              </p>
               <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Users className="w-3 h-3" />
                    <span>Split with {expense.split.splitBetween.length} people</span>
               </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-primary">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: expense.currency }).format(expense.amount)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
