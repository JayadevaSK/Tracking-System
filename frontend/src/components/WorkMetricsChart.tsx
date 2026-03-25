import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface DailyBreakdown {
  date: string;
  totalItems: number;
  completedItems: number;
  totalDuration: number;
}

interface WorkMetricsChartProps {
  dailyBreakdown: DailyBreakdown[];
  title?: string;
}

const WorkMetricsChart: React.FC<WorkMetricsChartProps> = ({
  dailyBreakdown,
  title = 'Work Metrics',
}) => {
  if (dailyBreakdown.length === 0) {
    return <p style={{ color: '#6c757d' }}>No data available for the selected range.</p>;
  }

  const labels = dailyBreakdown.map((d) => d.date);

  const data = {
    labels,
    datasets: [
      {
        label: 'Total Items',
        data: dailyBreakdown.map((d) => d.totalItems),
        backgroundColor: 'rgba(0, 123, 255, 0.5)',
        borderColor: 'rgba(0, 123, 255, 1)',
        borderWidth: 1,
      },
      {
        label: 'Completed',
        data: dailyBreakdown.map((d) => d.completedItems),
        backgroundColor: 'rgba(40, 167, 69, 0.5)',
        borderColor: 'rgba(40, 167, 69, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: title },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  return (
    <div style={{ maxWidth: '700px' }}>
      <Bar data={data} options={options} aria-label={title} />
    </div>
  );
};

export default WorkMetricsChart;
