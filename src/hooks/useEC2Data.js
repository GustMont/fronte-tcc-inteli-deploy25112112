import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';


const API_BASE = process.env.REACT_APP_API_URL || '/api';


export const useEC2Data = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 INICIANDO DIAGNÓSTICO DA API');
        console.log('📡 URL da API:', `${API_BASE}/proxy`);
       
        const response = await axios.get(`${API_BASE}/proxy`);
       
        console.log('✅ RESPOSTA DA API RECEBIDA:', response.status);
       
        if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
          throw new Error(`Estrutura de dados inválida`);
        }
       
        const processedData = response.data.data.map(row => ({
          ...row,
          Cost_USD_Day: parseFloat(row.Cost_USD_Day || 0)
        }));
       
        console.log('✅ DADOS PROCESSADOS:', processedData.length, 'registros');
        setData(processedData);
      } catch (error) {
        console.error('❌ ERRO AO CARREGAR DADOS:', error.message);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  // Valores únicos para filtros
  const uniqueValues = useMemo(() => ({
    projects: [...new Set(data.map(row => row['project-id']).filter(Boolean))],
    environmentTypes: [...new Set(data.map(row => row['environment-type']).filter(Boolean))],
    environments: [...new Set(data.map(row => row['environment']).filter(Boolean))],
    costCenters: [...new Set(data.map(row => row['cost-center']).filter(Boolean))],
    instanceRoles: [...new Set(data.map(row => row['Instance_Role']).filter(Boolean))].sort()
  }), [data]);


  return { data, loading, uniqueValues };
};
