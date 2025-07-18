import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

Chart.register(...registerables);

export interface AnalyticsChartImagesHandles {
  getImages: () => Promise<{
    revenue: string;
    licenses: string;
    genres: string;
  }>;
}

interface AnalyticsChartImagesProps {
  revenueData: Array<{ month: string; total: number; }>;
  licenseData: Array<{ name: string; licenses: number; }>;
  genreData: Array<{ name: string; value: number; color: string; }>;
}

const hiddenStyle: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  width: '600px',
  height: '400px',
  pointerEvents: 'none',
  opacity: 0,
};

export const AnalyticsChartImages = forwardRef<AnalyticsChartImagesHandles, AnalyticsChartImagesProps>(
  ({ revenueData, licenseData, genreData }, ref) => {
    const revenueRef = useRef<any>(null);
    const licensesRef = useRef<any>(null);
    const genresRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      getImages: async () => {
        // Wait for charts to render
        await new Promise((resolve) => setTimeout(resolve, 100));
        const revenue = revenueRef.current?.chartInstance?.toBase64Image?.() || revenueRef.current?.canvas?.toDataURL();
        const licenses = licensesRef.current?.chartInstance?.toBase64Image?.() || licensesRef.current?.canvas?.toDataURL();
        const genres = genresRef.current?.chartInstance?.toBase64Image?.() || genresRef.current?.canvas?.toDataURL();
        return { revenue, licenses, genres };
      },
    }));

    // Data for charts
    const revenueChartData = {
      labels: revenueData.map((d) => d.month),
      datasets: [
        {
          label: 'Revenue',
          data: revenueData.map((d) => d.total),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        },
      ],
    };
    const licensesChartData = {
      labels: licenseData.map((d) => d.name),
      datasets: [
        {
          label: 'Licenses',
          data: licenseData.map((d) => d.licenses),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
        },
      ],
    };
    const genresChartData = {
      labels: genreData.map((d) => d.name),
      datasets: [
        {
          label: 'Genres',
          data: genreData.map((d) => d.value),
          backgroundColor: genreData.map((d) => d.color),
        },
      ],
    };

    return (
      <div style={hiddenStyle}>
        <div>
          <Bar ref={revenueRef} data={revenueChartData} options={{ plugins: { legend: { display: false } }, animation: false, responsive: false, maintainAspectRatio: false }} width={600} height={400} />
        </div>
        <div>
          <Bar ref={licensesRef} data={licensesChartData} options={{ plugins: { legend: { display: false } }, indexAxis: 'y', animation: false, responsive: false, maintainAspectRatio: false }} width={600} height={400} />
        </div>
        <div>
          <Pie ref={genresRef} data={genresChartData} options={{ plugins: { legend: { display: false } }, animation: false, responsive: false, maintainAspectRatio: false }} width={600} height={400} />
        </div>
      </div>
    );
  }
); 