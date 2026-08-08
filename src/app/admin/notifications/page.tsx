import { AdminNotificationCenter } from "@/components/admin/admin-notification-center";
import { NotificationDeliveryCenter } from "@/components/admin/notification-delivery-center";
export const dynamic = "force-dynamic";
export default function AdminNotificationsPage() {
  return (
    <main className="space-y-8">
      <header>
        <h1 className="text-2xl font-black tracking-tight">
          Notifications and Delivery Center
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Collaboration alerts, delivery preferences, scheduler controls aur audit
          retention manage karein.
        </p>
      </header>
      <AdminNotificationCenter />
      <NotificationDeliveryCenter />
    </main>
  );
}
