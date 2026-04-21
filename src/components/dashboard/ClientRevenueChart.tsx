import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface ClientData {
  id: number;
  name: string;
  totalRevenue: number;
  invoiceCount: number;
}

interface ClientRevenueChartProps {
  clients?: ClientData[];
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const ClientRevenueChart: React.FC<ClientRevenueChartProps> = ({ clients = [] }) => {
  const maxRevenue = Math.max(...clients.map(c => c.totalRevenue), 1);

  return (
    <Card className="border-gray-200/60 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
          <BarChart3 size={16} className="text-emerald-500" />
          Top Clients by Revenue
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {clients.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No client revenue data yet</div>
        ) : (
          <div className="space-y-3">
            {clients.slice(0, 8).map((client, i) => {
              const pct = (client.totalRevenue / maxRevenue) * 100;
              return (
                <div key={client.id} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                      <span className="text-sm text-gray-700 font-medium truncate max-w-[160px]">{client.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{formatINR(client.totalRevenue)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-6">
                    <div
                      className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-400 to-teal-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientRevenueChart;
