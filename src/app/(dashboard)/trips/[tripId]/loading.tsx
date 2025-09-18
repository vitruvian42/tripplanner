import { Skeleton } from "@/components/ui/skeleton";

export default function TripLoading() {
  return (
    <div className="w-full">
      {/* Image Gallery Skeleton */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-96">
        <Skeleton className="col-span-2 row-span-2 rounded-l-xl" />
        <Skeleton />
        <Skeleton className="rounded-tr-xl" />
        <Skeleton />
        <Skeleton className="rounded-br-xl" />
      </div>

      <div className="container mx-auto max-w-7xl mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-8">
            {/* Highlights Skeleton */}
            <div>
              <Skeleton className="h-10 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/4 mb-6" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 border rounded-xl">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </div>
            
            {/* Itinerary Skeleton */}
            <div className="space-y-6">
                <Skeleton className="h-8 w-1/3 mb-4" />
                <div className="flex gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </div>
                <div className="flex gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-6 w-2/3" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            </div>
          </div>
          
          {/* Sidebar Skeleton */}
          <div className="relative">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
