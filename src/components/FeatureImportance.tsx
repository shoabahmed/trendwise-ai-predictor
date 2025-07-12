
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from 'recharts';
import { Sparkles, TrendingUp, Activity } from 'lucide-react';

interface FeatureData {
  feature: string;
  importance: number;
  category: 'technical' | 'price' | 'volume' | 'sentiment' | 'macro';
  description: string;
}

const FeatureImportance: React.FC = () => {
  const featureData: FeatureData[] = [
    { feature: 'RSI_14', importance: 0.18, category: 'technical', description: 'Relative Strength Index (14-day)' },
    { feature: 'MACD_Signal', importance: 0.15, category: 'technical', description: 'MACD Signal Line' },
    { feature: 'Volume_MA_Ratio', importance: 0.13, category: 'volume', description: 'Volume to Moving Average Ratio' },
    { feature: 'Price_MA_20', importance: 0.12, category: 'price', description: '20-day Moving Average' },
    { feature: 'Bollinger_Position', importance: 0.10, category: 'technical', description: 'Position within Bollinger Bands' },
    { feature: 'NIFTY_Correlation', importance: 0.09, category: 'macro', description: 'Correlation with NIFTY Index' },
    { feature: 'Volume_Spike', importance: 0.08, category: 'volume', description: 'Volume Spike Indicator' },
    { feature: 'Price_Volatility', importance: 0.07, category: 'price', description: '30-day Price Volatility' },
    { feature: 'News_Sentiment', importance: 0.05, category: 'sentiment', description: 'News Sentiment Score' },
    { feature: 'Sector_Performance', importance: 0.03, category: 'macro', description: 'Sector Relative Performance' }
  ];

  const categoryColors = {
    technical: '#3b82f6',
    price: '#10b981',
    volume: '#f59e0b',
    sentiment: '#8b5cf6',
    macro: '#ef4444'
  };

  const radarData = [
    { subject: 'Technical', A: 0.43, fullMark: 1 },
    { subject: 'Price', A: 0.19, fullMark: 1 },
    { subject: 'Volume', A: 0.21, fullMark: 1 },
    { subject: 'Sentiment', A: 0.05, fullMark: 1 },
    { subject: 'Macro', A: 0.12, fullMark: 1 }
  ];

  const getTopFeatures = (count: number) => {
    return featureData
      .sort((a, b) => b.importance - a.importance)
      .slice(0, count);
  };

  const getCategoryTotal = (category: string) => {
    return featureData
      .filter(f => f.category === category)
      .reduce((sum, f) => sum + f.importance, 0);
  };

  return (
    <div className="space-y-6">
      {/* Feature Importance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Feature Importance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Features Bar Chart */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Top 10 Most Important Features</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={featureData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" />
                  <YAxis dataKey="feature" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="importance">
                    {featureData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[entry.category]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown Radar */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Feature Category Breakdown</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 1]} tick={false} />
                  <Radar
                    name="Importance"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Feature List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Detailed Feature Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getTopFeatures(10).map((feature, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="text-center min-w-[2rem]">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">{feature.feature}</span>
                      <Badge 
                        style={{ backgroundColor: categoryColors[feature.category] }}
                        className="text-white text-xs"
                      >
                        {feature.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                    <div className="mt-2">
                      <Progress value={feature.importance * 100} className="h-2" />
                    </div>
                  </div>
                  <div className="text-right min-w-[4rem]">
                    <div className="text-lg font-semibold text-blue-600">
                      {(feature.importance * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Feature Category Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(categoryColors).map(([category, color]) => (
              <div key={category} className="text-center p-4 border rounded-lg">
                <div 
                  className="w-4 h-4 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: color }}
                ></div>
                <div className="font-medium capitalize text-gray-900">{category}</div>
                <div className="text-2xl font-bold mt-1" style={{ color }}>
                  {(getCategoryTotal(category) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {featureData.filter(f => f.category === category).length} features
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureImportance;
