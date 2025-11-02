'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { getBookingById } from '@/lib/actions/trips';
import { getTripById } from '@/lib/firestore';
import type { Booking, Trip } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Plane, Hotel, MapPin, Calendar, DollarSign, ArrowLeft, Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { use } from 'react';
import { Loader2 } from 'lucide-react';

type BookingPageProps = {
  params: Promise<{
    tripId: string;
    bookingId: string;
  }>;
};

export default function BookingVoucherPage({ params }: BookingPageProps) {
  const resolvedParams = use(params);
  const tripId = resolvedParams.tripId;
  const bookingId = resolvedParams.bookingId;
  const router = useRouter();
  const { toast } = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingData, tripData] = await Promise.all([
          getBookingById(bookingId),
          getTripById(tripId),
        ]);

        if (!bookingData) {
          notFound();
          return;
        }

        if (!tripData) {
          notFound();
          return;
        }

        setBooking(bookingData);
        setTrip(tripData);
      } catch (error) {
        console.error('Error fetching booking data:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId, tripId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!booking || !trip) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          /* Reset all margins and padding for print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* Hide sidebar - target the specific sidebar classes */
          aside,
          [data-sidebar],
          .hidden.border-r,
          div.hidden.border-r.bg-card,
          div:has(> .hidden.border-r),
          /* Hide dashboard layout wrapper if present */
          div[class*="flex"][class*="min-h-screen"]:has(aside),
          div[class*="grid"]:has(aside) {
            display: none !important;
          }
          
          /* Ensure main content wrapper is visible */
          div[class*="flex"][class*="flex-1"],
          div[class*="flex"][class*="min-h-screen"]:not(:has(aside)) {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Hide header */
          header,
          [data-header],
          header.sticky,
          header.sticky.top-0,
          /* Hide dashboard header specifically */
          div[class*="flex"][class*="flex-col"][class*="flex-1"] > header {
            display: none !important;
          }
          
          /* Hide navigation in header */
          nav {
            display: none !important;
          }
          
          /* Hide back button and action buttons */
          .no-print,
          button[class*="ghost"]:not([data-print-keep]),
          .flex.items-center.gap-2:has(button):not([data-print-keep]) {
            display: none !important;
          }
          
          /* Make main content full width when printing */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 100% !important;
            height: auto !important;
          }
          
          /* Ensure main and content wrappers are visible */
          main,
          div[class*="flex-1"],
          div[class*="max-w-7xl"] {
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            display: block !important;
          }
          
          /* Ensure voucher content is visible */
          .min-h-screen,
          div.min-h-screen {
            min-height: auto !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            display: block !important;
          }
          
          /* Container adjustments */
          .container,
          div[class*="container"] {
            max-width: 100% !important;
            padding: 1rem !important;
            margin: 0 auto !important;
            width: 100% !important;
            display: block !important;
          }
          
          /* Ensure all wrapper divs don't hide content */
          div[class*="flex"][class*="flex-col"]:not(:has(aside)) {
            display: block !important;
            width: 100% !important;
          }
          
          /* Ensure all content is visible */
          div, section, article {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          /* Adjust grid layout for print - remove sidebar column */
          div[class*="grid-cols"],
          [class*="grid-cols"] {
            display: block !important;
            grid-template-columns: 1fr !important;
          }
          
          /* Target flex containers that become grids on medium screens */
          [class*="flex"][class*="flex-col"][class*="md"] {
            display: block !important;
          }
          
          /* Card styles for print */
          .card,
          [class*="card"],
          [class*="Card"] {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
            background: white !important;
            page-break-inside: avoid !important;
            margin-bottom: 1rem !important;
          }
          
          /* Remove shadows that don't print well */
          [class*="shadow"] {
            box-shadow: none !important;
          }
          
          /* Ensure text is visible */
          p, h1, h2, h3, h4, h5, h6, span, div, li {
            color: #000 !important;
            background: transparent !important;
          }
          
          /* Badge styles */
          [class*="Badge"] {
            border: 1px solid #000 !important;
            background: white !important;
            color: #000 !important;
          }
          
          /* Button styles - make them look like text for print */
          button {
            border: 1px solid #000 !important;
            background: white !important;
            color: #000 !important;
          }
          
          /* Ensure separators are visible */
          [class*="Separator"] {
            border-color: #e5e7eb !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/trips/${tripId}`)}
            className="mb-4 no-print"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Trip
          </Button>
          
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold font-headline mb-2">Thank You for Booking!</h1>
              <p className="text-lg text-muted-foreground">
                Your trip to {trip.destination} has been confirmed
              </p>
            </div>
            <Badge variant="outline" className="text-base px-4 py-2">
              Booking ID: {booking.id}
            </Badge>
          </div>
        </div>

        {/* Booking Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
            <CardDescription>
              Booked on {formatDate(booking.bookingDate)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  {booking.currency} {booking.totalAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="bg-green-600 text-white">
                  {booking.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flight Bookings */}
        {booking.flights.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Flight Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {booking.flights.map((flight) => (
                <div key={flight.id} className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{flight.route}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{flight.description}</p>
                      {flight.airline && (
                        <p className="text-sm mt-1">Airline: {flight.airline}</p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {flight.type === 'roundTrip' ? 'Round Trip' : 'Internal'}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Booking Number</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono font-semibold">{flight.bookingNumber}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(flight.bookingNumber, 'Booking number')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Confirmation Code</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono font-semibold">{flight.confirmationCode}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(flight.confirmationCode, 'Confirmation code')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {flight.departureDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Departure Date</p>
                        <p className="font-semibold mt-1">{formatDate(flight.departureDate)}</p>
                      </div>
                    )}
                    {flight.returnDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Return Date</p>
                        <p className="font-semibold mt-1">{formatDate(flight.returnDate)}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">How to Use:</p>
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                      {flight.howToUse}
                    </pre>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Hotel Booking */}
        {booking.hotel && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hotel className="h-5 w-5" />
                Hotel Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{booking.hotel.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{booking.hotel.description}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Address
                  </p>
                  <p className="font-semibold mt-1">{booking.hotel.address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Booking Number</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono font-semibold">{booking.hotel.bookingNumber}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(booking.hotel!.bookingNumber, 'Booking number')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confirmation Code</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono font-semibold">{booking.hotel.confirmationCode}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(booking.hotel!.confirmationCode, 'Confirmation code')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Check-in
                    </p>
                    <p className="font-semibold mt-1">{formatDate(booking.hotel.checkIn)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Check-out
                    </p>
                    <p className="font-semibold mt-1">{formatDate(booking.hotel.checkOut)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">How to Use:</p>
                <pre className="text-sm whitespace-pre-wrap font-sans">
                  {booking.hotel.howToUse}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Bookings */}
        {booking.activities.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Activity Bookings</CardTitle>
              <CardDescription>
                {booking.activities.length} {booking.activities.length === 1 ? 'activity' : 'activities'} booked
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {booking.activities.map((activity) => (
                <div key={activity.id} className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{activity.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activity.location && (
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Location
                        </p>
                        <p className="font-semibold mt-1">{activity.location.address}</p>
                      </div>
                    )}
                    {activity.activityDate && (
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Date
                        </p>
                        <p className="font-semibold mt-1">{formatDate(activity.activityDate)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Booking Number</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono font-semibold">{activity.bookingNumber}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(activity.bookingNumber, 'Booking number')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Confirmation Code</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono font-semibold">{activity.confirmationCode}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(activity.confirmationCode, 'Confirmation code')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">How to Use:</p>
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                      {activity.howToUse}
                    </pre>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 no-print">
          <Button
            variant="outline"
            onClick={() => {
              // Wait a moment to ensure all content is rendered
              setTimeout(() => {
                window.print();
              }, 100);
            }}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Download Voucher
          </Button>
          <Button
            onClick={() => router.push(`/trips/${tripId}`)}
            className="flex items-center gap-2"
          >
            View Trip Details
          </Button>
        </div>

        {/* Important Notice */}
        <Card className="mt-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-6">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Important Information
            </p>
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
              <li>Please keep this voucher safe and accessible during your trip</li>
              <li>All confirmation codes and booking numbers are unique to your booking</li>
              <li>Contact the respective service providers directly for any changes or cancellations</li>
              <li>Save this page or download the voucher for offline access</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}

