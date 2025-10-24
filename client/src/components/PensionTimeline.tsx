import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Package, TrendingUp, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PensionTimelineProps {
  sentTime?: Date | null;
  receivedTime?: Date | null;
  clearedTime?: Date | null;
  availableTime?: Date | null;
  amount: number;
  source: string;
  status: string;
}

export function PensionTimeline({
  sentTime,
  receivedTime,
  clearedTime,
  availableTime,
  amount,
  source,
  status
}: PensionTimelineProps) {
  const stages = [
    {
      name: 'Sent',
      icon: Package,
      time: sentTime,
      description: 'Payment initiated'
    },
    {
      name: 'Received',
      icon: TrendingUp,
      time: receivedTime,
      description: 'Bank received funds'
    },
    {
      name: 'Cleared',
      icon: CheckCircle,
      time: clearedTime,
      description: 'Transaction verified'
    },
    {
      name: 'Available',
      icon: DollarSign,
      time: availableTime,
      description: 'Ready to use'
    }
  ];

  const getCurrentStage = () => {
    if (availableTime) return 4;
    if (clearedTime) return 3;
    if (receivedTime) return 2;
    if (sentTime) return 1;
    return 0;
  };

  const currentStage = getCurrentStage();

  const getNextPaymentDays = () => {
    // Assuming Social Security comes monthly on the 1st
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const daysUntil = Math.ceil((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil;
  };

  return (
    <Card data-testid="card-pension-timeline">
      <CardHeader>
        <CardTitle className="text-3xl" data-testid="text-pension-title">
          {source} Payment
        </CardTitle>
        <CardDescription className="text-xl" data-testid="text-pension-amount">
          ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline visualization */}
        <div className="relative" data-testid="container-timeline">
          {/* Progress line */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border" data-testid="line-progress-bg" />
          <div 
            className="absolute left-6 top-6 w-0.5 bg-primary transition-all duration-500"
            style={{ height: `${(currentStage / 4) * 100}%` }}
            data-testid="line-progress-active"
          />

          {/* Stage items */}
          <div className="space-y-8">
            {stages.map((stage, index) => {
              const isCompleted = index < currentStage;
              const isCurrent = index === currentStage;
              const Icon = stage.icon;

              return (
                <div 
                  key={stage.name} 
                  className="flex items-start gap-4 relative"
                  data-testid={`stage-${stage.name.toLowerCase()}`}
                >
                  {/* Icon circle */}
                  <div
                    className={`
                      flex items-center justify-center w-12 h-12 rounded-full border-2 z-10 transition-colors
                      ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : ''}
                      ${isCurrent ? 'bg-background border-primary animate-pulse text-primary' : ''}
                      ${!isCompleted && !isCurrent ? 'bg-background border-border text-muted-foreground' : ''}
                    `}
                    data-testid={`icon-stage-${stage.name.toLowerCase()}`}
                  >
                    <Icon className="w-6 h-6" data-testid={`icon-${stage.name.toLowerCase()}`} />
                  </div>

                  {/* Stage info */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-semibold" data-testid={`text-stage-name-${stage.name.toLowerCase()}`}>
                        {stage.name}
                      </h4>
                      {stage.time && (
                        <span className="text-xl text-muted-foreground" data-testid={`text-time-${stage.name.toLowerCase()}`}>
                          {formatDistanceToNow(new Date(stage.time), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <p className="text-xl text-muted-foreground mt-1" data-testid={`text-description-${stage.name.toLowerCase()}`}>
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next payment countdown for completed payments */}
        {status === 'completed' && source === 'Social Security' && (
          <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20" data-testid="card-next-payment">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-primary" data-testid="icon-next-payment" />
              <div>
                <p className="text-xl font-semibold" data-testid="text-next-payment-label">
                  Next Payment
                </p>
                <p className="text-xl text-muted-foreground" data-testid="text-next-payment-days">
                  Expected in {getNextPaymentDays()} days
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-xl text-muted-foreground" data-testid="text-status-label">
            Status:
          </span>
          <span 
            className={`
              text-xl font-semibold
              ${status === 'completed' ? 'text-foreground' : ''}
              ${status === 'clearing' ? 'text-primary' : ''}
              ${status === 'scheduled' ? 'text-foreground' : ''}
            `}
            data-testid="text-status-value"
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
