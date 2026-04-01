import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CBadge,
  CButton,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CProgress,
  CProgressBar,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormCheck,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilChartPie,
  cilWarning,
  cilCheckCircle,
  cilClock,
  cilCloudDownload,
  cilPeople,
  cilNotes,
  cilCalendar,
  cilLocationPin,
  cilArrowRight,
} from '@coreui/icons'
import { CChartDoughnut, CChartBar, CChartLine } from '@coreui/react-chartjs'
import { toast } from 'react-toastify'
import axios from 'axios'
import { authService } from '../../services/authService'

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5656/api'

/* ── Stat Card ── */
const StatCard = ({ title, value, icon, gradient, subtitle, onClick }) => (
  <CCard
    className={`border-0 shadow-sm h-100 ${onClick ? 'cursor-pointer' : ''}`}
    style={{
      borderRadius: '16px',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s',
    }}
    onClick={onClick}
    onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'translateY(-4px)')}
    onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
  >
    <CCardBody className="p-0">
      <div
        style={{
          background: gradient,
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.2,
              marginTop: '4px',
            }}
          >
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
              {subtitle}
            </div>
          )}
        </div>
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CIcon icon={icon} style={{ color: '#fff', width: 24, height: 24 }} />
        </div>
      </div>
    </CCardBody>
  </CCard>
)

/* ── Deadline Badge ── */
const DeadlineBadge = ({ days }) => {
  if (days <= 7)
    return (
      <CBadge color="danger" shape="rounded-pill">
        {days}d left
      </CBadge>
    )
  if (days <= 14)
    return (
      <CBadge color="warning" shape="rounded-pill">
        {days}d left
      </CBadge>
    )
  return (
    <CBadge color="info" shape="rounded-pill">
      {days}d left
    </CBadge>
  )
}

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

