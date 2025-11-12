'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import * as tripActions from '@/lib/actions/trips';
import { useAuth } from '@/context/auth-context';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  startingPoint: z.string().min(2, { message: 'Starting point is required.' }),
  destination: z.string().min(2, { message: 'Destination is required.' }),
  dates: z.object({
    from: z.date({ required_error: 'Start date is required.' }),
    to: z.date({ required_error: 'End date is required.' }),
  }),
  interests: z.string().min(3, { message: 'Tell us at least one interest.' }),
  budget: z.string({ required_error: 'Please select a budget.' }),
});

type CreateTripDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateTripDialog({ isOpen, onOpenChange }: CreateTripDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile devices, especially iOS
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      const isMobileDevice = window.innerWidth < 768 || isIOS;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startingPoint: '',
      destination: '',
      interests: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
    setIsLoading(true);

    const tripData = {
      startingPoint: values.startingPoint,
      destination: values.destination,
      startDate: values.dates.from.toISOString().split('T')[0],
      endDate: values.dates.to.toISOString().split('T')[0],
      interests: values.interests,
      budget: values.budget,
    };

    const result = await tripActions.createTripAction({ tripData, userId: user.uid });

    if (result.success && result.tripId) {
      toast({
        title: 'Trip Created!',
        description: `Your adventure to ${values.destination} is being planned.`,
      });
      onOpenChange(false);
      form.reset();
      // Small delay to ensure Firestore write propagates before client-side read
      await new Promise(resolve => setTimeout(resolve, 300));
      router.push(`/trips/${result.tripId}`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to create trip.',
      });
    }

    setIsLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Create a New Trip</DialogTitle>
          <DialogDescription>Let our AI craft the perfect itinerary for your next adventure.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="startingPoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Point</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., New York, USA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Paris, France" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dates"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Trip Dates</FormLabel>
                  {isMobile ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <FormLabel className="text-sm font-normal text-muted-foreground">Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="w-full"
                            min={new Date().toISOString().split('T')[0]}
                            value={field.value?.from ? format(field.value.from, 'yyyy-MM-dd') : ''}
                            onChange={(e) => {
                              const dateStr = e.target.value;
                              const date = dateStr ? new Date(dateStr + 'T00:00:00') : undefined;
                              field.onChange({
                                from: date,
                                to: field.value?.to,
                              });
                            }}
                          />
                        </FormControl>
                      </div>
                      <div className="space-y-1.5">
                        <FormLabel className="text-sm font-normal text-muted-foreground">End Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="w-full"
                            min={
                              field.value?.from
                                ? format(field.value.from, 'yyyy-MM-dd')
                                : new Date().toISOString().split('T')[0]
                            }
                            value={field.value?.to ? format(field.value.to, 'yyyy-MM-dd') : ''}
                            onChange={(e) => {
                              const dateStr = e.target.value;
                              const date = dateStr ? new Date(dateStr + 'T00:00:00') : undefined;
                              field.onChange({
                                from: field.value?.from,
                                to: date,
                              });
                            }}
                          />
                        </FormControl>
                      </div>
                    </div>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value?.from && 'text-muted-foreground'
                            )}
                            type="button"
                          >
                            {field.value?.from ? (
                              field.value.to ? (
                                <>
                                  {format(field.value.from, 'LLL dd, y')} - {format(field.value.to, 'LLL dd, y')}
                                </>
                              ) : (
                                format(field.value.from, 'LLL dd, y')
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={{ from: field.value?.from, to: field.value?.to }}
                          onSelect={field.onChange}
                          numberOfMonths={2}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interests</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., History, museums, local cuisine, hiking" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a budget level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="budget">Budget-Friendly</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Trip
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
