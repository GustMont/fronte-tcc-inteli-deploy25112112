import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Tabs, Tab, Box } from '@mui/material';
import { useEC2Data } from './hooks/useEC2Data';
import { ProjectAnalysis } from './components/ProjectAnalysis';
import { CostCenterAnalysis } from './components/CostCenterAnalysis';
import { ProductTable } from './components/ProductTable';
import { CostCenterTable } from './components/CostCenterTable';

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const { data, loading, uniqueValues } = useEC2Data();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Carregando dados...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Dashboard EC2 - FinOps & DevOps
          </Typography>
          <Typography variant="body2">
            {data.length} registros carregados
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Análise por Projetos" />
          <Tab label="Análise por Centro de Custos" />
          <Tab label="Tabela por Projetos" />
          <Tab label="Tabela por Centro de Custos" />
        </Tabs>
      </Box>

      {activeTab === 0 && <ProjectAnalysis data={data} uniqueValues={uniqueValues} />}
      {activeTab === 1 && <CostCenterAnalysis data={data} uniqueValues={uniqueValues} />}
      {activeTab === 2 && <ProductTable data={data} uniqueValues={uniqueValues} />}
      {activeTab === 3 && <CostCenterTable data={data} uniqueValues={uniqueValues} />}
    </Box>
  );
}

export default App;