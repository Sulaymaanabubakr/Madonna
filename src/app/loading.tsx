import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="aspect-square w-full rounded-none" />
                        <Skeleton className="h-4 w-2/3 rounded-none mx-auto" />
                        <Skeleton className="h-4 w-1/2 rounded-none mx-auto" />
                        <Skeleton className="h-4 w-1/3 rounded-none mx-auto" />
                    </div>
                ))}
            </div>
        </div>
    );
}
