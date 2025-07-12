
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, DollarSign, Activity, AlertCircle } from 'lucide-react';

const PredictionResults = ({ predictions }) => {
  if (!predictions) return null;

  const {
    targetPrice,
    predictedHigh,
    predictedLow,
    confidence,
    volatility,
    recommendation
  } = predictions;

  const getRecommendationColor = (rec) => {
    switch (rec) {
      case 'Strong Buy':
        return 'bg-green-600 hover:bg-green-700';
      case 'Buy':
        return 'bg-green-500 hover:bg-green-600';
      case 'Hold':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Sell':
        return 'bg-red-500 hover:bg-red-600';
      case 'Strong Sell':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getVolatilityLevel = (vol) => {
    if (vol < 0.2) return { level: 'Low', color: 'text-green-600' };
    if (vol < 0.4) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'High', color: 'text-red-600' };
  };

  const volatilityInfo = getVolatilityLevel(volatility);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Target Price */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Target className="h-4 w-4 mr-2 text-blue-600" />
            Target Price
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-blue-600">
              ${targetPrice.toFixed(2)}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Confidence:</span>
              <Progress value={confidence * 100} className="flex-1 h-2" />
              <span className="text-xs font-medium">{(confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predicted High */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
            Predicted High
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-green-600">
              ${predictedHigh.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              Intraday maximum expected
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Predicted Low */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
            Predicted Low
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-red-600">
              ${predictedLow.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              Intraday minimum expected
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recommendation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-purple-600" />
            Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Badge className={`${getRecommendationColor(recommendation)} text-white px-3 py-1`}>
              {recommendation}
            </Badge>
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">Volatility:</span>
              <span className={`text-xs font-medium ${volatilityInfo.color}`}>
                {volatilityInfo.level}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Card */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Prediction Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Price Range</h4>
              <div className="space-y-1 text-sm">
                <p>Target: <span className="font-medium">${targetPrice.toFixed(2)}</span></p>
                <p>Range: <span className="font-medium">${predictedLow.toFixed(2)} - ${predictedHigh.toFixed(2)}</span></p>
                <p>Spread: <span className="font-medium">${(predictedHigh - predictedLow).toFixed(2)}</span></p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
              <div className="space-y-1 text-sm">
                <p>Volatility: <span className={`font-medium ${volatilityInfo.color}`}>{(volatility * 100).toFixed(1)}%</span></p>
                <p>Confidence: <span className="font-medium">{(confidence * 100).toFixed(0)}%</span></p>
                <p>Risk Level: <span className={`font-medium ${volatilityInfo.color}`}>{volatilityInfo.level}</span></p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Trading Signal</h4>
              <div className="space-y-1 text-sm">
                <p>Action: <span className="font-medium">{recommendation}</span></p>
                <p>Timeframe: <span className="font-medium">Next Trading Day</span></p>
                <p>Model: <span className="font-medium">AI Ensemble</span></p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Disclaimer:</strong> These predictions are generated by AI models and should not be considered as financial advice. 
              Always conduct your own research and consult with financial professionals before making investment decisions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictionResults;
