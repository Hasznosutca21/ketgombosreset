import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const AuthSkeleton = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Skeleton */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-border">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md glass-card">
          <CardHeader className="text-center space-y-2">
            <Skeleton className="h-8 w-40 mx-auto" />
            <Skeleton className="h-4 w-56 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Social Buttons Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>

            {/* Divider Skeleton */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-px flex-1" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-px flex-1" />
            </div>

            {/* Form Fields Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              
              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-28" />
              </div>

              {/* Submit Button */}
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>

            {/* Footer Links */}
            <div className="flex justify-center gap-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AuthSkeleton;
