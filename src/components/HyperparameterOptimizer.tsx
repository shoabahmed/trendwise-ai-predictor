
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Play, Pause, RotateCcw, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

interface OptimizationTrial {
  trial: number;
  accuracy: number;
  params: {
    learning_rate: number;
    max_depth: number;
    n_estimators: number;
    reg_alpha: number;
    reg_lambda: number;
  };
  model: string;
}

const HyperparameterOptimizer: React.FC = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTrial, setCurrentTrial] = useState(0);

  // Simulated optimization trials
  const optimizationTrials: OptimizationTrial[] = [
    {
      trial: 1,
      accuracy: 68.5,
      params: { learning_rate: 0.1, max_depth: 6, n_estimators: 100, reg_alpha: 0.1, reg_lambda: 0.1 },
      model: 'LightGBM'
    },
    {
      trial: 2,
      accuracy: 71.2,
      params: { learning_rate: 0.05, max_depth: 8, n_estimators: 150, reg_alpha: 0.05, reg_lambda: 0.2 },
      model: 'LightGBM'
    },
    {
      trial: 3,
      accuracy: 73.8,
      params: { learning_rate: 0.03, max_depth: 10, n_estimators: 200, reg_alpha: 0.01, reg_lambda: 0.15 },
      model: 'LightGBM'
    },
    {
      trial: 4,
      accuracy: 75.1,
      params: { learning_rate: 0.02, max_depth: 12, n_estimators: 250, reg_alpha: 0.005, reg_lambda: 0.1 },
      model: 'LightGBM'
    },
    {
      trial: 5,
      accuracy: 74.6,
      params: { learning_rate: 0.01, max_depth: 15, n_estimators: 300, reg_alpha: 0.001, reg_lambda: 0.05 },
      model: 'LightGBM'
    }
  ];

  const bestTrial = optimizationTrials.reduce((best, current) => 
    current.accuracy > best.accuracy ? current : best
  );

  const parameterImportance = [
    { param: 'learning_rate', importance: 0.35, description: 'Learning rate controls training speed' },
    { param: 'max_depth', importance: 0.28, description: 'Maximum tree depth prevents overfitting' },
    { param: 'n_estimators', importance: 0.22, description: 'Number of trees in the ensemble' },
    { param: 'reg_lambda', importance: 0.10, description: 'L2 regularization strength' },
    { param: 'reg_alpha', importance: 0.05, description: 'L1 regularization strength' }
  ];

  const scatterData = optimizationTrials.map(trial => ({
    learning_rate: trial.params.learning_rate,
    accuracy: trial.accuracy,
    trial: trial.trial
  }));

  const handleStartOptimization = () => {
    setIsOptimizing(true);
    setProgress(0);
    setCurrentTrial(0);

    // Simulate optimization progress
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        setCurrentTrial(Math.floor(newProgress / 20));
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsOptimizing(false);
          return 100;
        }
        return newProgress;
      });
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Optimization Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Hyperparameter Optimization (Optuna)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{optimizationTrials.length}</div>
              <div className="text-sm text-gray-600">Completed Trials</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{bestTrial.accuracy.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Best Accuracy</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {isOptimizing ? currentTrial : optimizationTrials.length}
              </div>
              <div className="text-sm text-gray-600">Current Trial</div>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <Button 
              onClick={handleStartOptimization}
              disabled={isOptimizing}
              className="flex items-center"
            >
              {isOptimizing ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isOptimizing ? 'Optimizing...' : 'Start Optimization'}
            </Button>
            <Button variant="outline" className="flex items-center">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Trials
            </Button>
          </div>

          {isOptimizing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Optimization Progress</span>
                <span className="font-medium">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-500">
                Trial {currentTrial} of 50 - Testing parameter combinations...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="results">Optimization Results</TabsTrigger>
          <TabsTrigger value="parameters">Parameter Importance</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Best Parameters Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Optimal Configuration</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Learning Rate:</span>
                        <span className="font-medium">{bestTrial.params.learning_rate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Depth:</span>
                        <span className="font-medium">{bestTrial.params.max_depth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">N Estimators:</span>
                        <span className="font-medium">{bestTrial.params.n_estimators}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reg Alpha:</span>
                        <span className="font-medium">{bestTrial.params.reg_alpha}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reg Lambda:</span>
                        <span className="font-medium">{bestTrial.params.reg_lambda}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <Badge className="bg-green-600 text-white px-4 py-2">
                      Best Accuracy: {bestTrial.accuracy.toFixed(1)}%
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Trial History</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={optimizationTrials}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="trial" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="accuracy" stroke="#2563eb" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parameters">
          <Card>
            <CardHeader>
              <CardTitle>Parameter Importance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {parameterImportance.map((param, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{param.param}</span>
                      <span className="text-sm font-medium">{(param.importance * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={param.importance * 100} className="h-2" />
                    <p className="text-xs text-gray-500">{param.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visualization">
          <Card>
            <CardHeader>
              <CardTitle>Parameter vs Accuracy Scatter Plot</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={scatterData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="learning_rate" 
                    name="Learning Rate"
                    label={{ value: 'Learning Rate', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    dataKey="accuracy" 
                    name="Accuracy"
                    label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter dataKey="accuracy" fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HyperparameterOptimizer;
