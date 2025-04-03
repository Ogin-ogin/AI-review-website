import React from 'react';
import { Line } from 'react-chartjs-2';

const PriceHistory = ({ priceData }) => {
  const data = {
    labels: priceData.map((entry) => entry.date),
    datasets: [
      {
        label: '価格履歴',
        data: priceData.map((entry) => entry.price),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: '日付',
        },
      },
      y: {
        title: {
          display: true,
          text: '価格 (円)',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="w-full h-64">
      <Line data={data} options={options} />
    </div>
  );
};

export default PriceHistory;