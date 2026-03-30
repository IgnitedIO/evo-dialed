import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Helper Functions
const formatNumber = (num) => {
  if (num === undefined || num === null) return "0";
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

// Calculate maximum value across all chart data for consistent Y-axis scaling
const calculateMaxValue = (performanceData) => {
  if (!performanceData || performanceData.length === 0) return 100;

  let maxValue = 0;
  performanceData.forEach((dataPoint) => {
    maxValue = Math.max(
      maxValue,
      dataPoint.views || 0,
      dataPoint.likes || 0,
      dataPoint.comments || 0,
      dataPoint.shares || 0
    );
  });

  // Add some padding to the max value (20% buffer)
  return Math.ceil(maxValue * 1.2);
};

const ExportPDFGraph = ({ performance }) => {
  return (
    <div id="export-performance-graph" style={{ marginBottom: "32px" }}>
      <h2
        style={{
          fontSize: "22px",
          marginBottom: "16px",
          fontWeight: "500",
          fontFamily: "Transducer Wide",
        }}
      >
        Performance
      </h2>
      <div style={{ background: "black" }}>
        <ResponsiveContainer width={1200} height={600}>
          <LineChart
            data={performance || []}
            margin={{ top: 10, right: 15, left: 10, bottom: 60 }}
            animationDuration={0}
          >
            <CartesianGrid
              strokeDasharray="8 8"
              stroke="#E3E3DB"
              strokeWidth={2}
            />
            <XAxis
              dataKey="date"
              tick={{
                fontSize: 24,
                fontWeight: "500",
                fill: "#E3E3DB",
                angle: -45,
                dx: -22,
                dy: 30,
              }}
              stroke="#E3E3DB"
              strokeWidth={2}
              tickFormatter={(date) =>
                new Date(date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
              interval={1}
              type="category"
            />
            <YAxis
              tick={{
                fontSize: 24,
                fontWeight: "500",
                fill: "#E3E3DB",
                dx: -10,
              }}
              stroke="#E3E3DB"
              strokeWidth={2}
              domain={[0, calculateMaxValue(performance)]}
              tickFormatter={(value) => formatNumber(value)}
            />
            <Tooltip
              formatter={(value, name) => [formatNumber(value), name]}
              labelFormatter={(date) =>
                new Date(date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              }
              contentStyle={{
                backgroundColor: "black",
                border: "1px solid #E3E3DB",
                color: "#E3E3DB",
              }}
            />
            <Line
              type="monotone"
              dataKey="views"
              name="Views"
              stroke="#ff5c5c"
              strokeWidth={6}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="likes"
              name="Likes"
              stroke="#1abc9c"
              strokeWidth={6}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="comments"
              name="Comments"
              stroke="#34495e"
              strokeWidth={6}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="shares"
              name="Shares"
              stroke="#f1c40f"
              strokeWidth={6}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExportPDFGraph;
