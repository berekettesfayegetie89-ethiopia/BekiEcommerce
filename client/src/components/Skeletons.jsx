export function ProductSkeleton() {
  return (
    <div className="card">
      <div className="skeleton aspect-square rounded-t" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-1/3" /><div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" /><div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-4 w-1/3 mt-1" /><div className="skeleton h-8 w-full mt-2" />
      </div>
    </div>
  );
}
export function OrderSkeleton() {
  return <div className="card p-4 space-y-3"><div className="skeleton h-4 w-1/4" /><div className="skeleton h-3 w-full" /><div className="skeleton h-3 w-2/3" /></div>;
}
export function StatSkeleton() { return <div className="skeleton h-28 rounded" />; }
