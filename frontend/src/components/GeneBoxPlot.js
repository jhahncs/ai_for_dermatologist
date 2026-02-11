import React, { useState, useRef, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ErrorBar,
  Cell
} from 'recharts';
import './GeneBoxPlot.css';

/**
 * GeneBoxPlot Component
 *
 * Displays box plot visualization with tabs for each gene,
 * comparing Endotype 1, Endotype 2, and Baseline.
 */
const GeneBoxPlot = ({ selectedPatientsData, baselineData, topGenes, title }) => {
  const [activeTab, setActiveTab] = useState(0);
  const selectedGroupXRef = useRef(null);

  // Reset x position when tab changes
  useEffect(() => {
    selectedGroupXRef.current = null;
  }, [activeTab]);

  /**
   * Calculate box plot statistics
   */
  const calculateBoxPlotStats = (values) => {
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    const getPercentile = (p) => {
      const index = (n - 1) * p;
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;
      return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    };

    const q1 = getPercentile(0.25);
    const median = getPercentile(0.5);
    const q3 = getPercentile(0.75);
    const iqr = q3 - q1;

    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;

    const lowerWhisker = sorted.find(v => v >= lowerFence) || sorted[0];
    const upperWhisker = sorted.reverse().find(v => v <= upperFence) || sorted[0];
    sorted.reverse();

    const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
    const mean = values.reduce((a, b) => a + b, 0) / n;

    return {
      min: sorted[0],
      q1,
      median,
      q3,
      max: sorted[n - 1],
      lowerWhisker,
      upperWhisker,
      mean,
      outliers,
      iqr
    };
  };

  /**
   * Prepare chart data for the selected gene
   */
  const prepareGeneData = (gene) => {
    if (!selectedPatientsData || !baselineData) {
      console.log('Missing data:', { selectedPatientsData: !!selectedPatientsData, baselineData: !!baselineData });
      return null;
    }

    // Filter out negative predictions - only use positive predictions
    const positivePatientsOnly = selectedPatientsData.filter(p => p.prediction === 'yes');

    // Extract gene expression values for all selected patients (combined)
    const selectedValues = positivePatientsOnly
      .map(p => p.gene_expression?.[gene])
      .filter(v => v !== undefined && v !== null);

    const baselineValues = baselineData.gene_data?.[gene] || [];

    console.log(`[${gene}] Data counts:`,
      `Selected: ${selectedValues.length}, Baseline: ${baselineValues.length}`
    );
    console.log(`[${gene}] Baseline data structure:`,
      baselineData ? `Has ${Object.keys(baselineData.gene_data || {}).length} genes` : 'NULL'
    );

    // Calculate statistics
    const selectedStats = calculateBoxPlotStats(selectedValues);
    const baselineStats = calculateBoxPlotStats(baselineValues);

    console.log(`[${gene}] Stats calculated:`,
      `Selected: ${selectedStats ? 'YES' : 'NO'}, Baseline: ${baselineStats ? 'YES' : 'NO'}`
    );

    // Prepare chart data with two groups
    const chartData = [];

    
    if (selectedStats) {
      chartData.push({
        group: 'Selected Patients Group',
        boxBottom: selectedStats.q1,
        boxHeight: selectedStats.q3 - selectedStats.q1,
        median: selectedStats.median,
        whiskerLower: selectedStats.q1 - selectedStats.lowerWhisker,
        whiskerUpper: selectedStats.upperWhisker - selectedStats.q3,
        ...selectedStats,
        type: 'selected',
        patientIds: positivePatientsOnly.map(p => p.patient_id).join(', ')
      });
    }
    
    if (baselineStats) {
      chartData.push({
        group: 'Normal Group',
        label: 'Normal Group',
        boxBottom: baselineStats.q1,
        boxHeight: baselineStats.q3 - baselineStats.q1,
        median: baselineStats.median,
        whiskerLower: baselineStats.q1 - baselineStats.lowerWhisker,
        whiskerUpper: baselineStats.upperWhisker - baselineStats.q3,
        ...baselineStats,
        type: 'baseline',
        patientIds: 'Normal controls'
      });
    }
    
    // Prepare outliers
    
    const outliers = [];
    /*
    if (selectedStats?.outliers) {
      selectedStats.outliers.forEach(v => {
        outliers.push({ group: 'Selected Patients Group', value: v, type: 'selected' });
      });
    }
    if (baselineStats?.outliers) {
      baselineStats.outliers.forEach(v => {
        outliers.push({ group: 'Normal Group', value: v, type: 'baseline' });
      });
    }
    */
    // Prepare individual patient lines for the Selected Patients group
    
    const patientLines = positivePatientsOnly.map(p => ({
      patientId: p.patient_id,
      value: p.gene_expression?.[gene],
      endotype: p.endotype
    })).filter(p => p.value !== undefined && p.value !== null);
    
    const groupNames = chartData.map(d => d.group).join(' | ');
    console.log(`[${gene}] ✅ Final chartData has ${chartData.length} groups: ${groupNames || 'NONE'}`);

    // Log actual box data for debugging
    chartData.forEach(group => {
      console.log(`  📊 ${group.group}: Q1=${group.q1?.toFixed(2)}, Median=${group.median?.toFixed(2)}, Q3=${group.q3?.toFixed(2)}, Height=${group.boxHeight?.toFixed(2)}`);
    });

    return { chartData, outliers, patientLines };
  };

  /**
   * Custom tooltip
   */
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;

      const formatValue = (value) => {
        return value !== undefined && value !== null ? value.toFixed(2) : 'N/A';
      };

      return (
        <div className="custom-tooltip">
          <p className="gene-label"><strong>{data.group}</strong></p>
          {data.patientIds && (
            <p className="patient-ids-tooltip">
              <strong>Patients:</strong> {data.patientIds}
            </p>
          )}
          <div className="tooltip-section">
            <p><strong>Max:</strong> {formatValue(data.max)}</p>
            <p><strong>Q3 (75%):</strong> {formatValue(data.q3)}</p>
            <p><strong>Median (50%):</strong> {formatValue(data.median)}</p>
            <p><strong>Q1 (25%):</strong> {formatValue(data.q1)}</p>
            <p><strong>Min:</strong> {formatValue(data.min)}</p>
            {data.outliers && data.outliers.length > 0 && (
              <p><strong>Outliers:</strong> {data.outliers.length}</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  /**
   * Custom box shape
   */
  const BoxShape = (props) => {
    const { x, y, width, height, fill } = props;
    if (!height || height <= 0) return null;

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke="#333"
        strokeWidth={2}
        opacity={0.8}
      />
    );
  };

  /**
   * Get color for group type
   */
  const getGroupColor = (type) => {
    switch (type) {
      case 'selected':
        return '#3498db'; // Blue for Selected Patients
      case 'baseline':
        return '#27ae60'; // Green for Baseline
      default:
        return '#95a5a6';
    }
  };

  /**
   * Get color for endotype (for individual patient lines)
   */
  const getEndotypeColor = (endotype) => {
    switch (endotype) {
      case 'endotype_1':
        return '#e74c3c'; // Red for Endotype 1
      case 'endotype_2':
        return '#f39c12'; // Orange for Endotype 2
      default:
        return '#3498db'; // Blue default
    }
  };

  if (!topGenes || topGenes.length === 0) {
    return (
      <div className="gene-boxplot-container">
        <p className="no-data-message">No gene expression data available for visualization.</p>
      </div>
    );
  }

  const currentGene = topGenes[activeTab];
  const geneData = prepareGeneData(currentGene);

  if (!geneData || !geneData.chartData || geneData.chartData.length === 0) {
    return (
      <div className="gene-boxplot-container">
        <p className="no-data-message">Insufficient data for {currentGene} visualization.</p>
      </div>
    );
  }

  return (
    <div className="gene-boxplot-container">
      <h3 className="boxplot-title">{title}</h3>

      {/* Tab Navigation */}
      <div className="gene-tabs">
        {topGenes.map((gene, index) => (
          <button
            key={gene}
            className={`gene-tab ${index === activeTab ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {gene}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="legend-info">
        <span className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#3498db' }}></span>
          Selected Patients
        </span>
        <span className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#27ae60' }}></span>
          Normal
        </span>
        <div style={{ marginLeft: '30px', borderLeft: '2px solid #ddd', paddingLeft: '30px' }}>
          <span className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#e74c3c' }}></span>
            Endotype 1
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#f39c12' }}></span>
            Endotype 2
          </span>
        </div>
      </div>

      {/* Box Plot Chart */}
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={450}>
          <ComposedChart
            data={geneData.chartData}
            margin={{ top: 50, right: 120, bottom: 60, left: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              xAxisId="main"
              type="category"
              dataKey="group"
              label={{ value: 'Groups', position: 'insideBottom', offset: -50 }}
            />
            <XAxis
              xAxisId="scatter"
              type="category"
              dataKey="group"
              hide={true}
            />
            <YAxis
              label={{
                value: `${currentGene} Expression Level`,
                angle: -90,
                position: 'insideLeft',
                dy: 60
              }}
            />


            {/* Whiskers (lower) */}
            <Bar xAxisId="main" dataKey="boxBottom" stackId="box" fill="transparent">
              <ErrorBar
                dataKey="whiskerLower"
                direction="y"
                width={1}
                strokeWidth={2}
                stroke="#333"
              />
            </Bar>

            {/* Box (Q1 to Q3) */}
            <Bar
              xAxisId="main"
              dataKey="boxHeight"
              stackId="box"
              shape={<BoxShape />}
            >
              {geneData.chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getGroupColor(entry.type)}
                />
              ))}
              <ErrorBar
                dataKey="whiskerUpper"
                direction="y"
                width={1}
                strokeWidth={2}
                stroke="#333"
              />
            </Bar>

            {/* Median line */}


            {/* Outliers */}
            {geneData.outliers.length > 0 && (
              <Scatter
                xAxisId="scatter"
                data={geneData.outliers}
                dataKey="value"
                shape="circle"
                legendType="none"
              >
                {geneData.outliers.map((entry, index) => (
                  <Cell
                    key={`outlier-${index}`}
                    fill={getGroupColor(entry.type)}
                    opacity={0.6}
                  />
                ))}
              </Scatter>
            )}

            {/* Individual Patient Markers - Only for Selected Patients Group */}
            {geneData.patientLines && geneData.patientLines.length > 0 && (
              <Scatter
                xAxisId="scatter"
                data={geneData.patientLines.map((p, idx) => ({ ...p, group: 'Selected Patients Group', index: idx }))}
                dataKey="value"
                shape={(props) => {
                  const { cx, cy, payload, index } = props;
                  if (!cx || !cy || !payload) return null;

                  // Store the x-position from the first line and reuse for all subsequent lines
                  if (index === 0 || !selectedGroupXRef.current) {
                    selectedGroupXRef.current = cx;
                  }

                  // Use the stored x-position for all lines to ensure they align
                  const centerX = selectedGroupXRef.current;
                  const color = getEndotypeColor(payload.endotype);
                  const lineWidth = 60;

                  return (
                    <g>
                      {/* White outline for better visibility */}
                      <line
                        x1={centerX - lineWidth}
                        y1={cy}
                        x2={centerX + lineWidth}
                        y2={cy}
                        stroke="white"
                        strokeWidth={5}
                        opacity={0.8}
                      />
                      {/* Main horizontal line */}
                      <line
                        x1={centerX - lineWidth}
                        y1={cy}
                        x2={centerX + lineWidth}
                        y2={cy}
                        stroke={color}
                        strokeWidth={3}
                        opacity={1}
                      />
                      {/* Endpoint markers */}
                      <circle cx={centerX - lineWidth} cy={cy} r={3} fill={color} />
                      <circle cx={centerX + lineWidth} cy={cy} r={3} fill={color} />
                      {/* Patient ID label with background */}
                      <rect
                        x={centerX + lineWidth + 8}
                        y={cy - 10}
                        width={payload.patientId.length * 7 + 8}
                        height={18}
                        fill="white"
                        stroke={color}
                        strokeWidth={1}
                        rx={3}
                        opacity={0.95}
                      />
                      <text
                        x={centerX + lineWidth + 12}
                        y={cy}
                        dy={4}
                        fill={color}
                        fontSize={12}
                        fontWeight={700}
                      >
                        {payload.patientId}
                      </text>
                    </g>
                  );
                }}
                legendType="none"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GeneBoxPlot;
