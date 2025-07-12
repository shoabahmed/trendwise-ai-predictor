
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Activity, BarChart3, Target, Volume2 } from 'lucide-react';

const TrendAnalysis = ({ trends }) => {
  if (!trends) return null;

  const {
    sma20,
    sma50,
    rsi,
    macd,
    trendDirection,
    support,
    resistance,
    volumeTrend
  } = trends;

  const getRSIStatus = (rsi) => {
    if (rsi < 30) return { status: 'Oversold', color: 'text-red-600 bg-red-100', icon: TrendingDown };
    if (rsi > 70) return { status: 'Overbought', color: 'text-red-600 bg-red-100', icon: TrendingUp };
    return { status: 'Neutral', color: 'text-green-600 bg-green-100', icon: Activity };
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'Bullish':
        return 'text-green-600 bg-green-100';
      case 'Bearish':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getMACDSignal = (macd) => {
    if (macd > 0) return { signal: 'Bullish', color: 'text-green-600' };
    if (macd < 0) return { signal: 'Bearish', color: 'text-red-600' };
    return { signal: 'Neutral', color: 'text-gray-600' };
  };

  const rsiStatus = getRSIStatus(rsi);
  const macdSignal = getMACDSignal(macd);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Technical Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Moving Averages */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Moving Averages
            </h4>
            <div className="space-y-2">
              {sma20 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">SMA 20:</span>
                  <span className="font-medium">${sma20.toFixed(2)}</span>
                </div>
              )}
              {sma50 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">SMA 50:</span>
                  <span className="font-medium">${sma50.toFixed(2)}</span>
                </div>
              )}
              {sma20 && sma50 && (
                <div className="pt-2 border-t">
                  <Badge className={sma20 > sma50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {sma20 > sma50 ? 'Golden Cross' : 'Death Cross'}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* RSI */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              RSI Analysis
            </h4>
            <div className="space-y-2">
              {rsi && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">RSI:</span>
                      <span className="font-medium">{rsi.toFixed(1)}</span>
                    </div>
                    <Progress value={rsi} className="h-2" />
                    <Badge className={rsiStatus.color}>
                      {rsiStatus.status}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Trend & MACD */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trend Signals
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600 block">Overall Trend:</span>
                <Badge className={getTrendColor(trendDirection)}>
                  {trendDirection}
                </Badge>
              </div>
              {macd !== null && (
                <div>
                  <span className="text-sm text-gray-600 block">MACD Signal:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${macdSignal.color}`}>
                      {macdSignal.signal}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({macd.toFixed(3)})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Support & Resistance */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Key Levels
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Support:</span>
                <span className="font-medium text-green-600">${support.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Resistance:</span>
                <span className="font-medium text-red-600">${resistance.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Volume Trend:</span>
                  <div className="flex items-center">
                    <Volume2 className="h-3 w-3 mr-1" />
                    <span className={`text-sm font-medium ${
                      volumeTrend === 'Increasing' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {volumeTrend}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Technical Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-700">
                <strong>Momentum:</strong> The stock is showing {trendDirection.toLowerCase()} momentum based on price action and moving averages.
              </p>
            </div>
            <div>
              <p className="text-gray-700">
                <strong>Key Levels:</strong> Watch for support at ${support.toFixed(2)} and resistance at ${resistance.toFixed(2)}.
              </p>
            </div>
            {rsi && (
              <div>
                <p className="text-gray-700">
                  <strong>RSI Signal:</strong> At {rsi.toFixed(1)}, the stock appears {rsiStatus.status.toLowerCase()}.
                </p>
              </div>
            )}
            <div>
              <p className="text-gray-700">
                <strong>Volume:</strong> Trading volume is {volumeTrend.toLowerCase()}, which {volumeTrend === 'Increasing' ? 'supports' : 'questions'} the current trend.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendAnalysis;
