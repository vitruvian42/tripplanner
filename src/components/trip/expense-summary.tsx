
'use client';
import type { Expense, Collaborator } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ArrowRight } from 'lucide-react';

type ExpenseSummaryProps = {
  expenses: Expense[];
  collaborators: Collaborator[];
};

export function ExpenseSummary({ expenses, collaborators }: ExpenseSummaryProps) {
  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trip Balances</CardTitle>
          <CardDescription>A summary of your group's expenses and balances.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No expenses have been added yet.</p>
        </CardContent>
      </Card>
    );
  }

  const currency = expenses.length > 0 ? expenses[0].currency : 'INR';
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);

  // 1. Calculate balances for each person
  const balances: { [uid: string]: number } = {};
  collaborators.forEach(c => balances[c.uid] = 0);

  expenses.forEach(expense => {
    // Add to the person who paid
    balances[expense.paidBy.uid] += expense.amount;
    
    // Subtract from the people who owe
    expense.split.splitBetween.forEach(split => {
      balances[split.uid] -= split.amount;
    });
  });

  // 2. Simplify debts
  const debtors = Object.entries(balances).filter(([, balance]) => balance < 0).sort((a,b) => a[1] - b[1]);
  const creditors = Object.entries(balances).filter(([, balance]) => balance > 0).sort((a,b) => b[1] - a[1]);
  const settlements: { from: string; to: string; amount: number }[] = [];

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const [debtorUid, debtorBalance] = debtors[i];
    const [creditorUid, creditorBalance] = creditors[j];
    
    const amount = Math.min(-debtorBalance, creditorBalance);

    const from = collaborators.find(c => c.uid === debtorUid)?.name || 'Unknown';
    const to = collaborators.find(c => c.uid === creditorUid)?.name || 'Unknown';

    settlements.push({ from, to, amount });

    debtors[i][1] += amount;
    creditors[j][1] -= amount;

    if (debtors[i][1] > -0.01) i++; // Use a small epsilon for float comparison
    if (creditors[j][1] < 0.01) j++;
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Balances</CardTitle>
        <CardDescription>Who owes who what. Simplified for easy settlement.</CardDescription>
      </CardHeader>
      <CardContent>
        {settlements.length > 0 ? (
          <div className="space-y-3">
            {settlements.map((s, index) => (
              <div key={index} className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 font-medium">
                  <Avatar className="h-6 w-6 text-xs"><AvatarFallback>{s.from.charAt(0)}</AvatarFallback></Avatar>
                  <span>{s.from}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                    <ArrowRight className="h-4 w-4"/>
                    <span className="font-bold text-primary">{formatCurrency(s.amount)}</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                    <Avatar className="h-6 w-6 text-xs"><AvatarFallback>{s.to.charAt(0)}</AvatarFallback></Avatar>
                    <span>{s.to}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Everyone is settled up!</p>
        )}
      </CardContent>
    </Card>
  );
}
