import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface QualityDistributionChartProps {
  gold: number;
  silver: number;
  bronze: number;
  assumed: number;
}

export function QualityDistributionChart({
  gold,
  silver,
  bronze,
  assumed
}: QualityDistributionChartProps) {
  const data = [
    { name: 'Gold', value: gold, color: '#eab308' },
    { name: 'Silver', value: silver, color: '#9ca3af' },
    { name: 'Bronze', value: bronze, color: '#ea580c' },
    { name: 'Assumed', value: assumed, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  const total = gold + silver + bronze + assumed;
  const verifiedPercentage = Math.round(((gold + silver) / total) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quality Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">
          {verifiedPercentage}% of your vault is verified (gold + silver)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{gold}</p>
            <p className="text-xs text-muted-foreground">Gold Tier</p>
          </div>
          <div className="text-center p-3 bg-gray-500/10 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">{silver}</p>
            <p className="text-xs text-muted-foreground">Silver Tier</p>
          </div>
          <div className="text-center p-3 bg-orange-500/10 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{bronze}</p>
            <p className="text-xs text-muted-foreground">Bronze Tier</p>
          </div>
          <div className="text-center p-3 bg-amber-500/10 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{assumed}</p>
            <p className="text-xs text-muted-foreground">Needs Review</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
