'use client';

import { useState } from 'react';
import { personalTripAssistant, type PersonalTripAssistantOutput } from '@/ai/flows/ai-personal-trip-assistant';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AssistantCardProps = {
  tripDetails: string;
};

export function AssistantCard({ tripDetails }: AssistantCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [assistance, setAssistance] = useState<PersonalTripAssistantOutput | null>(null);
  const { toast } = useToast();

  const getAssistance = async () => {
    setIsLoading(true);
    setAssistance(null);
    try {
      const result = await personalTripAssistant({
        tripDetails,
        liveData: 'Current weather: Sunny, 75°F. No major traffic delays reported.',
        userPreferences: 'Prefers outdoor activities, historical sites, and local food experiences. Avoids large crowds if possible.',
      });
      setAssistance(result);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get assistance from AI. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Personal Assistant</CardTitle>
        <CardDescription>
          Your AI guide on the go. Get timely reminders and spontaneous recommendations based on live data and your preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Button onClick={getAssistance} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Get Assistance
              </>
            )}
          </Button>

          {assistance && (
            <div className="grid md:grid-cols-2 gap-6 w-full text-left pt-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg font-headline">Reminders</h3>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 whitespace-pre-wrap">{assistance.reminders}</CardContent>
                </Card>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg font-headline">Recommendations</h3>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 whitespace-pre-wrap">{assistance.recommendations}</CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
