import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Plus, Edit, Sparkles, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TimelineEvent {
  id: string;
  type: 'added' | 'edited' | 'enhanced' | 'upgraded';
  description: string;
  timestamp: Date;
  metadata?: any;
}

interface VaultTimelineViewProps {
  events: TimelineEvent[];
}

export function VaultTimelineView({ events }: VaultTimelineViewProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <Plus className="h-4 w-4" />;
      case 'edited':
        return <Edit className="h-4 w-4" />;
      case 'enhanced':
        return <Sparkles className="h-4 w-4" />;
      case 'upgraded':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'added':
        return 'text-blue-600 bg-blue-500/10';
      case 'edited':
        return 'text-yellow-600 bg-yellow-500/10';
      case 'enhanced':
        return 'text-purple-600 bg-purple-500/10';
      case 'upgraded':
        return 'text-green-600 bg-green-500/10';
      default:
        return 'text-gray-600 bg-gray-500/10';
    }
  };

  const groupedEvents = events.reduce((acc, event) => {
    const date = event.timestamp.toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Vault Timeline
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Track your vault evolution over time
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([date, dayEvents]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">{date}</h4>
                  <Badge variant="outline" className="text-xs">
                    {dayEvents.length} events
                  </Badge>
                </div>

                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="relative ml-4 pb-3 last:pb-0"
                    >
                      <div
                        className={`absolute left-[-1.625rem] top-0 w-6 h-6 rounded-full flex items-center justify-center ${getEventColor(event.type)}`}
                      >
                        {getEventIcon(event.type)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getEventColor(event.type)}`}
                          >
                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            <div className="space-y-1">
              <p className="font-semibold text-lg">
                {events.filter(e => e.type === 'added').length}
              </p>
              <p className="text-muted-foreground">Items Added</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-lg">
                {events.filter(e => e.type === 'enhanced').length}
              </p>
              <p className="text-muted-foreground">AI Enhancements</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