/* ── MAIN COMPONENT ── */
const CaseAnalytics = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedService, setSelectedService] = useState(null)
  const [selectedExpiryDetail, setSelectedExpiryDetail] = useState(null)

  const [showExportModal, setShowExportModal] = useState(false)
  const [exportServices, setExportServices] = useState([])

  const user = authService.getCurrentUser()
  const role = user?.role || ''

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      dispatch({ type: 'set_loading', loading: true })
      const token = authService.getToken()
      const res = await axios.get(`${BASE_API_URL}/cases/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setData(res.data)
    } catch (err) {
      console.error('Analytics fetch error:', err)
      toast.error('Failed to load analytics')
    } finally {
      dispatch({ type: 'set_loading', loading: false })
    }
  }

  const ALL_SERVICES = [
    { key: 'homeSearch', label: 'Home Search' },
    { key: 'personalLease', label: 'Personal Lease' },
    { key: 'corporateLease', label: 'Corporate Lease' },
    { key: 'orientationProgram', label: 'Orientation Program' },
    { key: 'householdGoodsMovement', label: 'Household Goods Movement' },
    { key: 'schoolSearch', label: 'School Search' },
    { key: 'simCardConnection', label: 'SIM Card Connection' },
    { key: 'tenancyManagement', label: 'Tenancy Management' },
    { key: 'visaApplication', label: 'Visa Application' },
    { key: 'departure', label: 'Departure' },
    { key: 'aadharCard', label: 'Aadhar Card' },
    { key: 'cForm', label: 'C-Form' },
    { key: 'other', label: 'Other' },
  ]

  const handleExportClick = () => {
    setShowExportModal(true)
    setExportServices(ALL_SERVICES.map((s) => s.key)) // Select all by default
  }

  const handleExportSelectAll = (e) => {
    if (e.target.checked) setExportServices(ALL_SERVICES.map((s) => s.key))
    else setExportServices([])
  }

  const handleExportCheckbox = (key) => {
    if (exportServices.includes(key)) setExportServices(exportServices.filter((k) => k !== key))
    else setExportServices([...exportServices, key])
  }

  const generateReport = async () => {
    if (exportServices.length === 0) {
      toast.warning('Please select at least one service to export')
      return
    }

    try {
      dispatch({ type: 'set_loading', loading: true })
      const token = authService.getToken()

      const res = await axios.get(`${BASE_API_URL}/cases`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const allCases = res.data

      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()

      const filteredCases = allCases.filter((c) => {
        const auth = c.servicesAuthorized || {}
        return exportServices.some((sk) => auth[sk])
      })

      const rows = []

      const reportTitle = `Dashboard report of ${role === 'Admin' ? 'Admin' : role === 'HR' ? 'HR' : 'Case Manager'}`
      rows.push([reportTitle])
      rows.push([]) // empty row spacer

      const getExpiriesList = (st) => {
        const exp = []
        const now = new Date()
        const checkUrgent = (dateStr) => {
          if (!dateStr) return false
          const days = (new Date(dateStr) - now) / (1000 * 60 * 60 * 24)
          return days <= 30
        }

        const formatExp = (label, d) => {
          if (!d) return null
          return checkUrgent(d) ? `🚨 [URGENT] ${label}: ${fmt(d)}` : `${label}: ${fmt(d)}`
        }

        if (st.homeSearch?.leaseEndDate && exportServices.includes('homeSearch'))
          exp.push(formatExp('Lease End', st.homeSearch.leaseEndDate))
        if (st.visa?.endDate && exportServices.includes('visaApplication'))
          exp.push(formatExp('Visa Expiry', st.visa.endDate))
        if (st.visa?.frroEndDate && exportServices.includes('visaApplication'))
          exp.push(formatExp('FRRO Expiry', st.visa.frroEndDate))
        if (st.tenancyManagement?.endDate && exportServices.includes('tenancyManagement'))
          exp.push(formatExp('Tenancy End', st.tenancyManagement.endDate))
        if (st.aadharCard?.expiryDate && exportServices.includes('aadharCard'))
          exp.push(formatExp('Aadhar Expiry', st.aadharCard.expiryDate))
        if (st.departure?.propertyClosureDate && exportServices.includes('departure'))
          exp.push(formatExp('Closure', st.departure.propertyClosureDate))

        return exp.filter(Boolean)
      }

      if (role === 'HR') {
        rows.push([
          'Employee Name',
          'Employee No.',
          'Start Date',
          'Billing Entity',
          'Relocation Type',
          'Service Authorization',
          'Expiry Dates',
          'Host Phone Number',
        ])

        filteredCases.forEach((c) => {
          const auth = c.servicesAuthorized || {}
          const authStr = ALL_SERVICES.filter((s) => auth[s.key] && exportServices.includes(s.key))
            .map((s) => s.label)
            .join(', ')

          const expiries = getExpiriesList(c.serviceTracking || {})

          rows.push([
            c.assigneeName || 'N/A',
            c.empNumber || 'N/A',
            fmt(c.createdAt),
            c.billingEntity || 'N/A',
            c.relocationType || 'N/A',
            authStr || 'N/A',
            expiries.length > 0 ? expiries.join(' | ') : 'N/A',
            c.hostPhoneNumber || 'N/A',
          ])
        })
      } else {
        rows.push([
          'Employee Name',
          'Employee No.',
          'Start Date',
          'Billing Entity',
          'Relocation Type',
          'Status',
          'Case Manager',
          'Service Authorization',
          'Expiry Dates',
          'Host Phone Number',
        ])

        filteredCases.forEach((c) => {
          const auth = c.servicesAuthorized || {}
          const authStr = ALL_SERVICES.filter((s) => auth[s.key] && exportServices.includes(s.key))
            .map((s) => s.label)
            .join(', ')

          const expiries = getExpiriesList(c.serviceTracking || {})

          rows.push([
            c.assigneeName || 'N/A',
            c.empNumber || 'N/A',
            fmt(c.createdAt),
            c.billingEntity || 'N/A',
            c.relocationType || 'N/A',
            c.status || 'N/A',
            c.assignedCaseManager?.username || 'Unassigned',
            authStr || 'N/A',
            expiries.length > 0 ? expiries.join(' | ') : 'N/A',
            c.hostPhoneNumber || 'N/A',
          ])
        })
      }

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Service Report')

      const s = data?.summary
      if (s) {
        const summaryRows = [
          ['Case Analytics Summary'],
          ['Role', role],
          [],
          ['Metric', 'Value'],
          ['Total Cases', s.totalCases],
          ['Active Cases', s.activeCasesCount],
          ['Completed Cases', s.completedCasesCount],
          ['Unassigned', s.unassignedCount],
          ['Avg Completion (days)', s.avgCompletionDays],
          ['Total Documents', s.totalDocuments],
          [],
          ['Status', 'Count'],
          ['Initiated', s.statusCounts?.Initiated || 0],
          ['In Progress', s.statusCounts?.['In Progress'] || 0],
          ['Completed', s.statusCounts?.Completed || 0],
          ['Cancelled', s.statusCounts?.Cancelled || 0],
        ]
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary')
      }

      XLSX.writeFile(wb, `Service_Report_${role}_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Report downloaded successfully')
      setShowExportModal(false)
    } catch (err) {
      console.error(err)
      toast.error('Export failed')
    } finally {
      dispatch({ type: 'set_loading', loading: false })
    }
  }

  if (!data) return <div className="text-center mt-5 text-muted">No analytics data available</div>

  const s = data.summary
  const sc = s.statusCounts

  /* ── Chart Data ── */
  const statusChartData = {
    labels: ['Initiated', 'In Progress', 'Completed', 'Cancelled'],
    datasets: [
      {
        backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 8,
        data: [sc.Initiated, sc['In Progress'], sc.Completed, sc.Cancelled],
      },
    ],
  }
  const svcChartData = {
    labels: (data.servicesBreakdown || []).map((s) => s.label),
    datasets: [
      {
        label: 'Cases',
        backgroundColor: '#6366f1',
        borderRadius: 6,
        barPercentage: 0.6,
        data: (data.servicesBreakdown || []).map((s) => s.count),
      },
    ],
  }
  const relocationData = {
    labels: ['Domestic', 'International', 'Unspecified'],
    datasets: [
      {
        backgroundColor: ['#3b82f6', '#8b5cf6', '#94a3b8'],
        borderWidth: 0,
        hoverOffset: 8,
        data: [
          data.relocationSplit.Domestic,
          data.relocationSplit.International,
          data.relocationSplit.Unspecified,
        ],
      },
    ],
  }
  const trendData = {
    labels: (data.monthlyTrend || []).map((m) => m.month),
    datasets: [
      {
        label: 'Created',
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        fill: true,
        tension: 0.4,
        data: (data.monthlyTrend || []).map((m) => m.count),
      },
      {
        label: 'Completed',
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill: true,
        tension: 0.4,
        data: (data.monthlyTrend || []).map((m) => m.completed),
      },
    ],
  }
  const chartOpts = {
    plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } },
    maintainAspectRatio: false,
  }

  /* ── Role-specific title ── */
  const dashTitle =
    role === 'Admin'
      ? 'Admin Analytics Overview'
      : role === 'HR'
        ? 'My Cases Analytics'
        : 'My Assigned Cases'

  return (
    <CRow>
      <CCol xs={12}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1" style={{ color: '#1e293b' }}>
              <CIcon icon={cilChartPie} className="me-2" style={{ color: '#6366f1' }} />
              {dashTitle}
            </h4>
            <small className="text-muted">Case Management Dashboard • {role}</small>
          </div>
          <div className="d-flex gap-2">
            <CButton color="primary" variant="outline" size="sm" onClick={fetchAnalytics}>
              ↻ Refresh
            </CButton>
            <CButton
              size="sm"
              onClick={handleExportClick}
              style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border: 'none',
                color: '#fff',
              }}
            >
              <CIcon icon={cilCloudDownload} className="me-1" /> Export
            </CButton>
            <CButton color="light" size="sm" onClick={() => navigate('/cases')}>
              View All Cases
            </CButton>
          </div>
        </div>

        {/* KPI Cards */}
        <CRow className="g-3 mb-4">
          <CCol sm={6} lg={3}>
            <StatCard
              title="Total Cases"
              value={s.totalCases}
              icon={cilNotes}
              gradient="linear-gradient(135deg,#6366f1,#8b5cf6)"
              subtitle={`${s.activeCasesCount} active`}
              onClick={() => navigate('/cases')}
            />
          </CCol>
          <CCol sm={6} lg={3}>
            <StatCard
              title="In Progress"
              value={sc['In Progress']}
              icon={cilClock}
              gradient="linear-gradient(135deg,#f59e0b,#f97316)"
              subtitle={`${sc.Initiated} initiated`}
              onClick={() => navigate('/cases?status=In Progress')}
            />
          </CCol>
          <CCol sm={6} lg={3}>
            <StatCard
              title="Completed"
              value={sc.Completed}
              icon={cilCheckCircle}
              gradient="linear-gradient(135deg,#10b981,#059669)"
              subtitle={`Avg ${s.avgCompletionDays}d`}
              onClick={() => navigate('/cases?status=Completed')}
            />
          </CCol>
          <CCol sm={6} lg={3}>
            <StatCard
              title={role === 'Admin' ? 'Unassigned' : 'Deadlines'}
              value={role === 'Admin' ? s.unassignedCount : (data.upcomingDeadlines || []).length}
              icon={cilWarning}
              gradient={`linear-gradient(135deg,${(role === 'Admin' ? s.unassignedCount : (data.upcomingDeadlines || []).length) > 0 ? '#ef4444,#dc2626' : '#64748b,#475569'})`}
              subtitle={role === 'Admin' ? 'Need assignment' : 'Next 30 days'}
              onClick={() =>
                role === 'Admin' ? navigate('/cases?assigned=unassigned') : setActiveTab('dates')
              }
            />
          </CCol>
        </CRow>

        {/* Tabs */}
        <CCard className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
          <CCardBody>
            <CNav variant="pills" className="mb-4">
              {['overview', 'services', 'dates', ...(role === 'Admin' ? ['workload'] : [])].map(
                (tab) => (
                  <CNavItem key={tab}>
                    <CNavLink
                      active={activeTab === tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        cursor: 'pointer',
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '14px',
                      }}
                    >
                      {tab === 'overview'
                        ? '📊 Overview'
                        : tab === 'services'
                          ? '🔧 Services'
                          : tab === 'dates'
                            ? '📅 Critical Dates'
                            : '👥 Workload'}
                    </CNavLink>
                  </CNavItem>
                ),
              )}
            </CNav>

            <CTabContent>
              {/* ── OVERVIEW TAB ── */}
              <CTabPane visible={activeTab === 'overview'}>
                <CRow className="g-4">
                  <CCol md={4}>
                    <CCard className="border-0 bg-light h-100" style={{ borderRadius: '12px' }}>
                      <CCardHeader className="bg-transparent border-0 fw-bold">
                        Status Distribution
                      </CCardHeader>
                      <CCardBody style={{ height: 260, flex: '1 1' }}>
                        <CChartDoughnut
                          data={statusChartData}
                          options={{ ...chartOpts, cutout: '65%' }}
                        />
                      </CCardBody>
                    </CCard>
                  </CCol>
                  <CCol md={4}>
                    <CCard className="border-0 bg-light h-100" style={{ borderRadius: '12px' }}>
                      <CCardHeader className="bg-transparent border-0 fw-bold">
                        Relocation Types
                      </CCardHeader>
                      <CCardBody style={{ height: 260, flex: '1 1' }}>
                        <CChartDoughnut
                          data={relocationData}
                          options={{ ...chartOpts, cutout: '65%' }}
                        />
                      </CCardBody>
                    </CCard>
                  </CCol>
                  <CCol md={4}>
                    <CCard className="border-0 bg-light h-100" style={{ borderRadius: '12px' }}>
                      <CCardHeader className="bg-transparent border-0 fw-bold">
                        Top Locations
                      </CCardHeader>
                      <CCardBody>
                        {(data.cityDistribution || []).slice(0, 6).map((c, i) => (
                          <div
                            key={i}
                            className="d-flex justify-content-between align-items-center mb-2"
                          >
                            <div className="d-flex align-items-center gap-2">
                              <CIcon icon={cilLocationPin} size="sm" style={{ color: '#6366f1' }} />
                              <span className="small fw-medium">{c.city}</span>
                            </div>
                            <CBadge color="light" textColor="dark" shape="rounded-pill">
                              {c.count}
                            </CBadge>
                          </div>
                        ))}
                        {(!data.cityDistribution || data.cityDistribution.length === 0) && (
                          <p className="text-muted text-center small mt-3">No location data</p>
                        )}
                      </CCardBody>
                    </CCard>
                  </CCol>
                  <CCol xs={12}>
                    <CCard className="border-0 bg-light" style={{ borderRadius: '12px' }}>
                      <CCardHeader className="bg-transparent border-0 fw-bold">
                        Monthly Trend (12 Months)
                      </CCardHeader>
                      <CCardBody style={{ height: 300, flex: '1 1' }}>
                        <CChartLine
                          data={trendData}
                          options={{
                            ...chartOpts,
                            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                          }}
                        />
                      </CCardBody>
                    </CCard>
                  </CCol>
                </CRow>
              </CTabPane>

              {/* ── SERVICES TAB ── */}
              <CTabPane visible={activeTab === 'services'}>
                <CRow className="g-4">
                  <CCol md={7}>
                    <CCard className="border-0 bg-light" style={{ borderRadius: '12px' }}>
                      <CCardHeader className="bg-transparent border-0 fw-bold">
                        Services Requested
                      </CCardHeader>
                      <CCardBody style={{ height: 350, flex: '1 1' }}>
                        <CChartBar
                          data={svcChartData}
                          options={{
                            ...chartOpts,
                            indexAxis: 'y',
                            scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
                          }}
                        />
                      </CCardBody>
                    </CCard>
                  </CCol>
                  <CCol md={5}>
                    <CCard className="border-0 bg-light" style={{ borderRadius: '12px' }}>
                      <CCardHeader className="bg-transparent border-0 fw-bold">
                        All Authorized Services
                      </CCardHeader>
                      <CCardBody>
                        <div className="text-muted small mb-3">
                          Click on any service to view its document expiries
                        </div>
                        {(data.activeServicesProgress || []).map((svc, i) => (
                          <div
                            key={i}
                            className="mb-3 p-2 rounded"
                            style={{
                              cursor: 'pointer',
                              backgroundColor:
                                selectedService === svc.label
                                  ? 'rgba(99,102,241,0.1)'
                                  : 'transparent',
                              transition: 'background 0.2s',
                            }}
                            onClick={() =>
                              setSelectedService(selectedService === svc.label ? null : svc.label)
                            }
                          >
                            <div className="d-flex justify-content-between mb-1 small">
                              <span className="fw-medium">{svc.label}</span>
                              <span className="text-muted">
                                {svc.completed}/{svc.authorized} completed
                              </span>
                            </div>
                            <CProgress thin>
                              <CProgressBar
                                value={
                                  svc.authorized > 0 ? (svc.completed / svc.authorized) * 100 : 0
                                }
                                color={
                                  svc.completed === svc.authorized && svc.authorized > 0
                                    ? 'success'
                                    : 'info'
                                }
                              />
                            </CProgress>
                          </div>
                        ))}
                        {(!data.activeServicesProgress ||
                          data.activeServicesProgress.length === 0) && (
                          <p className="text-muted text-center small">No authorized services</p>
                        )}
                      </CCardBody>
                    </CCard>
                  </CCol>
                </CRow>

                {/* Expiries List for Selected Service */}
                {selectedService && (
                  <CCard className="border-0 bg-light mt-4" style={{ borderRadius: '12px' }}>
                    <CCardHeader className="bg-transparent border-0 fw-bold">
                      <CIcon icon={cilCalendar} className="me-2" style={{ color: '#6366f1' }} />
                      Expiry Dates for {selectedService}
                    </CCardHeader>
                    <CCardBody className="p-0">
                      {(() => {
                        const expiries = (data.serviceExpiries || []).filter(
                          (e) => e.service === selectedService,
                        )
                        if (expiries.length === 0)
                          return (
                            <div className="text-center text-muted py-4">
                              No critical expiry records tracked for this service yet.
                            </div>
                          )
                        return (
                          <CTable hover responsive align="middle" className="mb-0">
                            <CTableHead color="light">
                              <CTableRow>
                                <CTableHeaderCell>Assignee</CTableHeaderCell>
                                <CTableHeaderCell>Start Date</CTableHeaderCell>
                                <CTableHeaderCell>Expiry Type</CTableHeaderCell>
                                <CTableHeaderCell>Expiry Date</CTableHeaderCell>
                                <CTableHeaderCell>Status</CTableHeaderCell>
                                <CTableHeaderCell>Action</CTableHeaderCell>
                              </CTableRow>
                            </CTableHead>
                            <CTableBody>
                              {expiries.map((exp, idx) => (
                                <CTableRow
                                  key={idx}
                                  style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                  onClick={() => setSelectedExpiryDetail(exp)}
                                >
                                  <CTableDataCell className="fw-medium">
                                    {exp.assigneeName}
                                  </CTableDataCell>
                                  <CTableDataCell>{fmt(exp.createdAt)}</CTableDataCell>
                                  <CTableDataCell>{exp.expiryType}</CTableDataCell>
                                  <CTableDataCell>
                                    <CBadge
                                      color="danger"
                                      shape="rounded-pill"
                                      className="fw-bold px-2 py-1"
                                      style={{ fontSize: '12px' }}
                                    >
                                      🚨 {fmt(exp.expiryDate)}
                                    </CBadge>
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <CBadge
                                      color={
                                        exp.status === 'Completed'
                                          ? 'success'
                                          : exp.status === 'Cancelled'
                                            ? 'danger'
                                            : 'warning'
                                      }
                                    >
                                      {exp.status}
                                    </CBadge>
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <CButton size="sm" color="info" variant="outline">
                                      View Details
                                    </CButton>
                                  </CTableDataCell>
                                </CTableRow>
                              ))}
                            </CTableBody>
                          </CTable>
                        )
                      })()}
                    </CCardBody>
                  </CCard>
                )}
              </CTabPane>

              {/* ── CRITICAL DATES TAB ── */}
              <CTabPane visible={activeTab === 'dates'}>
                {/* Overdue Items */}
                {(data.overdueItems || []).length > 0 && (
                  <CCard
                    className="border-0 mb-4 border-start border-danger border-4"
                    style={{ borderRadius: '12px' }}
                  >
                    <CCardHeader className="bg-danger bg-opacity-10 border-0 fw-bold text-danger">
                      <CIcon icon={cilWarning} className="me-2" />
                      Overdue Items ({data.overdueItems.length})
                    </CCardHeader>
                    <CCardBody className="p-0">
                      <CTable hover responsive align="middle" className="mb-0">
                        <CTableHead color="light">
                          <CTableRow>
                            <CTableHeaderCell>Assignee</CTableHeaderCell>
                            <CTableHeaderCell>Service</CTableHeaderCell>
                            <CTableHeaderCell>Type</CTableHeaderCell>
                            <CTableHeaderCell>Deadline</CTableHeaderCell>
                            <CTableHeaderCell>Overdue</CTableHeaderCell>
                            <CTableHeaderCell></CTableHeaderCell>
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {data.overdueItems.map((item, i) => (
                            <CTableRow key={i}>
                              <CTableDataCell className="fw-medium">
                                {item.assigneeName}
                              </CTableDataCell>
                              <CTableDataCell>{item.service}</CTableDataCell>
                              <CTableDataCell>{item.deadlineType}</CTableDataCell>
                              <CTableDataCell>{fmt(item.deadline)}</CTableDataCell>
                              <CTableDataCell>
                                <CBadge color="danger" shape="rounded-pill">
                                  {item.overdueDays}d overdue
                                </CBadge>
                              </CTableDataCell>
                              <CTableDataCell>
                                <CButton
                                  size="sm"
                                  color="primary"
                                  variant="ghost"
                                  onClick={() => navigate(`/cases/${item.caseId}`)}
                                >
                                  <CIcon icon={cilArrowRight} />
                                </CButton>
                              </CTableDataCell>
                            </CTableRow>
                          ))}
                        </CTableBody>
                      </CTable>
                    </CCardBody>
                  </CCard>
                )}

                {/* Upcoming Deadlines */}
                <CCard className="border-0 mb-4" style={{ borderRadius: '12px' }}>
                  <CCardHeader className="bg-transparent border-0 fw-bold">
                    <CIcon icon={cilCalendar} className="me-2" style={{ color: '#f59e0b' }} />
                    Upcoming Deadlines (Next 30 Days)
                  </CCardHeader>
                  <CCardBody className="p-0">
                    {(data.upcomingDeadlines || []).length > 0 ? (
                      <CTable hover responsive align="middle" className="mb-0">
                        <CTableHead color="light">
                          <CTableRow>
                            <CTableHeaderCell>Assignee</CTableHeaderCell>
                            <CTableHeaderCell>Service</CTableHeaderCell>
                            <CTableHeaderCell>Type</CTableHeaderCell>
                            <CTableHeaderCell>Deadline</CTableHeaderCell>
                            <CTableHeaderCell>Remaining</CTableHeaderCell>
                            <CTableHeaderCell></CTableHeaderCell>
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {data.upcomingDeadlines.map((item, i) => (
                            <CTableRow key={i}>
                              <CTableDataCell className="fw-medium">
                                {item.assigneeName}
                              </CTableDataCell>
                              <CTableDataCell>{item.service}</CTableDataCell>
                              <CTableDataCell>{item.deadlineType}</CTableDataCell>
                              <CTableDataCell>{fmt(item.deadline)}</CTableDataCell>
                              <CTableDataCell>
                                <DeadlineBadge days={item.daysRemaining} />
                              </CTableDataCell>
                              <CTableDataCell>
                                <CButton
                                  size="sm"
                                  color="primary"
                                  variant="ghost"
                                  onClick={() => navigate(`/cases/${item.caseId}`)}
                                >
                                  <CIcon icon={cilArrowRight} />
                                </CButton>
                              </CTableDataCell>
                            </CTableRow>
                          ))}
                        </CTableBody>
                      </CTable>
                    ) : (
                      <div className="text-center text-muted py-4">No upcoming deadlines</div>
                    )}
                  </CCardBody>
                </CCard>

                {/* All Service Dates */}
                <CCard className="border-0" style={{ borderRadius: '12px' }}>
                  <CCardHeader className="bg-transparent border-0 fw-bold">
                    <CIcon icon={cilClock} className="me-2" style={{ color: '#6366f1' }} />
                    All Service Date Tracking
                  </CCardHeader>
                  <CCardBody className="p-0">
                    {(data.serviceTrackingEntries || []).length > 0 ? (
                      <CTable
                        hover
                        responsive
                        align="middle"
                        className="mb-0"
                        style={{ fontSize: '0.875rem' }}
                      >
                        <CTableHead color="light">
                          <CTableRow>
                            <CTableHeaderCell>Assignee</CTableHeaderCell>
                            <CTableHeaderCell>Service</CTableHeaderCell>
                            <CTableHeaderCell>Start Date</CTableHeaderCell>
                            <CTableHeaderCell>End Date</CTableHeaderCell>
                            <CTableHeaderCell>Case Status</CTableHeaderCell>
                            <CTableHeaderCell>Details</CTableHeaderCell>
                            <CTableHeaderCell></CTableHeaderCell>
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {data.serviceTrackingEntries.map((entry, i) => (
                            <CTableRow key={i}>
                              <CTableDataCell className="fw-medium">
                                {entry.assigneeName}
                              </CTableDataCell>
                              <CTableDataCell>
                                <CBadge color="light" textColor="dark">
                                  {entry.service}
                                </CBadge>
                              </CTableDataCell>
                              <CTableDataCell>
                                {entry.startDate ? (
                                  <span className="text-success">{fmt(entry.startDate)}</span>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </CTableDataCell>
                              <CTableDataCell>
                                {entry.endDate ? (
                                  <span className="text-danger">{fmt(entry.endDate)}</span>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </CTableDataCell>
                              <CTableDataCell>
                                <CBadge
                                  color={
                                    entry.status === 'Completed'
                                      ? 'success'
                                      : entry.status === 'In Progress'
                                        ? 'warning'
                                        : entry.status === 'Cancelled'
                                          ? 'danger'
                                          : 'primary'
                                  }
                                >
                                  {entry.status}
                                </CBadge>
                              </CTableDataCell>
                              <CTableDataCell className="text-muted small">
                                {entry.details || '—'}
                              </CTableDataCell>
                              <CTableDataCell>
                                <CButton
                                  size="sm"
                                  color="primary"
                                  variant="ghost"
                                  onClick={() => navigate(`/cases/${entry.caseId}`)}
                                >
                                  <CIcon icon={cilArrowRight} />
                                </CButton>
                              </CTableDataCell>
                            </CTableRow>
                          ))}
                        </CTableBody>
                      </CTable>
                    ) : (
                      <div className="text-center text-muted py-4">
                        No service dates tracked yet
                      </div>
                    )}
                  </CCardBody>
                </CCard>
              </CTabPane>

              {/* ── WORKLOAD TAB (Admin only) ── */}
              {role === 'Admin' && (
                <CTabPane visible={activeTab === 'workload'}>
                  <CRow className="g-4">
                    <CCol md={8}>
                      <CCard className="border-0 bg-light" style={{ borderRadius: '12px' }}>
                        <CCardHeader className="bg-transparent border-0 fw-bold">
                          <CIcon icon={cilPeople} className="me-2" />
                          Case Manager Workload
                        </CCardHeader>
                        <CCardBody className="p-0">
                          {(data.caseManagerWorkload || []).length > 0 ? (
                            <CTable hover responsive align="middle" className="mb-0">
                              <CTableHead color="light">
                                <CTableRow>
                                  <CTableHeaderCell>Manager</CTableHeaderCell>
                                  <CTableHeaderCell>Total</CTableHeaderCell>
                                  <CTableHeaderCell>Active</CTableHeaderCell>
                                  <CTableHeaderCell>Completed</CTableHeaderCell>
                                  <CTableHeaderCell>Workload</CTableHeaderCell>
                                </CTableRow>
                              </CTableHead>
                              <CTableBody>
                                {data.caseManagerWorkload.map((cm, i) => (
                                  <CTableRow key={i}>
                                    <CTableDataCell className="fw-bold">
                                      {cm.managerName}
                                    </CTableDataCell>
                                    <CTableDataCell>
                                      <CBadge color="primary" shape="rounded-pill">
                                        {cm.total}
                                      </CBadge>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                      <CBadge color="warning" shape="rounded-pill">
                                        {cm.inProgress + cm.initiated}
                                      </CBadge>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                      <CBadge color="success" shape="rounded-pill">
                                        {cm.completed}
                                      </CBadge>
                                    </CTableDataCell>
                                    <CTableDataCell style={{ minWidth: 140 }}>
                                      <CProgress thin>
                                        <CProgressBar
                                          value={cm.total > 0 ? (cm.completed / cm.total) * 100 : 0}
                                          color="success"
                                        />
                                      </CProgress>
                                      <small className="text-muted">
                                        {cm.total > 0
                                          ? Math.round((cm.completed / cm.total) * 100)
                                          : 0}
                                        % done
                                      </small>
                                    </CTableDataCell>
                                  </CTableRow>
                                ))}
                              </CTableBody>
                            </CTable>
                          ) : (
                            <div className="text-center text-muted py-4">
                              No case managers assigned yet
                            </div>
                          )}
                        </CCardBody>
                      </CCard>
                    </CCol>
                    <CCol md={4}>
                      <CCard className="border-0 bg-light" style={{ borderRadius: '12px' }}>
                        <CCardHeader className="bg-transparent border-0 fw-bold">
                          HR Initiations
                        </CCardHeader>
                        <CCardBody>
                          {(data.hrInitiationStats || []).map((hr, i) => (
                            <div
                              key={i}
                              className="d-flex justify-content-between align-items-center mb-3 p-2 bg-white rounded shadow-sm"
                            >
                              <div>
                                <div className="fw-bold small">{hr.hrName}</div>
                                <div className="text-muted" style={{ fontSize: 11 }}>
                                  {hr.hrRole}
                                </div>
                              </div>
                              <CBadge color="info" shape="rounded-pill">
                                {hr.total} cases
                              </CBadge>
                            </div>
                          ))}
                          {(!data.hrInitiationStats || data.hrInitiationStats.length === 0) && (
                            <p className="text-muted text-center small">No data</p>
                          )}
                        </CCardBody>
                      </CCard>
                    </CCol>
                  </CRow>
                </CTabPane>
              )}
            </CTabContent>
          </CCardBody>
        </CCard>
      </CCol>

      {/* Case Details Modal */}
      <CModal
        visible={!!selectedExpiryDetail}
        onClose={() => setSelectedExpiryDetail(null)}
        alignment="center"
      >
        <CModalHeader onClose={() => setSelectedExpiryDetail(null)}>
          <CModalTitle>Case Details - {selectedExpiryDetail?.service}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedExpiryDetail && (
            <div>
              <div className="mb-4">
                <div
                  className="small text-muted mb-1 text-uppercase fw-semibold"
                  style={{ letterSpacing: '0.5px' }}
                >
                  Employee Info
                </div>
                <div className="fw-bold" style={{ fontSize: '1.2rem', color: '#1e293b' }}>
                  {selectedExpiryDetail.assigneeName}
                  <CBadge color="secondary" className="ms-2 align-middle">
                    ID: {selectedExpiryDetail.empNumber}
                  </CBadge>
                </div>
                <div className="text-muted mt-1 small d-flex gap-3">
                  <span><strong>Billing Entity:</strong> {selectedExpiryDetail.billingEntity}</span>
                  <span><strong>Start Date:</strong> {fmt(selectedExpiryDetail.createdAt)}</span>
                </div>
              </div>
              <div className="mb-4">
                <div
                  className="small text-muted mb-1 text-uppercase fw-semibold"
                  style={{ letterSpacing: '0.5px' }}
                >
                  Management Team
                </div>
                <div className="d-flex justify-content-between border p-2 rounded bg-light">
                  <div>
                    <span className="text-muted small d-block">Case Manager</span>
                    <span className="fw-medium text-dark">
                      {selectedExpiryDetail.caseManagerName}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="text-muted small d-block">HR Info</span>
                    <span className="fw-medium text-dark">{selectedExpiryDetail.hrName}</span>
                  </div>
                </div>
              </div>
              <div className="mb-2">
                <div
                  className="small text-muted mb-1 text-uppercase fw-semibold"
                  style={{ letterSpacing: '0.5px' }}
                >
                  Expiry Information
                </div>
                <div
                  className="border border-danger p-3 rounded"
                  style={{ backgroundColor: '#fff5f5' }}
                >
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Document/Type:</span>
                    <span className="fw-bold">{selectedExpiryDetail.expiryType}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Expiry Date:</span>
                    <span className="text-danger fw-bold fs-5 px-2 py-1 bg-danger bg-opacity-10 rounded border border-danger">
                      🚨 {fmt(selectedExpiryDetail.expiryDate)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Case Status:</span>
                    <CBadge
                      color={
                        selectedExpiryDetail.status === 'Completed'
                          ? 'success'
                          : selectedExpiryDetail.status === 'Cancelled'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {selectedExpiryDetail.status}
                    </CBadge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CModalBody>
        <CModalFooter className="border-0">
          <CButton color="light" onClick={() => setSelectedExpiryDetail(null)}>
            Close
          </CButton>
          <CButton
            color="primary"
            onClick={() => navigate(`/cases/${selectedExpiryDetail?.caseId}`)}
          >
            View Full Case
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Export Report Modal */}
      <CModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        alignment="center"
      >
        <CModalHeader onClose={() => setShowExportModal(false)}>
          <CModalTitle>Download Service Report</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3 text-muted small">
            Select the services you want to include in the report. Only cases matching these
            services will be exported.
          </div>
          <div className="mb-3 p-2 bg-light rounded border">
            <CFormCheck
              id="selectAllServices"
              label={<span className="fw-bold">Select All Services</span>}
              checked={exportServices.length === ALL_SERVICES.length}
              onChange={handleExportSelectAll}
            />
          </div>
          <CRow className="g-2">
            {ALL_SERVICES.map((svc) => (
              <CCol xs={6} key={svc.key}>
                <CFormCheck
                  id={`export-${svc.key}`}
                  label={svc.label}
                  checked={exportServices.includes(svc.key)}
                  onChange={() => handleExportCheckbox(svc.key)}
                />
              </CCol>
            ))}
          </CRow>
        </CModalBody>
        <CModalFooter className="border-0">
          <CButton color="light" onClick={() => setShowExportModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={generateReport} disabled={exportServices.length === 0}>
            Download Report
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default CaseAnalytics
