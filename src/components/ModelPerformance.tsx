
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Award, TrendingUp, Activity } from 'lucide-react';

interface ModelMetrics {
  model: string;
  accuracy: number;
  mape: number;
  rmse: number;
  sharpeRatio: number;
  winRate: number;
  avgReturn: number;
}

const ModelPerformance: React.FC = () => {
  const modelMetrics: ModelMetrics[] = [
    {
      model: 'LightGBM',
      accuracy: 73.5,
      mape: 2.8,
      rmse: 1.2,
      sharpeRatio: 1.45,
      winRate: 68.2,
      avgReturn: 0.85
    },
    {
      model: 'XGBoost',
      accuracy: 71.2,
      mape: 3.1,
      rmse: 1.4,
      sharpeRatio: 1.32,
      winRate: 65.8,
      avgReturn: 0.79
    },
    {
      model: 'CatBoost',
      accuracy: 69.8,
      mape: 3.4,
      rmse: 1.5,
      sharpeRatio: 1.28,
      winRate: 63.5,
      avgReturn: 0.72
    },
    {
      model: 'Ensemble',
      accuracy: 76.3,
      mape: 2.5,
      rmse: 1.1,
      sharpeRatio: 1.58,
      winRate: 71.4,
      avgReturn: 0.93
    }
  ];

  const backtestData = [
    { month: 'Jan', ensemble: 2.3, lightgbm: 1.8, xgboost: 1.5, catboost: 1.2 },
    { month: 'Feb', ensemble: 1.9, lightgbm: 1.4, xgboost: 1.1, catboost: 0.8 },
    { month: 'Mar', ensemble: 3.2, lightgbm: 2.7, xgboost: 2.3, catboost: 2.1 },
    { month: 'Apr', ensemble: 2.8, lightgbm: 2.2, xgboost: 1.9, catboost: 1.7 },
    { month: 'May', ensemble: 4.1, lightgbm: 3.5, xgboost: 3.1, catboost: 2.8 },
    { month: 'Jun', ensemble: 3.6, lightgbm: 2.9, xgboost: 2.5, catboost: 2.3 }
  ];

  const getPerformanceColor = (value: number, type: 'accuracy' | 'error') => {
    if (type === 'accuracy') {
      return value > 75 ? 'text-green-600' : value > 65 ? 'text-yellow-600' : 'text-red-600';
    } else {
      return value < 2.5 ? 'text-green-600' : value < 3.5 ? 'text-yellow-600' : 'text-red-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Model Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Model Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Model</th>
                  <th className="text-center p-2 font-medium">Accuracy</th>
                  <th className="text-center p-2 font-medium">MAPE</th>
                  <th className="text-center p-2 font-medium">RMSE</th>
                  <th className="text-center p-2 font-medium">Sharpe Ratio</th>
                  <th className="text-center p-2 font-medium">Win Rate</th>
                  <th className="text-center p-2 font-medium">Avg Return</th>
                </tr>
              </thead>
              <tbody>
                {modelMetrics.map((metric, index) => (
                  <tr key={index} className={`border-b ${metric.model === 'Ensemble' ? 'bg-blue-50' : ''}`}>
                    <td className="p-2">
                      <div className="flex items-center">
                        <span className="font-medium">{metric.model}</span>
                        {metric.model === 'Ensemble' && (
                          <Badge className="ml-2 bg-blue-600">Best</Badge>
                        )}
                      </div>
                    </td>
                    <td className={`text-center p-2 font-medium ${getPerformanceColor(metric.accuracy, 'accuracy')}`}>
                      {metric.accuracy.toFixed(1)}%
                    </td>
                    <td className={`text-center p-2 font-medium ${getPerformanceColor(metric.mape, 'error')}`}>
                      {metric.mape.toFixed(1)}%
                    </td>
                    <td className={`text-center p-2 font-medium ${getPerformanceColor(metric.rmse, 'error')}`}>
                      {metric.rmse.toFixed(1)}
                    </td>
                    <td className="text-center p-2 font-medium text-blue-600">
                      {metric.sharpeRatio.toFixed(2)}
                    </td>
                    <td className={`text-center p-2 font-medium ${getPerformanceColor(metric.winRate, 'accuracy')}`}>
                      {metric.winRate.toFixed(1)}%
                    </td>
                    <td className="text-center p-2 font-medium text-green-600">
                      +{metric.avgReturn.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Backtest Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            6-Month Backtest Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={backtestData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" />
              <YAxis label={{ value: 'Return (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line type="monotone" dataKey="ensemble" stroke="#2563eb" strokeWidth={3} name="Ensemble" />
              <Line type="monotone" dataKey="lightgbm" stroke="#10b981" strokeWidth={2} name="LightGBM" />
              <Line type="monotone" dataKey="xgboost" stroke="#f59e0b" strokeWidth={2} name="XGBoost" />
              <Line type="monotone" dataKey="catboost" stroke="#8b5cf6" strokeWidth={2} name="CatBoost" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Model Accuracy Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Accuracy Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={modelMetrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="model" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="accuracy" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelPerformance;
