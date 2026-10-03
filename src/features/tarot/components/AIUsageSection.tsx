import { useAuth } from "@/lib/auth-context";
import { QuotaDisplay } from "@/components/subscription";
import { UserPurchasesList } from "@/components/subscription";

export function AIUsageSection() {
  const { user } = useAuth();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">AI Usage Summary</h2>

      <div className="space-y-6">
        <QuotaDisplay variant="detailed" className="mb-4" />

        {user?.id && <UserPurchasesList userId={user.id} showExpired={false} maxItems={5} />}
      </div>
    </div>
  );
}