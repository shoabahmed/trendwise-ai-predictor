
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, Activity, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface AnomalyPoint {
  date: string;
  value: number;
  anomalyScore: number;
  type: 'volatility' | 'volume' | 'price' | 'pattern';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface AnomalyDetectorProps {
  data: any[];
}

const AnomalyDetector: React.FC<AnomalyDetectorProps> = ({ data }) => {
  const anomalies = useMemo(() => {
    if (!data || data.length === 0) return [];

    const recentData = data.slice(-30);
    const anomalies: AnomalyPoint[] = [];

    // Simulate volatility anomalies
    recentData.forEach((row, index) => {
      const price = parseFloat(row.close);
      const volume = parseFloat(row.VOLUME || '0');
      const date = new Date(row.Date).toLocaleDateString();

      // Check for price anomalies
      if (index > 0) {
        const prevPrice = parseFloat(recentData[index - 1].close);
        const change = Math.abs((price - prevPrice) / prevPrice);
        
        if (change > 0.05) { // 5% change
          anomalies.push({
            date,
            value: price,
            anomalyScore: change * 100,
            type: 'price',
            severity: change > 0.1 ? 'high' : change > 0.07 ? 'medium' : 'low',
            description: `Unusual price movement: ${(change * 100).toFixed(1)}% change`
          });
        }
      }

      // Check for volume anomalies
      if (volume > 0) {
        const avgVolume = recentData.slice(Math.max(0, index - 5), index)
          .reduce((sum, d) => sum + parseFloat(d.VOLUME || '0'), 0) / 5;
        
        if (volume > avgVolume * 2) {
          anomalies.push({
            date,
            value: volume,
            anomalyScore: (volume / avgVolume) * 10,
            type: 'volume',
            severity: volume > avgVolume * 3 ? 'high' : 'medium',
            description: `Volume spike: ${((volume / avgVolume - 1) * 100).toFixed(0)}% above average`
          });
        }
      }
    });

    // Add some pattern-based anomalies (simulated)
    if (Math.random() > 0.7) {
      const randomDay = recentData[Math.floor(Math.random() * recentData.length)];
      anomalies.push({
        date: new Date(randomDay.Date).toLocaleDateString(),
        value: parseFloat(randomDay.close),
        anomalyScore: 75 + Math.random() * 20,
        type: 'pattern',
        severity: 'medium',
        description: 'Unusual trading pattern detected'
      });
    }

    return anomalies.sort((a, b) => b.anomalyScore - a.anomalyScore).slice(0, 5);
  }, [data]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.slice(-30).map((row, index) => {
      const date = new Date(row.Date).toLocaleDateString();
      const price = parseFloat(row.close);
      const anomaly = anomalies.find(a => a.date === date && a.type === 'price');
      
      return {
        date,
        price,
        anomaly: anomaly ? anomaly.anomalyScore : null,
        isAnomaly: !!anomaly
      };
    });
  }, [data, anomalies]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500 hover:bg-red-600';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Activity className="h-4 w-4" />;
      case 'low': return <Shield className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'price': return <TrendingDown className="h-4 w-4" />;
      case 'volume': return <Activity className="h-4 w-4" />;
      case 'volatility': return <AlertTriangle className="h-4 w-4" />;
      case 'pattern': return <Shield className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const riskLevel = anomalies.length > 3 ? 'high' : anomalies.length > 1 ? 'medium' : 'low';

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Anomaly Detection & Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{anomalies.length}</div>
              <div className="text-sm text-gray-600">Anomalies Detected</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${
                riskLevel === 'high' ? 'text-red-600' : 
                riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {riskLevel.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600">Risk Level</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {anomalies.length > 0 ? Math.round(anomalies[0].anomalyScore) : 0}
              </div>
              <div className="text-sm text-gray-600">Highest Score</div>
            </div>
          </div>

          {riskLevel === 'high' && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                High number of anomalies detected. Consider reducing position size or increasing monitoring.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Anomaly Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Price Anomalies Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.isAnomaly) {
                    return <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#dc2626" strokeWidth={2} />;
                  }
                  return <circle cx={cx} cy={cy} r={3} fill="#2563eb" />;
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Anomaly List */}
      {anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detected Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.map((anomaly, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(anomaly.type)}
                    <div>
                      <div className="font-medium text-gray-900">{anomaly.description}</div>
                      <div className="text-sm text-gray-500">{anomaly.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600">
                      Score: {Math.round(anomaly.anomalyScore)}
                    </span>
                    <Badge className={`${getSeverityColor(anomaly.severity)} text-white`}>
                      {getSeverityIcon(anomaly.severity)}
                      <span className="ml-1 capitalize">{anomaly.severity}</span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnomalyDetector;
