
'use client';
import type { Expense } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type ExpenseSummaryProps = {
  expenses: Expense[];
  collaborators: string[];
};

export function ExpenseSummary({ expenses, collaborators }: ExpenseSummaryProps) {
    if (expenses.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Trip Spending</CardTitle>
                    <CardDescription>A summary of your group's expenses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">No expenses have been added for this trip yet.</p>
                </CardContent>
            </Card>
        )
    }

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const currency = expenses.length > 0 ? expenses[0].currency : 'USD';

  const contributions: { [key: string]: { name: string, amount: number } } = {};

  expenses.forEach(expense => {
    const { uid, displayName } = expense.paidBy;
    if (!contributions[uid]) {
      contributions[uid] = { name: displayName, amount: 0 };
    }
    contributions[uid].amount += expense.amount;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Spending</CardTitle>
        <CardDescription>A summary of your group's expenses.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">Total Spent</p>
          <p className="text-3xl font-bold">
            {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(totalSpent)}
          </p>
        </div>
        <Separator />
        <div className="mt-4 space-y-3">
            <h4 className="font-semibold">Who paid</h4>
            {Object.values(contributions).sort((a,b) => b.amount - a.amount).map(c => (
                 <div key={c.name} className="flex justify-between items-center text-sm">
                    <p>{c.name}</p>
                    <p className="font-medium">{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(c.amount)}</p>
                 </div>
            ))}
        </div>
        
      </CardContent>
    </Card>
  );
}
