import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TripLoading() {
  return (
    <div className="grid gap-4 md:gap-8">
      <Skeleton className="h-64 md:h-96 w-full rounded-xl" />

      <div className="w-full">
        <div className="grid w-full grid-cols-2 md:grid-cols-5 h-10 bg-muted rounded-md p-1 mb-4">
            <Skeleton className="h-full w-full rounded-sm" />
            <Skeleton className="h-full w-full rounded-sm" />
            <Skeleton className="h-full w-full rounded-sm" />
            <Skeleton className="h-full w-full rounded-sm" />
            <Skeleton className="h-full w-full rounded-sm" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
