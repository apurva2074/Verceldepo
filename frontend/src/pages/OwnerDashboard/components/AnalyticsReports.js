import React, { useState, useEffect, useCallback } from "react";
import "./AnalyticsReports.css";
import { getOwnerAnalytics } from "../../../services/ownerAnalyticsService";

export default function AnalyticsReports() {
  const [analyticsData, setAnalyticsData] = useState({
    revenueOverview: {
      totalRevenue: 0,
      monthlyGrowth: 0,
      yearlyGrowth: 0,
      averageRent: 0
    },
    propertyPerformance: [],
    occupancyMetrics: {
      occupancyRate: 0,
      totalProperties: 0,
      occupiedProperties: 0,
      vacantProperties: 0
    },
    tenantAnalytics: {
      totalTenants: 0,
      newTenantsThisMonth: 0,
      averageTenancyDuration: 0,
      tenantSatisfactionScore: 0
    },
    marketInsights: {
      averageMarketRent: 0,
      competitiveProperties: 0,
      demandScore: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [activeChart, setActiveChart] = useState('revenue');

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getOwnerAnalytics(timeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="analytics-reports">
      {/* Header with Time Range Selector */}
      <div className="analytics-header">
        <div className="header-content">
          <h2>Analytics & Reports</h2>
          <p>Track your property performance and revenue insights</p>
        </div>
        <div className="time-range-selector">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 3 Months</option>
            <option value="1year">Last Year</option>
          </select>
          <button className="export-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Report
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="kpi-grid">
        <div className="kpi-card revenue-kpi">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="kpi-content">
            <h3>{formatCurrency(analyticsData.revenueOverview.totalRevenue)}</h3>
            <p>Total Revenue</p>
            <span className={`trend ${analyticsData.revenueOverview.monthlyGrowth >= 0 ? 'positive' : 'negative'}`}>
              {formatPercentage(analyticsData.revenueOverview.monthlyGrowth)} vs last month
            </span>
          </div>
        </div>

        <div className="kpi-card occupancy-kpi">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div className="kpi-content">
            <h3>{analyticsData.occupancyMetrics.occupancyRate.toFixed(1)}%</h3>
            <p>Occupancy Rate</p>
            <span className="detail">
              {analyticsData.occupancyMetrics.occupiedProperties} of {analyticsData.occupancyMetrics.totalProperties} properties
            </span>
          </div>
        </div>

        <div className="kpi-card tenants-kpi">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="kpi-content">
            <h3>{analyticsData.tenantAnalytics.totalTenants}</h3>
            <p>Total Tenants</p>
            <span className="detail">
              +{analyticsData.tenantAnalytics.newTenantsThisMonth} this month
            </span>
          </div>
        </div>

        <div className="kpi-card market-kpi">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <div className="kpi-content">
            <h3>{formatCurrency(analyticsData.marketInsights.averageMarketRent)}</h3>
            <p>Avg Market Rent</p>
            <span className="detail">
              Demand Score: {analyticsData.marketInsights.demandScore}/100
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-tabs">
          <button 
            className={`chart-tab ${activeChart === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveChart('revenue')}
          >
            Revenue Trends
          </button>
          <button 
            className={`chart-tab ${activeChart === 'occupancy' ? 'active' : ''}`}
            onClick={() => setActiveChart('occupancy')}
          >
            Occupancy Analysis
          </button>
          <button 
            className={`chart-tab ${activeChart === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveChart('performance')}
          >
            Property Performance
          </button>
        </div>

        <div className="chart-container">
          {activeChart === 'revenue' && (
            <div className="revenue-chart">
              <h3>Revenue Overview</h3>
              <div className="chart-placeholder">
                <svg width="100%" height="300" viewBox="0 0 800 300">
                  {/* Simple line chart representation */}
                  <polyline
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2"
                    points="50,250 150,200 250,180 350,150 450,120 550,100 650,80 750,60"
                  />
                  <polyline
                    fill="url(#gradient)"
                    fillOpacity="0.3"
                    points="50,250 150,200 250,180 350,150 450,120 550,100 650,80 750,60 750,280 50,280"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          )}

          {activeChart === 'occupancy' && (
            <div className="occupancy-chart">
              <h3>Occupancy Trends</h3>
              <div className="chart-placeholder">
                <div className="occupancy-bars">
                  <div className="bar" style={{ height: '85%' }} title="Jan: 85%">
                    <span>85%</span>
                  </div>
                  <div className="bar" style={{ height: '90%' }} title="Feb: 90%">
                    <span>90%</span>
                  </div>
                  <div className="bar" style={{ height: '88%' }} title="Mar: 88%">
                    <span>88%</span>
                  </div>
                  <div className="bar" style={{ height: '92%' }} title="Apr: 92%">
                    <span>92%</span>
                  </div>
                  <div className="bar" style={{ height: '95%' }} title="May: 95%">
                    <span>95%</span>
                  </div>
                  <div className="bar" style={{ height: '93%' }} title="Jun: 93%">
                    <span>93%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeChart === 'performance' && (
            <div className="performance-chart">
              <h3>Property Performance</h3>
              <div className="property-performance-list">
                {analyticsData.propertyPerformance.map((property, index) => (
                  <div key={property.id} className="performance-item">
                    <div className="property-info">
                      <h4>{property.title}</h4>
                      <p>{property.address}</p>
                    </div>
                    <div className="performance-metrics">
                      <div className="metric">
                        <span className="label">Revenue</span>
                        <span className="value">{formatCurrency(property.revenue)}</span>
                      </div>
                      <div className="metric">
                        <span className="label">Occupancy</span>
                        <span className="value">{property.occupancyRate}%</span>
                      </div>
                      <div className="metric">
                        <span className="label">Views</span>
                        <span className="value">{property.views}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Reports Section */}
      <div className="reports-section">
        <h3>Detailed Reports</h3>
        <div className="reports-grid">
          <div className="report-card">
            <div className="report-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <h4>Financial Summary</h4>
            <p>Monthly revenue, expenses, and profit analysis</p>
            <button className="generate-report-btn">Generate Report</button>
          </div>

          <div className="report-card">
            <div className="report-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            </div>
            <h4>Tenant Report</h4>
            <p>Tenant demographics, satisfaction, and retention metrics</p>
            <button className="generate-report-btn">Generate Report</button>
          </div>

          <div className="report-card">
            <div className="report-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h4>Property Performance</h4>
            <p>Individual property metrics and comparative analysis</p>
            <button className="generate-report-btn">Generate Report</button>
          </div>

          <div className="report-card">
            <div className="report-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h4>Market Analysis</h4>
            <p>Market trends, competition analysis, and pricing insights</p>
            <button className="generate-report-btn">Generate Report</button>
          </div>
        </div>
      </div>
    </div>
  );
}
