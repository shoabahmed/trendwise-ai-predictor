
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Brain, Zap, Target } from 'lucide-react';

interface ModelPrediction {
  model: string;
  prediction: number;
  confidence: number;
  weight: number;
}

interface EnsembleResult {
  finalPrediction: number;
  modelPredictions: ModelPrediction[];
  ensembleConfidence: number;
  consensusScore: number;
}

interface EnsemblePredictorProps {
  data: any[];
  targetDate: string;
}

const EnsemblePredictor: React.FC<EnsemblePredictorProps> = ({ data, targetDate }) => {
  const ensembleResult = useMemo(() => {
    if (!data || data.length === 0) return null;

    const lastPrice = parseFloat(data[data.length - 1].close);
    
    // Simulate individual model predictions
    const lightgbmPred = lastPrice * (1 + (Math.random() - 0.5) * 0.08);
    const xgboostPred = lastPrice * (1 + (Math.random() - 0.5) * 0.07);
    const catboostPred = lastPrice * (1 + (Math.random() - 0.5) * 0.09);
    
    const modelPredictions: ModelPrediction[] = [
      {
        model: 'LightGBM',
        prediction: lightgbmPred,
        confidence: 0.82 + Math.random() * 0.15,
        weight: 0.35
      },
      {
        model: 'XGBoost',
        prediction: xgboostPred,
        confidence: 0.78 + Math.random() * 0.15,
        weight: 0.35
      },
      {
        model: 'CatBoost',
        prediction: catboostPred,
        confidence: 0.75 + Math.random() * 0.15,
        weight: 0.30
      }
    ];

    // Calculate weighted ensemble prediction
    const finalPrediction = modelPredictions.reduce((sum, model) => 
      sum + (model.prediction * model.weight), 0
    );

    // Calculate consensus score (how similar the predictions are)
    const predictions = modelPredictions.map(m => m.prediction);
    const mean = predictions.reduce((a, b) => a + b) / predictions.length;
    const variance = predictions.reduce((sum, pred) => sum + Math.pow(pred - mean, 2), 0) / predictions.length;
    const consensusScore = Math.max(0, 100 - (Math.sqrt(variance) / mean * 100));

    // Calculate ensemble confidence
    const avgConfidence = modelPredictions.reduce((sum, model) => 
      sum + (model.confidence * model.weight), 0
    );

    return {
      finalPrediction,
      modelPredictions,
      ensembleConfidence: avgConfidence * (consensusScore / 100),
      consensusScore
    };
  }, [data, targetDate]);

  if (!ensembleResult) return null;

  const getModelColor = (model: string) => {
    switch (model) {
      case 'LightGBM': return 'bg-blue-500';
      case 'XGBoost': return 'bg-green-500';
      case 'CatBoost': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          Ensemble ML Prediction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Final Ensemble Result */}
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              <span className="font-medium text-gray-700">Ensemble Prediction</span>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              ${ensembleResult.finalPrediction.toFixed(2)}
            </div>
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center">
                <span className="text-gray-500 mr-1">Confidence:</span>
                <span className="font-medium">{(ensembleResult.ensembleConfidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 mr-1">Consensus:</span>
                <span className="font-medium">{ensembleResult.consensusScore.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Individual Model Results */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Individual Model Predictions
            </h4>
            {ensembleResult.modelPredictions.map((model, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getModelColor(model.model)}`}></div>
                  <span className="font-medium text-gray-900">{model.model}</span>
                  <Badge variant="outline" className="text-xs">
                    Weight: {(model.weight * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ${model.prediction.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(model.confidence * 100).toFixed(1)}% confidence
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Consensus Visualization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Model Consensus</span>
              <span className="font-medium">{ensembleResult.consensusScore.toFixed(1)}%</span>
            </div>
            <Progress value={ensembleResult.consensusScore} className="h-2" />
            <p className="text-xs text-gray-500">
              {ensembleResult.consensusScore > 80 ? 'High agreement between models' :
               ensembleResult.consensusScore > 60 ? 'Moderate agreement between models' :
               'Low agreement - increased uncertainty'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnsemblePredictor;
