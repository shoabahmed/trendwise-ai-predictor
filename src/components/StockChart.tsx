import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, AreaChart, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, BarChart3, Activity, DollarSign, TrendingDown } from 'lucide-react';

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
  dateSort: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
  value: number;
  trades: number;
  dailyReturn: number;
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
    
    // Parse and sort data chronologically (earliest first)
    const processedData = data.map((row, index) => {
      const parseNumber = (value: string | number): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const cleaned = value.replace(/,/g, '');
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      // Enhanced date parsing for DD-MMM-YY format
      const dateStr = row.Date;
      let parsedDate = new Date();
      
      try {
        if (dateStr.includes('-')) {
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const monthStr = parts[1];
            let year = parseInt(parts[2]);
            
            // Convert 2-digit year to 4-digit (assuming 20xx for years 00-99)
            if (year >= 0 && year <= 99) {
              year += 2000;
            }
            
            const monthMap: { [key: string]: number } = {
              'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
              'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            
            const month = monthMap[monthStr] ?? 0;
            parsedDate = new Date(year, month, day);
          }
        } else {
          parsedDate = new Date(dateStr);
        }
      } catch (e) {
        console.warn('Date parsing failed for:', dateStr);
        parsedDate = new Date();
      }

      const open = parseNumber(row.OPEN);
      const high = parseNumber(row.HIGH);
      const low = parseNumber(row.LOW);
      const close = parseNumber(row.close);
      const prevClose = parseNumber(row['PREV. CLOSE']);
      
      // Calculate daily return
      const dailyReturn = prevClose > 0 ? ((close - prevClose) / prevClose) * 100 : 0;

      return {
        date: parsedDate.toLocaleDateString('en-US', { 
          day: '2-digit',
          month: 'short', 
          year: '2-digit'
        }),
        dateSort: parsedDate,
        open,
        high,
        low,
        close,
        volume: parseNumber(row.VOLUME),
        vwap: parseNumber(row.vwap),
        value: parseNumber(row.VALUE),
        trades: parseNumber(row['No of trades']),
        dailyReturn,
        index: index,
        originalDate: dateStr
      };
    });
    
    // Sort by date in ASCENDING order (earliest first, latest last)
    const sortedData = processedData.sort((a, b) => a.dateSort.getTime() - b.dateSort.getTime());
    
    console.log('✅ Sorted data - First date:', sortedData[0]?.originalDate, sortedData[0]?.dateSort);
    console.log('✅ Sorted data - Last date:', sortedData[sortedData.length - 1]?.originalDate, sortedData[sortedData.length - 1]?.dateSort);
    
    return sortedData;
  }, [data]);

  const predictionData = useMemo(() => {
    if (!predictions || !chartData.length) return [];
    
    const lastDataPoint = chartData[chartData.length - 1];
    const nextDate = new Date(lastDataPoint.dateSort);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const predictionPoint = {
      date: nextDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: '2-digit',
        year: '2-digit'
      }),
      dateSort: nextDate,
      close: predictions.targetPrice,
      high: predictions.predictedHigh,
      low: predictions.predictedLow,
      predicted: true,
      index: chartData.length,
      open: lastDataPoint.close,
      volume: 0,
      vwap: predictions.targetPrice,
      value: 0,
      trades: 0,
      dailyReturn: 0
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
        <div className="bg-white/95 backdrop-blur-sm p-4 border rounded-lg shadow-xl border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {isPredicted && <p className="text-xs text-blue-600 font-medium mb-2">🔮 PREDICTED</p>}
          <div className="space-y-2 text-sm">
            {data.open > 0 && <div className="flex justify-between gap-4"><span className="text-gray-600">Open:</span><span className="font-medium">₹{data.open.toFixed(2)}</span></div>}
            <div className="flex justify-between gap-4"><span className="text-gray-600">Close:</span><span className="font-medium">₹{data.close.toFixed(2)}</span></div>
            {data.high > 0 && <div className="flex justify-between gap-4"><span className="text-gray-600">High:</span><span className="font-medium text-green-600">₹{data.high.toFixed(2)}</span></div>}
            {data.low > 0 && <div className="flex justify-between gap-4"><span className="text-gray-600">Low:</span><span className="font-medium text-red-600">₹{data.low.toFixed(2)}</span></div>}
            {data.volume > 0 && <div className="flex justify-between gap-4"><span className="text-gray-600">Volume:</span><span className="font-medium">{data.volume.toLocaleString()}</span></div>}
            {data.vwap > 0 && <div className="flex justify-between gap-4"><span className="text-gray-600">VWAP:</span><span className="font-medium">₹{data.vwap.toFixed(2)}</span></div>}
            {data.dailyReturn !== 0 && <div className="flex justify-between gap-4"><span className="text-gray-600">Daily Return:</span><span className={`font-medium ${data.dailyReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>{data.dailyReturn.toFixed(2)}%</span></div>}
          </div>
        </div>
      );
    }
    return null;
  };

  const PriceChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 12 }} domain={['dataMin - 5', 'dataMax + 5']} />
        <Tooltip content={<CustomTooltip />} />
        
        <Line 
          type="monotone" 
          dataKey="close" 
          stroke="#2563eb" 
          strokeWidth={2}
          dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
          connectNulls={false}
          name="Close Price"
        />
        
        <Line 
          type="monotone" 
          dataKey="vwap" 
          stroke="#10b981" 
          strokeWidth={1}
          strokeDasharray="5 5"
          dot={false}
          connectNulls={false}
          name="VWAP"
        />
        
        {predictionData.length > 1 && (
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke="#dc2626" 
            strokeWidth={3}
            strokeDasharray="8 4"
            dot={{ fill: '#dc2626', strokeWidth: 2, r: 5 }}
            connectNulls={false}
            name="Prediction"
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );

  const VolumeChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 10 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="volume" 
          stroke="#8b5cf6" 
          fill="#8b5cf6" 
          fillOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const ReturnsChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 10 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="dailyReturn">
          {chartData.map((entry, index) => (
            <Bar 
              key={`cell-${index}`}
              dataKey="dailyReturn"
              fill={entry.dailyReturn >= 0 ? '#10b981' : '#ef4444'} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const CandlestickChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
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
          fillOpacity={0.2}
        />
        <Area 
          type="monotone" 
          dataKey="low" 
          stackId="1"
          stroke="#ef4444" 
          fill="#ef4444"
          fillOpacity={0.2}
        />
        <Line 
          type="monotone" 
          dataKey="close" 
          stroke="#2563eb" 
          strokeWidth={2}
          dot={{ fill: '#2563eb', r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="open" 
          stroke="#f59e0b" 
          strokeWidth={1}
          strokeDasharray="3 3"
          dot={false}
        />
      </ComposedChart>
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

  const latestData = chartData[chartData.length - 1];
  const previousData = chartData[chartData.length - 2];
  const priceChange = previousData ? latestData.close - previousData.close : 0;
  const priceChangePercent = previousData ? (priceChange / previousData.close) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Price</p>
                <p className="text-2xl font-bold">₹{latestData.close.toFixed(2)}</p>
                <p className={`text-sm flex items-center ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {priceChange >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Volume</p>
                <p className="text-2xl font-bold">{(latestData.volume / 1000000).toFixed(2)}M</p>
                <p className="text-sm text-gray-500">shares traded</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Day's Range</p>
                <p className="text-lg font-bold">₹{latestData.low.toFixed(2)} - ₹{latestData.high.toFixed(2)}</p>
                <p className="text-sm text-gray-500">L - H</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">VWAP</p>
                <p className="text-2xl font-bold">₹{latestData.vwap.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Volume weighted</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Chart Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Advanced Stock Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="price" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="price" className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                Price & Prediction
              </TabsTrigger>
              <TabsTrigger value="candlestick" className="flex items-center">
                <Activity className="h-4 w-4 mr-1" />
                OHLC Analysis
              </TabsTrigger>
              <TabsTrigger value="volume" className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-1" />
                Volume Analysis
              </TabsTrigger>
              <TabsTrigger value="returns" className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Daily Returns
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="price" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-0.5 bg-blue-600 mr-2"></div>
                    <span>Close Price</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-0.5 bg-green-500 border-dashed mr-2" style={{ borderTop: '2px dashed' }}></div>
                    <span>VWAP</span>
                  </div>
                  {predictions && (
                    <div className="flex items-center">
                      <div className="w-3 h-0.5 bg-red-600 mr-2" style={{ borderTop: '3px dashed' }}></div>
                      <span>AI Prediction</span>
                    </div>
                  )}
                </div>
                <PriceChart />
              </div>
            </TabsContent>
            
            <TabsContent value="candlestick" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 opacity-20 mr-2"></div>
                    <span>High Range</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 opacity-20 mr-2"></div>
                    <span>Low Range</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-0.5 bg-blue-600 mr-2"></div>
                    <span>Close</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-0.5 bg-yellow-600 border-dashed mr-2"></div>
                    <span>Open</span>
                  </div>
                </div>
                <CandlestickChart />
              </div>
            </TabsContent>
            
            <TabsContent value="volume" className="mt-6">
              <VolumeChart />
            </TabsContent>

            <TabsContent value="returns" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 mr-2"></div>
                    <span>Positive Returns</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 mr-2"></div>
                    <span>Negative Returns</span>
                  </div>
                </div>
                <ReturnsChart />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockChart;
