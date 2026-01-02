import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { Mail, MessageSquare, Webhook } from "lucide-react";

export function AlertSettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alert Settings</h1>
          <p className="text-muted-foreground">
            Configure notification channels and alert preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NotificationChannelCard
          title="Email Notifications"
          description="Configure email notifications for alerts"
          icon={<Mail className="h-6 w-6" />}
          type="email"
        />

        <NotificationChannelCard
          title="Slack Integration"
          description="Send alerts to Slack channels"
          icon={<MessageSquare className="h-6 w-6" />}
          type="slack"
        />

        <NotificationChannelCard
          title="Webhook Notifications"
          description="Configure custom webhook endpoints"
          icon={<Webhook className="h-6 w-6" />}
          type="webhook"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Manage how and when you receive alert notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Email notifications will be sent to recipients configured in each notification channel.
            </p>
            <p>
              Slack notifications require a valid webhook URL from your Slack workspace.
            </p>
            <p>
              Custom webhooks allow you to integrate with third-party services like PagerDuty.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface NotificationChannelCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  type: string;
}

function NotificationChannelCard({
  title,
  description,
  icon,
}: NotificationChannelCardProps) {
  return (
    <Card className="hover:border-primary transition-colors cursor-pointer">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Click to configure this notification channel
        </p>
      </CardContent>
    </Card>
  );
}
