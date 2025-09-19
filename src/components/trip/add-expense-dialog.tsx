
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addExpenseAction } from '@/lib/actions/trips';
import type { Collaborator } from '@/lib/types';
import { useAuth } from '@/context/auth-context';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';

const formSchema = z.object({
  description: z.string().min(2, { message: 'Description is required.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  currency: z.string().min(3, { message: 'Currency is required.' }).default('INR'),
  paidBy: z.string().min(1, { message: 'Please select who paid.' }),
  splitBetween: z.array(z.string()).min(1, { message: 'Select at least one person to split with.' }),
});

type AddExpenseDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  collaborators: Collaborator[];
};

export function AddExpenseDialog({ isOpen, onOpenChange, tripId, collaborators }: AddExpenseDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      currency: 'INR',
      paidBy: user?.uid,
      splitBetween: collaborators.map(c => c.uid), // Default to splitting with everyone
    },
  });

  // Reset form when dialog opens/closes or collaborators change
  useState(() => {
    form.reset({
      description: '',
      amount: undefined,
      currency: 'INR',
      paidBy: user?.uid,
      splitBetween: collaborators.map(c => c.uid),
    });
  });


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    setIsLoading(true);

    const paidByCollaborator = collaborators.find(c => c.uid === values.paidBy);
    if (!paidByCollaborator) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find who paid.' });
        setIsLoading(false);
        return;
    }
    
    // For now, we only support equal split
    const amountPerPerson = values.amount / values.splitBetween.length;

    const expenseData = {
      description: values.description,
      amount: values.amount,
      currency: values.currency,
      paidBy: { uid: paidByCollaborator.uid, name: paidByCollaborator.name },
      split: {
        type: 'EQUAL',
        splitBetween: values.splitBetween.map(uid => {
            const member = collaborators.find(c => c.uid === uid);
            return { uid: uid, name: member?.name || 'Unknown', amount: amountPerPerson }
        })
      }
    };

    const result = await addExpenseAction({ tripId, expenseData });

    if (result.success) {
      toast({ title: 'Expense Added', description: 'Your expense has been logged.' });
      onOpenChange(false);
      form.reset();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to add expense.' });
    }

    setIsLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Expense</DialogTitle>
          <DialogDescription>Log a new expense for this trip.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control} name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Input placeholder="e.g., Dinner at riverside" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control} name="amount"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Amount</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="1000.00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control} name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="INR" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="JPY">JPY</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control} name="paidBy"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Paid by</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select who paid" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {collaborators.map(c => (
                                    <SelectItem key={c.uid} value={c.uid}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
             />
             <FormField
                control={form.control} name="splitBetween"
                render={() => (
                    <FormItem>
                        <div className="mb-4">
                            <FormLabel className="text-base">Split between</FormLabel>
                        </div>
                        {collaborators.map((item) => (
                            <FormField
                                key={item.uid} control={form.control} name="splitBetween"
                                render={({ field }) => {
                                    return (
                                    <FormItem
                                        key={item.uid}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item.uid)}
                                            onCheckedChange={(checked) => {
                                                return checked
                                                ? field.onChange([...(field.value || []), item.uid])
                                                : field.onChange(
                                                    field.value?.filter(
                                                        (value) => value !== item.uid
                                                    )
                                                    )
                                            }}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal">{item.name}</FormLabel>
                                    </FormItem>
                                    )
                                }}
                            />
                        ))}
                        <FormMessage />
                    </FormItem>
                )}
             />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Expense
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
