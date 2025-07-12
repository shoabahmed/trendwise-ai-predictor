
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';

interface StockData {
  Date: string;
  series: string;
  OPEN: string;
  HIGH: string;
  LOW: string;
  'PREV. CLOSE': string;
  ltp: string;
  close: string;
  vwap: string;
  '52W H': string;
  '52W L': string;
  VOLUME: string;
  VALUE: string;
  'No of trades': string;
}

interface Predictions {
  targetPrice: number;
  predictedHigh: number;
  predictedLow: number;
  confidence: number;
  volatility: number;
  recommendation: string;
}

interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  index: number;
  predicted?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
    value: number;
    dataKey: string;
  }>;
  label?: string;
}

interface StockChartProps {
  data: StockData[] | null;
  predictions: Predictions | null;
}

const StockChart: React.FC<StockChartProps> = ({ data, predictions }) => {
  const chartData = useMemo(() => {
    if (!data) return [];
    
    return data.slice(-30).map((row, index) => ({
      date: new Date(row.Date).toLocaleDateString(),
      open: parseFloat(row.OPEN),
      high: parseFloat(row.HIGH),
      low: parseFloat(row.LOW),
      close: parseFloat(row.close),
      volume: parseFloat(row.VOLUME),
      index: index
    }));
  }, [data]);

  const predictionData = useMemo(() => {
    if (!predictions || !chartData.length) return [];
    
    const lastDataPoint = chartData[chartData.length - 1];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return [
      lastDataPoint,
      {
        date: tomorrow.toLocaleDateString(),
        close: predictions.targetPrice,
        high: predictions.predictedHigh,
        low: predictions.predictedLow,
        predicted: true,
        index: chartData.length,
        open: 0,
        volume: 0
      }
    ];
  }, [predictions, chartData]);

  const combinedData = useMemo(() => {
    return [...chartData, ...(predictionData.length > 1 ? [predictionData[1]] : [])];
  }, [chartData, predictionData]);

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPredicted = data.predicted;
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {isPredicted && <p className="text-xs text-blue-600 font-medium">PREDICTED</p>}
          <div className="space-y-1 text-sm">
            {data.open > 0 && <p>Open: ${data.open.toFixed(2)}</p>}
            <p>Close: ${data.close.toFixed(2)}</p>
            {data.high > 0 && <p>High: ${data.high.toFixed(2)}</p>}
            {data.low > 0 && <p>Low: ${data.low.toFixed(2)}</p>}
            {data.volume > 0 && <p>Volume: {data.volume.toLocaleString()}</p>}
          </div>
        </div>
      );
    }
    return null;
  };

  const CandlestickChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Historical data */}
        <Line 
          type="monotone" 
          dataKey="close" 
          stroke="#2563eb" 
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
        
        {/* Prediction line */}
        <Line 
          type="monotone" 
          dataKey="close" 
          stroke="#dc2626" 
          strokeWidth={3}
          strokeDasharray="5 5"
          dot={{ fill: '#dc2626', strokeWidth: 2, r: 6 }}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  const VolumeChart = () => (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="volume" 
          stroke="#8884d8" 
          fill="#8884d8" 
          fillOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const PriceRangeChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        
        <Area 
          type="monotone" 
          dataKey="high" 
          stackId="1"
          stroke="#22c55e" 
          fill="#22c55e"
          fillOpacity={0.3}
        />
        <Area 
          type="monotone" 
          dataKey="low" 
          stackId="1"
          stroke="#ef4444" 
          fill="#ef4444"
          fillOpacity={0.3}
        />
        <Line 
          type="monotone" 
          dataKey="close" 
          stroke="#2563eb" 
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  if (!chartData.length) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">No data available for charting</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Stock Price Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="price" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="price" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Price Chart
            </TabsTrigger>
            <TabsTrigger value="volume" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-1" />
              Volume
            </TabsTrigger>
            <TabsTrigger value="range" className="flex items-center">
              <Activity className="h-4 w-4 mr-1" />
              Price Range
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="price" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-0.5 bg-blue-600 mr-2"></div>
                  <span>Historical Price</span>
                </div>
                {predictions && (
                  <div className="flex items-center">
                    <div className="w-3 h-0.5 bg-red-600 border-dashed mr-2" style={{ borderTop: '2px dashed' }}></div>
                    <span>Predicted Price</span>
                  </div>
                )}
              </div>
              <CandlestickChart />
            </div>
          </TabsContent>
          
          <TabsContent value="volume" className="mt-6">
            <VolumeChart />
          </TabsContent>
          
          <TabsContent value="range" className="mt-6">
            <PriceRangeChart />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StockChart;
