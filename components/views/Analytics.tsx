import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { apiService } from '../../services/api';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import { AnalyticsSummary } from '../../types';

/**
 * Displays the synthetic telemetry returned by the virtual gateway analytics endpoint.
 * Includes resilient error handling with a retry flow so demos can recover quickly.
 */
const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await apiService.getAnalyticsSummary();
      setData(summary);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown analytics error.';
      setError(`Analytics service error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  if (error || !data) {
    return (
      <Card className="text-center space-y-4">
        <p className="text-red-500 font-semibold">{error ?? 'No analytics data available.'}</p>
        <button
          type="button"
          onClick={fetchData}
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          Retry
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Analytics & History</h2>
      
      <Card>
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Temperature History (Last 24h)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.temperatureHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
            <XAxis dataKey="hour" stroke="rgb(156 163 175)" />
            <YAxis unit="degC" stroke="rgb(156 163 175)" />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '0.5rem' }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Legend />
            <Line type="monotone" dataKey="avgTemp" name="Avg Temp" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Power Consumption (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.powerHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
              <XAxis dataKey="day" stroke="rgb(156 163 175)" />
              <YAxis unit="W" stroke="rgb(156 163 175)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="totalPower" name="Total Power" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        
        <Card>
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Motion Detections (Last 24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.motionHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
              <XAxis dataKey="hour" stroke="rgb(156 163 175)" />
              <YAxis allowDecimals={false} stroke="rgb(156 163 175)"/>
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="detections" name="Detections" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
