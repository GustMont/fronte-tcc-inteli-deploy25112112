import React, { useState, useMemo } from 'react';
import { 
  Box, Grid, Card, CardContent, TextField, FormControl, 
  InputLabel, Select, MenuItem, Typography, FormControlLabel, Switch
} from '@mui/material';
import ReactECharts from 'echarts-for-react';

export const ProjectAnalysis = ({ data, uniqueValues }) => {
  const [filters, setFilters] = useState({
    startDate: '2025-10-01',
    endDate: '2025-10-08',
    projectId: '',
    environmentType: '',
    environment: '',
    instanceRole: ''  // NOVO
  });
  
  const [granularityMode, setGranularityMode] = useState('environment-type');
  const [showTotalLine, setShowTotalLine] = useState(true);

  // Dados filtrados
  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchDate = row.Data >= filters.startDate && row.Data <= filters.endDate;
      const matchProject = !filters.projectId || row['project-id'] === filters.projectId;
      const matchEnvType = !filters.environmentType || row['environment-type'] === filters.environmentType;
      const matchEnv = !filters.environment || row['environment'] === filters.environment;
      const matchInstanceRole = !filters.instanceRole || row['Instance_Role'] === filters.instanceRole;
      return matchDate && matchProject && matchEnvType && matchEnv && matchInstanceRole;
    });
  }, [data, filters]);

  // Valores únicos de Instance_Role filtrados pelo ambiente selecionado
  const availableInstanceRoles = useMemo(() => {
    if (!filters.environment) return [];
    
    return [...new Set(data
      .filter(row => row['environment'] === filters.environment)
      .map(row => row['Instance_Role'])
      .filter(Boolean)
    )].sort();
  }, [data, filters.environment]);

  // Configuração do gráfico - CORRIGIDO: usa filteredData
  const chartData = useMemo(() => {
    const dates = [...new Set(filteredData.map(row => row.Data))].sort();
    const colors = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#795548', '#607d8b', '#e91e63', '#9c27b0', '#3f51b5'];
    
    if (filteredData.length === 0) {
      return { xAxis: { type: 'category', data: [] }, yAxis: { type: 'value' }, series: [], legend: { data: [] } };
    }
    
    let series = [];
    
    // NOVO: Se um ambiente específico for selecionado, mostra por Instance_Role
    if (filters.environment && !filters.instanceRole) {
      const roles = [...new Set(filteredData.map(row => row['Instance_Role']).filter(Boolean))];
      series = roles.map((role, index) => ({
        name: role,
        type: 'line',
        data: dates.map(date => {
          const dayData = filteredData.filter(row => row.Data === date && row['Instance_Role'] === role);
          return dayData.reduce((sum, row) => sum + parseFloat(row.Cost_USD_Day || 0), 0).toFixed(2);
        }),
        smooth: true,
        lineStyle: { color: colors[index % colors.length] },
        symbol: 'circle',
        symbolSize: 4
      }));
    }
    // Se nenhum projeto selecionado, mostra por projeto
    else if (!filters.projectId) {
      const projects = [...new Set(filteredData.map(row => row['project-id']).filter(Boolean))];
      series = projects.map((project, index) => ({
        name: project,
        type: 'line',
        data: dates.map(date => {
          const dayData = filteredData.filter(row => row.Data === date && row['project-id'] === project);
          return dayData.reduce((sum, row) => sum + parseFloat(row.Cost_USD_Day || 0), 0).toFixed(2);
        }),
        smooth: true,
        lineStyle: { color: colors[index % colors.length] },
        symbol: 'circle',
        symbolSize: 4
      }));
    } 
    // Se projeto selecionado, mostra por granularidade (tipo ou ambiente)
    else {
      const groupingField = granularityMode === 'environment-type' ? 'environment-type' : 'environment';
      const groups = [...new Set(filteredData.map(row => row[groupingField]).filter(Boolean))];
      series = groups.map((group, index) => ({
        name: group,
        type: 'line',
        data: dates.map(date => {
          const dayData = filteredData.filter(row => row.Data === date && row[groupingField] === group);
          return dayData.reduce((sum, row) => sum + parseFloat(row.Cost_USD_Day || 0), 0).toFixed(2);
        }),
        smooth: true,
        lineStyle: { color: colors[index % colors.length] },
        symbol: 'circle',
        symbolSize: 4
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
        lineStyle: { color: '#000', width: 3, type: 'dashed' },
        symbol: 'diamond',
        symbolSize: 6,
        z: 10
      });
    }
    
    return {
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value', name: 'Custo (USD)' },
      tooltip: { 
        trigger: 'axis',
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderColor: '#333',
        textStyle: { color: '#fff' }
      },
      series,
      legend: { data: series.map(s => s.name), bottom: 0 }
    };
  }, [filteredData, filters, granularityMode, showTotalLine]);

  return (
    <Box>
      {/* Filtros COMPLETOS */}
      <Box className="filters-container">
        <Grid container spacing={2} alignItems="center">
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
              <InputLabel>Tipo de Ambiente</InputLabel>
              <Select
                value={filters.environmentType}
                onChange={(e) => setFilters({...filters, environmentType: e.target.value})}
                label="Tipo de Ambiente"
              >
                <MenuItem value="">Todos os Tipos</MenuItem>
                {uniqueValues.environmentTypes.map(envType => (
                  <MenuItem key={envType} value={envType}>
                    {envType === 'production' ? 'Produção' : 'Não-Produção'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Ambiente</InputLabel>
              <Select
                value={filters.environment}
                onChange={(e) => setFilters({...filters, environment: e.target.value, instanceRole: ''})}  // MODIFICADO: reseta instanceRole
                label="Ambiente"
              >
                <MenuItem value="">Todos os Ambientes</MenuItem>
                {uniqueValues.environments.map(env => (
                  <MenuItem key={env} value={env}>{env}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Filtro de Instance Role (condicional) */}
          {filters.environment && (
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Instance Role</InputLabel>
                <Select
                  value={filters.instanceRole}
                  onChange={(e) => setFilters({...filters, instanceRole: e.target.value})}
                  label="Instance Role"
                >
                  <MenuItem value="">Todas as Roles</MenuItem>
                  {availableInstanceRoles.map(role => (
                    <MenuItem key={role} value={role}>{role}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Switch de Granularidade - ADICIONADO */}
          {filters.projectId && (
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ mb: 1 }}>
                  Visualizar por:
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={granularityMode === 'environment'}
                      onChange={(e) => setGranularityMode(e.target.checked ? 'environment' : 'environment-type')}
                      size="small"
                    />
                  }
                  label={granularityMode === 'environment-type' ? 'Tipo' : 'Ambiente'}
                  labelPlacement="top"
                />
              </Box>
            </Grid>
          )}
        </Grid>
        
        {/* Controle da linha de total */}
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showTotalLine}
                onChange={(e) => setShowTotalLine(e.target.checked)}
                size="small"
              />
            }
            label="Mostrar linha de total"
          />
        </Box>
      </Box>

      {/* KPIs COMPLETOS */}
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
                {filters.projectId ? 1 : [...new Set(filteredData.map(row => row['project-id']).filter(Boolean))].length}
              </div>
              <div className="kpi-label">Projetos</div>
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

      {/* Info ADICIONADA */}
      <Box sx={{ p: 2, backgroundColor: '#f5f5f5', margin: 2, fontSize: '0.8em' }}>
        <Typography variant="caption">
          📊 Análise por Projetos: {filteredData.length} registros | 
          💰 Custo total: ${filteredData.reduce((sum, row) => sum + parseFloat(row.Cost_USD_Day || 0), 0).toFixed(2)} |
          🏗️ Projetos: {[...new Set(filteredData.map(row => row['project-id']).filter(Boolean))].join(', ') || 'Nenhum'}
          {filters.projectId && ` | 📊 Granularidade: ${granularityMode === 'environment-type' ? 'Tipo de Ambiente' : 'Ambiente Específico'}`}
          {showTotalLine && ' | 📈 Linha de total ativa'}
        </Typography>
      </Box>
    </Box>
  );
};
