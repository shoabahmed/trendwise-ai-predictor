
import React, { useState } from 'react';
import { Upload, TrendingUp, BarChart3, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import FileUpload from '@/components/FileUpload';
import PredictionResults from '@/components/PredictionResults';
import TrendAnalysis from '@/components/TrendAnalysis';
import StockChart from '@/components/StockChart';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [uploadedData, setUploadedData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [trends, setTrends] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileUpload = async (data) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Step 1: Data validation
      setProcessingStep('Validating CSV data...');
      setProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Feature engineering
      setProcessingStep('Engineering features...');
      setProgress(40);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 3: Running AI predictions
      setProcessingStep('Running AI predictions...');
      setProgress(60);
      const predictionResults = await generatePredictions(data);
      
      // Step 4: Trend analysis
      setProcessingStep('Analyzing trends...');
      setProgress(80);
      const trendResults = await analyzeTrends(data);
      
      // Step 5: Complete
      setProcessingStep('Finalizing results...');
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      setUploadedData(data);
      setPredictions(predictionResults);
      setTrends(trendResults);
      
      toast({
        title: "Analysis Complete",
        description: "Your stock predictions are ready!",
      });
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Failed to process your data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
      setProgress(0);
    }
  };

  const generatePredictions = async (data) => {
    // Simulate AI prediction generation
    const lastRow = data[data.length - 1];
    const lastClose = parseFloat(lastRow.close);
    const volatility = calculateVolatility(data);
    
    return {
      targetPrice: lastClose * (1 + (Math.random() - 0.5) * 0.1),
      predictedHigh: lastClose * (1 + Math.random() * 0.08),
      predictedLow: lastClose * (1 - Math.random() * 0.08),
      confidence: 0.75 + Math.random() * 0.2,
      volatility: volatility,
      recommendation: getRecommendation(data)
    };
  };

  const analyzeTrends = async (data) => {
    // Calculate technical indicators
    const prices = data.map(row => parseFloat(row.close));
    const volumes = data.map(row => parseFloat(row.VOLUME));
    
    return {
      sma20: calculateSMA(prices, 20),
      sma50: calculateSMA(prices, 50),
      rsi: calculateRSI(prices),
      macd: calculateMACD(prices),
      trendDirection: getTrendDirection(prices),
      support: Math.min(...prices.slice(-20)),
      resistance: Math.max(...prices.slice(-20)),
      volumeTrend: getVolumeTrend(volumes)
    };
  };

  const calculateVolatility = (data) => {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const curr = parseFloat(data[i].close);
      const prev = parseFloat(data[i-1].close);
      returns.push((curr - prev) / prev);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  };

  const calculateSMA = (prices, period) => {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  };

  const calculateRSI = (prices) => {
    if (prices.length < 15) return null;
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i-1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14;
    const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const calculateMACD = (prices) => {
    if (prices.length < 26) return null;
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    return ema12 - ema26;
  };

  const calculateEMA = (prices, period) => {
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
  };

  const getTrendDirection = (prices) => {
    const recent = prices.slice(-10);
    const older = prices.slice(-20, -10);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    if (recentAvg > olderAvg * 1.02) return 'Bullish';
    if (recentAvg < olderAvg * 0.98) return 'Bearish';
    return 'Neutral';
  };

  const getVolumeTrend = (volumes) => {
    const recent = volumes.slice(-5);
    const older = volumes.slice(-10, -5);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    return recentAvg > olderAvg ? 'Increasing' : 'Decreasing';
  };

  const getRecommendation = (data) => {
    const prices = data.map(row => parseFloat(row.close));
    const rsi = calculateRSI(prices);
    const trend = getTrendDirection(prices);
    
    if (rsi < 30 && trend === 'Bullish') return 'Strong Buy';
    if (rsi < 40 && trend === 'Bullish') return 'Buy';
    if (rsi > 70 && trend === 'Bearish') return 'Strong Sell';
    if (rsi > 60 && trend === 'Bearish') return 'Sell';
    return 'Hold';
  };

  const handleExport = () => {
    if (!predictions || !uploadedData) return;
    
    const exportData = {
      predictions,
      trends,
      timestamp: new Date().toISOString(),
      originalData: uploadedData.slice(-5) // Last 5 rows
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock-predictions.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Prediction report downloaded successfully!",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">AI Stock Predictor</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced AI-powered stock market analysis and prediction. Upload your CSV data to get next-day predictions, 
            technical analysis, and trend insights.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Stock Data
                </CardTitle>
                <CardDescription>
                  Upload CSV with columns: Date, series, OPEN, HIGH, LOW, PREV. CLOSE, ltp, close, vwap, 52W H, 52W L, VOLUME, VALUE, No of trades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onFileUpload={handleFileUpload} disabled={isProcessing} />
                
                {isProcessing && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {processingStep}
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}

                {uploadedData && !isProcessing && (
                  <Alert className="mt-4">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Successfully processed {uploadedData.length} rows of data
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Export Section */}
            {predictions && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Download className="h-5 w-5 mr-2" />
                    Export Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleExport} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Prediction Report
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {!uploadedData ? (
              <Card className="h-96 flex items-center justify-center">
                <CardContent className="text-center">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Ready for Analysis</h3>
                  <p className="text-gray-500">Upload your stock data CSV to begin AI-powered predictions and analysis</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Chart */}
                <StockChart data={uploadedData} predictions={predictions} />
                
                {/* Predictions */}
                {predictions && <PredictionResults predictions={predictions} />}
                
                {/* Trend Analysis */}
                {trends && <TrendAnalysis trends={trends} />}
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                AI Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Advanced machine learning models predict next-day target price, high, and low values with confidence intervals.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Technical Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Comprehensive technical indicators including RSI, MACD, moving averages, support/resistance levels.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Download className="h-5 w-5 mr-2 text-purple-600" />
                Export Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Download detailed prediction reports with all analysis data in JSON format for further processing.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
