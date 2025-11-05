import React, { useState, useMemo } from 'react';
import { 
  Box, Grid, Card, CardContent, TextField, FormControl, 
  InputLabel, Select, MenuItem, Typography, Switch, FormControlLabel
} from '@mui/material';

export const ProductTable = ({ data, uniqueValues }) => {
  const [filters, setFilters] = useState({
    startDate: '2025-10-01',
    endDate: '2025-10-08',
    projectId: '',
    environmentType: '',
    environment: '',
    viewType: 'daily'
  });
  
  const [granularityMode, setGranularityMode] = useState('environment-type');

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchDate = row.Data >= filters.startDate && row.Data <= filters.endDate;
      const matchProject = !filters.projectId || row['project-id'] === filters.projectId;
      const matchEnvType = !filters.environmentType || row['environment-type'] === filters.environmentType;
      const matchEnv = !filters.environment || row['environment'] === filters.environment;
      return matchDate && matchProject && matchEnvType && matchEnv;
    });
  }, [data, filters]);

  const tableData = useMemo(() => {
    if (filteredData.length === 0) {
      return { headers: [], rows: [], monthYear: 'Sem dados' };
    }

    if (filters.viewType === 'daily') {
      const dates = [...new Set(filteredData.map(row => row.Data))].sort();
      
      let products = [];
      if (!filters.projectId) {
        products = [...new Set(filteredData.map(row => row['project-id']).filter(Boolean))];
      } else {
        const groupingField = granularityMode === 'environment-type' ? 'environment-type' : 'environment';
        products = [...new Set(filteredData.map(row => row[groupingField]).filter(Boolean))];
      }

      const middleDate = new Date(dates[Math.floor(dates.length / 2)] || dates[0]);
      const monthYear = middleDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      const dayHeaders = dates.map(date => {
        const day = date.split('-')[2];
        return { key: date, display: parseInt(day, 10).toString() };
      });

      const headers = [
        { key: 'product', display: filters.projectId ? 'Ambiente' : 'Produto', width: 150 },
        ...dayHeaders.map(h => ({ ...h, width: 80 })),
        { key: 'total', display: 'Total', width: 100 } // NOVA COLUNA TOTAL
      ];

      // Objeto para armazenar totais por dia
      const dailyTotals = {};
      dates.forEach(date => {
        dailyTotals[date] = 0;
      });

      const rows = products.map(product => {
        const rowData = { product };
        let previousValue = null;
        let rowTotal = 0; // Total da linha

        dates.forEach(date => {
          const groupingField = filters.projectId 
            ? (granularityMode === 'environment-type' ? 'environment-type' : 'environment')
            : 'project-id';
          
          const dayData = filteredData.filter(row => 
            row.Data === date && row[groupingField] === product
          );
          const currentValue = dayData.reduce((sum, row) => sum + parseFloat(row.Cost_USD_Day || 0), 0);
          
          let trend = null;
          if (previousValue !== null && previousValue !== currentValue) {
            trend = currentValue > previousValue ? 'up' : 'down';
          }
          
          rowData[date] = {
            value: currentValue,
            trend: trend,
            formatted: `$${currentValue.toFixed(2)}`,
            instanceCount: dayData.length
          };
          
          rowTotal += currentValue; // Acumula total da linha
          dailyTotals[date] += currentValue; // Acumula total da coluna
          previousValue = currentValue;
        });

        // Adicionar coluna Total
        rowData.total = {
          value: rowTotal,
          formatted: `$${rowTotal.toFixed(2)}`,
          instanceCount: 0
        };

        return rowData;
      });

      // Adicionar linha TOTAL
      const totalRow = { product: 'TOTAL', isTotal: true };
      let grandTotal = 0;
      
      dates.forEach(date => {
        const dayTotal = dailyTotals[date];
        totalRow[date] = {
          value: dayTotal,
          formatted: `$${dayTotal.toFixed(2)}`,
          instanceCount: 0
        };
        grandTotal += dayTotal;
      });

      totalRow.total = {
        value: grandTotal,
        formatted: `$${grandTotal.toFixed(2)}`,
        instanceCount: 0
      };

      rows.push(totalRow);

      return { headers, rows, monthYear };
    }
    
    // Visão mensal (código similar ao daily, mas agrupado por mês)
    return { headers: [], rows: [], monthYear: 'Visão Mensal' };
  }, [filteredData, filters, granularityMode]);

  return (
    <Box>
      <Box className="filters-container">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
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
          <Grid item xs={12} sm={6} md={2}>
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
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Projeto</InputLabel>
              <Select
                value={filters.projectId}
                onChange={(e) => setFilters({...filters, projectId: e.target.value})}
                label="Projeto"
              >
                <MenuItem value="">Todos os Projetos</MenuItem>
                {uniqueValues.projects.map(project => (
                  <MenuItem key={project} value={project}>{project}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Visão</InputLabel>
              <Select
                value={filters.viewType}
                onChange={(e) => setFilters({...filters, viewType: e.target.value})}
                label="Visão"
              >
                <MenuItem value="daily">📅 Diária</MenuItem>
                <MenuItem value="monthly">📆 Mensal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {filters.projectId && (
            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={granularityMode === 'environment'}
                    onChange={(e) => setGranularityMode(e.target.checked ? 'environment' : 'environment-type')}
                  />
                }
                label={granularityMode === 'environment-type' ? 'Tipo' : 'Ambiente'}
              />
            </Grid>
          )}
        </Grid>
      </Box>

      <Box sx={{ background: 'white', padding: 2, margin: 2, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: '#1976d2' }}>
          📊 {tableData.monthYear}
        </Typography>
        
        {tableData.rows.length > 0 ? (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  {tableData.headers.map(header => (
                    <th key={header.key} style={{ 
                      padding: '12px 8px', 
                      textAlign: header.key === 'product' ? 'left' : 'center', 
                      borderBottom: '2px solid #ddd',
                      fontWeight: 'bold',
                      backgroundColor: header.key === 'total' ? '#e3f2fd' : '#f5f5f5'
                    }}>
                      {header.display}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, index) => {
                  const isTotal = row.isTotal;
                  return (
                    <tr
                      key={row.product}
                      style={{
                        backgroundColor: isTotal ? '#e3f2fd' : (index % 2 === 0 ? '#fff' : '#fafafa'),
                        fontWeight: isTotal ? 'bold' : 'normal',
                        borderTop: isTotal ? '2px solid #1976d2' : 'none'
                      }}
                      onMouseEnter={(e) => !isTotal && (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                      onMouseLeave={(e) => !isTotal && (e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fff' : '#fafafa')}
                    >
                      <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{row.product}</td>
                      {tableData.headers.slice(1).map(header => {
                        const cellData = row[header.key];
                        if (!cellData || cellData.value === 0) {
                          return <td key={header.key} style={{ padding: '12px 8px', textAlign: 'center', color: '#999' }}>-</td>;
                        }
                        const trendColor = cellData.trend === 'up' ? '#d32f2f' : cellData.trend === 'down' ? '#388e3c' : '#333';
                        const trendIcon = cellData.trend === 'up' ? '▲' : cellData.trend === 'down' ? '▼' : '';
                        const isColumnTotal = header.key === 'total';
                        
                        return (
                          <td key={header.key} style={{ 
                            padding: '12px 8px', 
                            textAlign: 'center', 
                            color: isTotal || isColumnTotal ? '#1976d2' : trendColor,
                            fontWeight: isTotal || isColumnTotal ? 'bold' : (cellData.trend ? 'bold' : 'normal'),
                            backgroundColor: isColumnTotal ? '#e3f2fd' : 'transparent'
                          }} title={`${cellData.formatted} (${cellData.instanceCount} instâncias)`}>
                            {cellData.formatted} {!isTotal && !isColumnTotal && trendIcon}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        ) : (
          <Typography sx={{ textAlign: 'center', py: 4, color: '#666' }}>⚠️ Conteúdo em Desevolvimento</Typography>
        )}
      </Box>
    </Box>
  );
};
