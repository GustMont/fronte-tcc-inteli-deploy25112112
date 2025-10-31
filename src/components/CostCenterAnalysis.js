import React, { useState, useMemo } from 'react';
import { 
  Box, Grid, Card, CardContent, TextField, FormControl, 
  InputLabel, Select, MenuItem, Typography, FormControlLabel, Switch
} from '@mui/material';
import ReactECharts from 'echarts-for-react';

export const CostCenterAnalysis = ({ data, uniqueValues }) => {
  const [filters, setFilters] = useState({
    startDate: '2025-10-01',
    endDate: '2025-10-08',
    costCenterId: ''
  });
  
  const [showTotalLine, setShowTotalLine] = useState(true);

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchDate = row.Data >= filters.startDate && row.Data <= filters.endDate;
      const matchCostCenter = !filters.costCenterId || row['cost-center'] === filters.costCenterId;
      return matchDate && matchCostCenter;
    });
  }, [data, filters]);

  const chartData = useMemo(() => {
    const dates = [...new Set(filteredData.map(row => row.Data))].sort();
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
    
    if (filteredData.length === 0) {
      return { xAxis: { type: 'category', data: [] }, yAxis: { type: 'value' }, series: [], legend: { data: [] } };
    }
    
    let series = [];
    
    if (!filters.costCenterId) {
      const costCenters = [...new Set(filteredData.map(row => row['cost-center']).filter(Boolean))];
      series = costCenters.map((costCenter, index) => ({
        name: costCenter,
        type: 'line',
        data: dates.map(date => {
          const dayData = filteredData.filter(row => row.Data === date && row['cost-center'] === costCenter);
          return dayData.reduce((sum, row) => sum + parseFloat(row.Cost_USD_Day || 0), 0).toFixed(2);
        }),
        smooth: true,
        lineStyle: { color: colors[index % colors.length] }
      }));
    } else {
      const projects = [...new Set(filteredData.map(row => row['project-id']).filter(Boolean))];
      series = projects.map((project, index) => ({
        name: project,
        type: 'line',
        data: dates.map(date => {
          const dayData = filteredData.filter(row => row.Data === date && row['project-id'] === project);
          return dayData.reduce((sum, row) => sum + parseFloat(row.Cost_USD_Day || 0), 0).toFixed(2);
        }),
        smooth: true,
        lineStyle: { color: colors[index % colors.length] }
      }));
    }
    
    if (showTotalLine) {
      series.push({
        name: 'Total',
        type: 'line',
        data: dates.map(date => {
          const dayData = filteredData.filter(row => row.Data === date);
          return dayData.reduce((sum, row) => sum + parseFloat(row.Cost_USD_Day || 0), 0).toFixed(2);
        }),
        smooth: true,
        lineStyle: { color: '#000', width: 3, type: 'dashed' }
      });
    }
    
    return {
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value', name: 'Custo (USD)' },
      tooltip: { trigger: 'axis' },
      series,
      legend: { data: series.map(s => s.name), bottom: 0 }
    };
  }, [filteredData, filters, showTotalLine]);

  return (
    <Box>
      <Box className="filters-container">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Data Início"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Data Fim"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Centro de Custo</InputLabel>
              <Select
                value={filters.costCenterId}
                onChange={(e) => setFilters({...filters, costCenterId: e.target.value})}
                label="Centro de Custo"
              >
                <MenuItem value="">Todos os Centros</MenuItem>
                {uniqueValues.costCenters.map(costCenter => (
                  <MenuItem key={costCenter} value={costCenter}>{costCenter}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={<Switch checked={showTotalLine} onChange={(e) => setShowTotalLine(e.target.checked)} />}
              label="Linha Total"
            />
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2, px: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent className="kpi-card">
              <div className="kpi-value">
                ${filteredData.reduce((sum, row) => sum + parseFloat(row.Cost_USD_Day || 0), 0).toFixed(2)}
              </div>
              <div className="kpi-label">Custo Total do Período</div>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent className="kpi-card">
              <div className="kpi-value">
                {filters.costCenterId ? 1 : [...new Set(filteredData.map(row => row['cost-center']).filter(Boolean))].length}
              </div>
              <div className="kpi-label">Centros de Custo</div>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent className="kpi-card">
              <div className="kpi-value">
                {[...new Set(filteredData.map(row => row.ID_Instancia))].length}
              </div>
              <div className="kpi-label">Instâncias</div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráfico */}
      <Box className="chart-container">
        <ReactECharts 
          option={chartData} 
          style={{ height: '100%', width: '100%' }} 
          notMerge={true}
          lazyUpdate={true}
        />
      </Box>
    </Box>
  );
};
