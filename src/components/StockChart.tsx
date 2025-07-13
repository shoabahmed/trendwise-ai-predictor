import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, AreaChart } from 'recharts';
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
    if (!data || data.length === 0) return [];
    
    console.log('📊 Processing stock data for chart:', data.length, 'rows');
    console.log('📋 Sample data row:', data[0]);
    
    // Take last 30 rows and process them properly
    const recentData = data.slice(-30);
    
    const processedData = recentData.map((row, index) => {
      // Parse date properly
      const dateStr = row.Date;
      let formattedDate = dateStr;
      
      // Handle different date formats
      try {
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          formattedDate = parsedDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: '2-digit',
            year: '2-digit'
          });
        }
      } catch (e) {
        console.warn('Date parsing failed for:', dateStr);
        formattedDate = dateStr;
      }
      
      // Parse numeric values safely
      const parseNumber = (value: string | number): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const cleaned = value.replace(/,/g, '');
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };
      
      const processedRow = {
        date: formattedDate,
        open: parseNumber(row.OPEN),
        high: parseNumber(row.HIGH),
        low: parseNumber(row.LOW),
        close: parseNumber(row.close),
        volume: parseNumber(row.VOLUME),
        index: index
      };
      
      console.log(`📈 Processed row ${index}:`, processedRow);
      return processedRow;
    });
    
    console.log('✅ Final chart data:', processedData);
    return processedData;
  }, [data]);

  const predictionData = useMemo(() => {
    if (!predictions || !chartData.length) return [];
    
    const lastDataPoint = chartData[chartData.length - 1];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    
    const predictionPoint = {
      date: nextDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: '2-digit',
        year: '2-digit'
      }),
      close: predictions.targetPrice,
      high: predictions.predictedHigh,
      low: predictions.predictedLow,
      predicted: true,
      index: chartData.length,
      open: lastDataPoint.close,
      volume: 0
    };
    
    return [lastDataPoint, predictionPoint];
  }, [predictions, chartData]);

  const combinedData = useMemo(() => {
    const combined = [...chartData];
    if (predictionData.length > 1) {
      combined.push(predictionData[1]);
    }
    return combined;
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
            {data.open > 0 && <p>Open: ₹{data.open.toFixed(2)}</p>}
            <p>Close: ₹{data.close.toFixed(2)}</p>
            {data.high > 0 && <p>High: ₹{data.high.toFixed(2)}</p>}
            {data.low > 0 && <p>Low: ₹{data.low.toFixed(2)}</p>}
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
        
        <Line 
          type="monotone" 
          dataKey="close" 
          stroke="#2563eb" 
          strokeWidth={2}
          dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
          connectNulls={false}
        />
        
        {predictionData.length > 1 && (
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke="#dc2626" 
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ fill: '#dc2626', strokeWidth: 2, r: 6 }}
            connectNulls={false}
          />
        )}
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
