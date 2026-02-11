import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CModalFooter,
  CFormInput,
  CRow,
  CFormSelect,
  CForm,
  CFormLabel,
  CFormTextarea,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CCollapse,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCheckCircle,
  cilClock,
  cilWarning,
  cilList,
  cilImage,
  cilDescription,
  cilPencil,
  cilTrash,
  cilUser,
  cilOptions,
  cilSettings,
  cilTask,
  cilDrop,
  cilBrush,
  cilBolt,
  cilPlus,
  cilCloudDownload,
  cilChartPie,
} from '@coreui/icons'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import UserService from '../../services/userService'
import { CChartDoughnut, CChartBar } from '@coreui/react-chartjs'

const MySwal = withReactContent(Swal)

import TicketService from '../../services/ticketService'
import { authService } from '../../services/authService'

const TicketAnalytics = () => {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    others: 0,
  })

  // Filter State
  const [filterStatus, setFilterStatus] = useState('All')

  const filteredTickets =
    filterStatus === 'All' ? tickets : tickets.filter((t) => t.status === filterStatus)

  // Modal State
  const [currentTicketNotes, setCurrentTicketNotes] = useState([])
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [noteText, setNoteText] = useState('')

  // Unified Details Modal State
  const [contentModalVisible, setContentModalVisible] = useState(false)
  const [selectedTicketContent, setSelectedTicketContent] = useState(null)

  // Assign Modal State
  const [assignVisible, setAssignVisible] = useState(false)
  const [operators, setOperators] = useState([])
  const [selectedOperatorId, setSelectedOperatorId] = useState('')
  const [assignTicketId, setAssignTicketId] = useState(null)

  const [userRole, setUserRole] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)

  // Timeline Details State
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [selectedTicketForDetails, setSelectedTicketForDetails] = useState(null)

  const openDetailsModal = (ticket) => {
    setSelectedTicketForDetails(ticket)
    setDetailsVisible(true)
  }

  // Edit Modal State
  const [editVisible, setEditVisible] = useState(false)
  const [editingTicket, setEditingTicket] = useState(null)
  const [formData, setFormData] = useState({ service: '', description: '' })

  // Chart Toggle State
  const [showCharts, setShowCharts] = useState(false)
  const chartsRef = useRef(null)

  const toggleCharts = () => {
    setShowCharts(!showCharts)
  }

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await TicketService.getTickets()
        const data = response.data
        setTickets(data)

        // Calculate Stats
        // Calculate Stats (Case Insensitive & Comprehensive)
        const pendingCount = data.filter((t) => t.status?.toLowerCase() === 'pending').length
        const inProgressCount = data.filter(
          (t) =>
            t.status?.toLowerCase() === 'in progress' || t.status?.toLowerCase() === 'inprogress',
        ).length
        const completedCount = data.filter((t) => t.status?.toLowerCase() === 'completed').length
        const othersCount = data.length - (pendingCount + inProgressCount + completedCount)

        const counts = {
          total: data.length,
          pending: pendingCount,
          inProgress: inProgressCount,
          completed: completedCount,
          others: othersCount,
        }
        setStats(counts)
      } catch (error) {
        console.error('Error fetching tickets for dashboard', error)
      }
    }

    fetchTickets()

    const user = authService.getCurrentUser()
    if (user) {
      setUserRole(user.role)
      setCurrentUserId(user.id)

      if (user.role === 'Admin') {
        UserService.getUsers()
          .then((res) => {
            const ops = res.data.filter((u) => u.role === 'Operator')
            setOperators(ops)
          })
          .catch((err) => console.log(err))
      }
    }
  }, [])

  const isExtended = (ticket) => {
    // Default 8 days. If diff > 8 days + buffer, it's extended.
    const created = new Date(ticket.createdAt)
    const expires = new Date(ticket.expiresAt)
    const diffTime = Math.abs(expires - created)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    // Allow small buffer for execution time, say 8.1 days
    return diffDays > 9
  }

  const isResponded = (ticket) => {
    // Check if any note author is 'Admin' or 'Operator'
    if (!ticket.notes || ticket.notes.length === 0) return false
    return ticket.notes.some((n) => n.author === 'Admin' || n.author === 'Operator')
  }

  const getBadgeClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'badge-soft-success'
      case 'In Progress':
        return 'badge-soft-warning'
      case 'Pending':
        return 'badge-soft-danger'
      default:
        return 'badge-soft-secondary'
    }
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(/[\s@.]/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getServiceIcon = (service) => {
    // Return icon based on service name (mock logic)
    if (!service) return cilSettings
    const s = service.toLowerCase()
    if (s.includes('plumb')) return cilDrop
    if (s.includes('elect')) return cilBolt // Changed to Bolt (standard free icon)
    if (s.includes('paint')) return cilBrush // Changed to Brush (standard free icon)
    return cilTask
  }

  // --- Handlers ---

  const handleStatusChange = (id, newStatus) => {
    TicketService.updateTicketStatus(id, newStatus)
      .then(() => {
        // Refresh tickets
        const fetchTickets = async () => {
          const response = await TicketService.getTickets()
          setTickets(response.data)
          // Re-calc stats locally for speed
          const data = response.data
          const counts = {
            total: data.length,
            pending: data.filter((t) => t.status === 'Pending').length,
            inProgress: data.filter((t) => t.status === 'In Progress').length,
            completed: data.filter((t) => t.status === 'Completed').length,
          }
          setStats(counts)
        }
        fetchTickets()
        toast.success(`Ticket status updated to ${newStatus}`)
      })
      .catch((e) => {
        console.log(e)
      })
  }

  const retrieveTickets = async () => {
    try {
      const response = await TicketService.getTickets()
      const data = response.data
      setTickets(data)

      // Calculate Stats (Case Insensitive & Comprehensive)
      const pendingCount = data.filter((t) => t.status?.toLowerCase() === 'pending').length
      const inProgressCount = data.filter(
        (t) =>
          t.status?.toLowerCase() === 'in progress' || t.status?.toLowerCase() === 'inprogress',
      ).length
      const completedCount = data.filter((t) => t.status?.toLowerCase() === 'completed').length
      const othersCount = data.length - (pendingCount + inProgressCount + completedCount)

      const counts = {
        total: data.length,
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
        others: othersCount,
      }
      setStats(counts)
      toast.success('Dashboard data refreshed successfully')
    } catch (error) {
      console.error('Error fetching tickets', error)
      toast.error('Failed to refresh data')
    }
  }

  const handleDelete = (id) => {
    MySwal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e55353',
      cancelButtonColor: '#secondary',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        TicketService.deleteTicket(id)
          .then(() => {
            retrieveTickets()
            toast.success('Ticket deleted successfully')
          })
          .catch((e) => {
            console.log(e)
            toast.error('Failed to delete ticket')
          })
      }
    })
  }

  const openAssignModal = (ticket) => {
    setAssignTicketId(ticket.id)
    setSelectedOperatorId(ticket.assignedTo || '')
    setAssignVisible(true)
  }

  const handleAssignSubmit = () => {
    if (!selectedOperatorId) {
      toast.error('Please select an operator')
      return
    }
    const operator = operators.find((o) => String(o.id || o._id) === String(selectedOperatorId))
    const operatorName = operator ? operator.username : ''

    TicketService.assignTicket(assignTicketId, selectedOperatorId, operatorName)
      .then(() => {
        setAssignVisible(false)
        retrieveTickets()
        toast.success(`Ticket assigned to ${operatorName}`)
      })
      .catch((e) => {
        console.log(e)
        toast.error('Failed to assign ticket')
      })
  }

  // Notes
  const openContentModal = (ticket) => {
    setSelectedTicketId(ticket.id)
    setSelectedTicketContent(ticket)
    setCurrentTicketNotes(ticket.notes || [])
    setNoteText('')
    setContentModalVisible(true)
  }

  const handleAddNote = (e) => {
    e.preventDefault()
    if (!noteText.trim()) return

    TicketService.addNote(selectedTicketId, noteText)
      .then(() => {
        toast.success('Note added successfully')
        // Update local state properly
        const newNoteObj = {
          content: noteText,
          author: userRole === 'Admin' ? 'Admin' : 'You', // Simplified for immediate feedback
          timestamp: new Date().toISOString(),
        }
        setCurrentTicketNotes([...currentTicketNotes, newNoteObj])
      })
      .catch((e) => {
        console.log(e)
        toast.error('Failed to add note')
      })
  }

  const handleExtend = (id) => {
    MySwal.fire({
      title: 'Extend Ticket?',
      text: 'Select the number of days to extend:',
      icon: 'question',
      input: 'range',
      inputLabel: 'Days',
      inputAttributes: {
        min: 1,
        max: 30,
        step: 1,
      },
      inputValue: 8,
      showCancelButton: true,
      confirmButtonColor: '#f0ad4e',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, extend it!',
      didOpen: () => {
        const range = Swal.getInput()
        const output = document.createElement('output')
        output.style.display = 'block'
        output.style.marginTop = '10px'
        output.style.fontWeight = 'bold'
        output.textContent = range.value + ' Days'
        range.parentNode.insertBefore(output, range.nextSibling)
        range.addEventListener('input', () => {
          output.textContent = range.value + ' Days'
        })
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const days = result.value
        TicketService.extendTicket(id, days)
          .then(() => {
            retrieveTickets()
            toast.success(`Ticket extended by ${days} days`)
          })
          .catch((e) => {
            console.log(e)
            toast.error('Failed to extend ticket')
          })
      }
    })
  }

  const openEditModal = (ticket) => {
    setEditingTicket(ticket)
    setFormData({ service: ticket.service, description: ticket.description })
    setEditVisible(true)
  }

  const handleEditSubmit = () => {
    TicketService.updateTicket(editingTicket.id, formData)
      .then(() => {
        setEditVisible(false)
        retrieveTickets()
        toast.success('Ticket updated successfully')
      })
      .catch((e) => {
        console.log(e)
        toast.error('Failed to update ticket')
      })
  }

  // Advanced Analytics Calculations
  const getAnalyticsInsights = () => {
    // Response Rate - Tickets with Admin/Operator notes
    const respondedTickets = tickets.filter(
      (t) => t.notes && t.notes.some((n) => n.author === 'Admin' || n.author === 'Operator'),
    ).length
    const responseRate =
      tickets.length > 0 ? Math.round((respondedTickets / tickets.length) * 100) : 0

    // Extended Tickets
    const extendedCount = tickets.filter((t) => {
      const created = new Date(t.createdAt)
      const expires = new Date(t.expiresAt)
      const diffDays = Math.ceil(Math.abs(expires - created) / (1000 * 60 * 60 * 24))
      return diffDays > 9
    }).length

    // Average Resolution Time (for completed tickets)
    const completedTickets = tickets.filter((t) => t.status?.toLowerCase() === 'completed')
    let avgResolutionTime = 0
    if (completedTickets.length > 0) {
      const totalHours = completedTickets.reduce((sum, t) => {
        const created = new Date(t.createdAt)
        const updated = new Date(t.updatedAt)
        return sum + Math.abs(updated - created) / (1000 * 60 * 60)
      }, 0)
      avgResolutionTime = Math.round(totalHours / completedTickets.length)
    }

    // Unassigned Tickets
    const unassignedCount = tickets.filter(
      (t) => !t.assignedTo && t.status?.toLowerCase() !== 'completed',
    ).length

    // Top Services with counts
    const serviceCount = {}
    tickets.forEach((t) => {
      const service = t.service || 'Other'
      serviceCount[service] = (serviceCount[service] || 0) + 1
    })
    const sortedServices = Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)

    // Expiring Soon (within 3 days)
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const expiringSoon = tickets.filter((t) => {
      if (t.status?.toLowerCase() === 'completed') return false
      const expires = new Date(t.expiresAt)
      return expires <= threeDaysFromNow && expires >= now
    }).length

    // Overdue Tickets
    const overdueCount = tickets.filter((t) => {
      if (t.status?.toLowerCase() === 'completed') return false
      return new Date(t.expiresAt) < now
    }).length

    return {
      responseRate,
      respondedTickets,
      extendedCount,
      avgResolutionTime,
      unassignedCount,
      sortedServices,
      expiringSoon,
      overdueCount,
    }
  }
  const analyticsInsights = getAnalyticsInsights()

  // Chart Data Preparation - Service Health Matrix (Stacked Bar)
  const getServiceHealthData = () => {
    const serviceMap = {}
    tickets.forEach((t) => {
      const s = t.service || 'Other'
      if (!serviceMap[s]) serviceMap[s] = { Pending: 0, 'In Progress': 0, Completed: 0 }
      const status =
        t.status === 'Completed'
          ? 'Completed'
          : t.status === 'In Progress'
            ? 'In Progress'
            : 'Pending'
      serviceMap[s][status]++
    })

    const labels = Object.keys(serviceMap)
    return {
      labels,
      datasets: [
        {
          label: 'Pending',
          backgroundColor: '#ef4444',
          data: labels.map((l) => serviceMap[l].Pending),
          barPercentage: 0.6,
          borderRadius: 4,
        },
        {
          label: 'In Progress',
          backgroundColor: '#f59e0b',
          data: labels.map((l) => serviceMap[l]['In Progress']),
          barPercentage: 0.6,
          borderRadius: 4,
        },
        {
          label: 'Completed',
          backgroundColor: '#10b981',
          data: labels.map((l) => serviceMap[l].Completed),
          barPercentage: 0.6,
          borderRadius: 4,
        },
      ],
    }
  }
  const serviceHealthData = getServiceHealthData()

  // Chart Data - Assignment Distribution (Doughnut)
  const getAssignmentData = () => {
    const assigned = tickets.filter(
      (t) => t.assignedTo && t.status?.toLowerCase() !== 'completed',
    ).length
    const unassigned = tickets.filter(
      (t) => !t.assignedTo && t.status?.toLowerCase() !== 'completed',
    ).length
    const completed = tickets.filter((t) => t.status?.toLowerCase() === 'completed').length

    return {
      labels: ['Assigned', 'Unassigned', 'Completed'],
      datasets: [
        {
          backgroundColor: ['#3b82f6', '#f87171', '#10b981'],
          borderWidth: 0,
          hoverOffset: 8,
          data: [assigned, unassigned, completed],
        },
      ],
    }
  }
  const assignmentData = getAssignmentData()

  // Chart Data - Status Overview (Doughnut)
  const getStatusOverviewData = () => {
    return {
      labels: ['Pending', 'In Progress', 'Completed', 'Others'],
      datasets: [
        {
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#6b7280'],
          borderWidth: 0,
          hoverOffset: 8,
          data: [stats.pending, stats.inProgress, stats.completed, stats.others],
        },
      ],
    }
  }
  const statusOverviewData = getStatusOverviewData()

  // Chart Data - Operator Workload (Doughnut)
  // Chart Data - Operator Workload (Doughnut)
  const getOperatorWorkloadData = () => {
    const operatorMap = {}
    let unassignedCount = 0

    tickets.forEach((t) => {
      // Include all tickets (active + completed) so all operators appear in the chart
      // if (t.status?.toLowerCase() === 'completed') return

      if (t.assignedToName) {
        operatorMap[t.assignedToName] = (operatorMap[t.assignedToName] || 0) + 1
      } else {
        unassignedCount++
      }
    })

    // Sort by count descending but do NOT slice to limit
    const sortedOperators = Object.entries(operatorMap).sort((a, b) => b[1] - a[1])

    const labels = sortedOperators.map(([name]) => name)
    const data = sortedOperators.map(([, count]) => count)

    if (unassignedCount > 0) {
      labels.push('Unassigned')
      data.push(unassignedCount)
    }

    // Extended color palette
    const baseColors = [
      '#3b82f6', // blue
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#14b8a6', // teal
      '#f97316', // orange
      '#ef4444', // red
      '#eab308', // yellow
      '#22c55e', // green
      '#6366f1', // indigo
      '#d946ef', // fuchsia
      '#06b6d4', // cyan
      '#f43f5e', // rose
      '#84cc16', // lime
      '#6b7280', // gray
      '#a855f7', // purple
      '#10b981', // emerald
    ]

    // Generate colors cycling through the base palette
    const backgroundColors = labels.map((_, index) => baseColors[index % baseColors.length])

    return {
      labels,
      datasets: [
        {
          backgroundColor: backgroundColors,
          borderWidth: 0,
          hoverOffset: 8,
          data,
        },
      ],
    }
  }
  const operatorWorkloadData = getOperatorWorkloadData()

  // Chart Data - Response Analysis (Doughnut)
  const getResponseData = () => {
    const responded = analyticsInsights.respondedTickets
    const notResponded = stats.total - responded

    return {
      labels: ['Responded', 'Awaiting Response'],
      datasets: [
        {
          backgroundColor: ['#818cf8', '#475569'],
          borderWidth: 0,
          hoverOffset: 8,
          data: [responded, notResponded],
        },
      ],
    }
  }
  const responseData = getResponseData()

  const handleExport = async () => {
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()

      // Sheet 1: Detailed Tickets
      const ticketRows = filteredTickets.map((t) => ({
        'Ticket ID': t.id,
        Service: t.service,
        Status: t.status,
        Description: t.description,
        User: t.userEmail,
        'Assigned To': t.assignedToName || 'Unassigned',
        'Login Time': t.userDetails?.lastLogin
          ? new Date(t.userDetails.lastLogin).toLocaleString()
          : 'N/A',
        'Ticket Create Time': new Date(t.createdAt).toLocaleString(),
        'Ticket Close Time':
          t.status === 'Completed' ? new Date(t.updatedAt).toLocaleString() : 'In Progress/Pending',
        'Last Update': new Date(t.updatedAt).toLocaleString(),
        'Expires At': t.expiresAt ? new Date(t.expiresAt).toLocaleDateString() : 'N/A',
        'Notes Count': t.notes?.length || 0,
        'Notes Content':
          t.notes && t.notes.length > 0
            ? t.notes
                .map((n) => `[${new Date(n.timestamp).toLocaleString()}] ${n.author}: ${n.content}`)
                .join('\n')
            : 'No notes',
      }))
      const wsTickets = XLSX.utils.json_to_sheet(ticketRows)
      XLSX.utils.book_append_sheet(wb, wsTickets, 'Tickets Details')

      // Sheet 2: Analytics Data
      // Status Data
      const statusRows = [
        ['Status Distribution'],
        ['Status', 'Count'],
        ['Pending', stats.pending],
        ['In Progress', stats.inProgress],
        ['Completed', stats.completed],
        ['Total', stats.total],
        [''], // Spacer
      ]

      // Service Data
      statusRows.push(['Service Distribution'])
      statusRows.push(['Service', 'Count'])
      analyticsInsights.sortedServices.forEach(([label, count]) => {
        statusRows.push([label, count])
      })
      statusRows.push([''])
      statusRows.push(['Analytics Insights'])
      statusRows.push(['Metric', 'Value'])
      statusRows.push(['Response Rate', `${analyticsInsights.responseRate}%`])
      statusRows.push(['Extended Tickets', analyticsInsights.extendedCount])
      statusRows.push(['Avg Resolution Time', `${analyticsInsights.avgResolutionTime} hours`])
      statusRows.push(['Unassigned Tickets', analyticsInsights.unassignedCount])
      statusRows.push(['Expiring Soon', analyticsInsights.expiringSoon])
      statusRows.push(['Overdue', analyticsInsights.overdueCount])

      const wsAnalytics = XLSX.utils.aoa_to_sheet(statusRows)
      // Set column widths for better readability
      wsAnalytics['!cols'] = [{ wch: 20 }, { wch: 10 }]

      XLSX.utils.book_append_sheet(wb, wsAnalytics, 'Analytics Overview')

      // Generate Filename
      const fileName = `Ticket_Report_${filterStatus}_${new Date().toISOString().split('T')[0]}.xlsx`

      XLSX.writeFile(wb, fileName)
      toast.success('Report downloaded successfully')
    } catch (error) {
      console.error('Export failed', error)
      toast.error('Failed to export report')
    }
  }

  return (
    <div className="container-fluid px-4 fade-in">
      {/* Used text-body to adapt to theme */}
      {/* Used text-body to adapt to theme */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Analytics Dashboard</h3>
        <div className="d-flex gap-2">
          <CButton
            color="info"
            variant="outline"
            className="rounded-pill px-4"
            onClick={toggleCharts}
          >
            <CIcon icon={cilChartPie} className="me-2" />
            {showCharts ? 'Hide Visuals' : 'Show Visuals'}
          </CButton>

          {userRole === 'Admin' && (
            <CButton
              color="success"
              className="rounded-pill px-4 text-white"
              onClick={handleExport}
            >
              <CIcon icon={cilCloudDownload} className="me-2" /> Export Report
            </CButton>
          )}
          {(userRole === 'End-User' || userRole === 'User') && (
            <CButton
              color="primary"
              className="rounded-pill px-4"
              onClick={() => navigate('/tickets/create')}
            >
              <CIcon icon={cilPlus} className="me-2" /> Create Ticket
            </CButton>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <CRow className="mb-4 g-3">
        <CCol sm={6} lg={3} onClick={() => setFilterStatus('All')} style={{ cursor: 'pointer' }}>
          <div
            className={`glass-card-stat stat-primary p-3 h-100 d-flex flex-column justify-content-between ${filterStatus === 'All' ? 'border border-2 border-primary' : ''}`}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <div>
                <p
                  className="text-uppercase fw-bold small mb-1 opacity-75"
                  style={{ fontSize: '0.75rem' }}
                >
                  Total Tickets
                </p>
                <h3 className="fw-bold mb-0 fs-3">{stats.total}</h3>
              </div>
              <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary">
                <CIcon icon={cilList} size="lg" />
              </div>
            </div>
            <div className="small opacity-75 mt-1" style={{ fontSize: '0.75rem' }}>
              All time tickets
            </div>
          </div>
        </CCol>
        <CCol
          sm={6}
          lg={3}
          onClick={() => setFilterStatus('Pending')}
          style={{ cursor: 'pointer' }}
        >
          <div
            className={`glass-card-stat stat-danger p-3 h-100 d-flex flex-column justify-content-between ${filterStatus === 'Pending' ? 'border border-2 border-danger' : ''}`}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <div>
                <p
                  className="text-uppercase fw-bold small mb-1 opacity-75"
                  style={{ fontSize: '0.75rem' }}
                >
                  Pending
                </p>
                <h3 className="fw-bold mb-0 fs-3">{stats.pending}</h3>
              </div>
              <div className="bg-danger bg-opacity-10 p-2 rounded-circle text-danger">
                <CIcon icon={cilWarning} size="lg" />
              </div>
            </div>
            <div className="small opacity-75 mt-1" style={{ fontSize: '0.75rem' }}>
              Requires attention
            </div>
          </div>
        </CCol>
        <CCol
          sm={6}
          lg={3}
          onClick={() => setFilterStatus('In Progress')}
          style={{ cursor: 'pointer' }}
        >
          <div
            className={`glass-card-stat stat-warning p-3 h-100 d-flex flex-column justify-content-between ${filterStatus === 'In Progress' ? 'border border-2 border-warning' : ''}`}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <div>
                <p
                  className="text-uppercase fw-bold small mb-1 opacity-75"
                  style={{ fontSize: '0.75rem' }}
                >
                  In Progress
                </p>
                <h3 className="fw-bold mb-0 fs-3">{stats.inProgress}</h3>
              </div>
              <div className="bg-warning bg-opacity-10 p-2 rounded-circle text-warning">
                <CIcon icon={cilClock} size="lg" />
              </div>
            </div>
            <div className="small opacity-75 mt-1" style={{ fontSize: '0.75rem' }}>
              Currently active
            </div>
          </div>
        </CCol>
        <CCol
          sm={6}
          lg={3}
          onClick={() => setFilterStatus('Completed')}
          style={{ cursor: 'pointer' }}
        >
          <div
            className={`glass-card-stat stat-success p-3 h-100 d-flex flex-column justify-content-between ${filterStatus === 'Completed' ? 'border border-2 border-success' : ''}`}
          >
            <div className="d-flex justify-content-between align-items-center mb-1">
              <div>
                <p
                  className="text-uppercase fw-bold small mb-1 opacity-75"
                  style={{ fontSize: '0.75rem' }}
                >
                  Completed
                </p>
                <h3 className="fw-bold mb-0 fs-3">{stats.completed}</h3>
              </div>
              <div className="bg-success bg-opacity-10 p-2 rounded-circle text-success">
                <CIcon icon={cilCheckCircle} size="lg" />
              </div>
            </div>
            <div className="small opacity-75 mt-1" style={{ fontSize: '0.75rem' }}>
              Successfully closed
            </div>
          </div>
        </CCol>
      </CRow>

      {/* Analytics Insights - Collapsible Cards */}
      <CCollapse visible={showCharts}>
        <div ref={chartsRef} className="mt-4 fade-in">
          <CRow className="g-3 mb-4">
            {/* Response Rate Card */}
            <CCol sm={6} lg={4}>
              <div
                className="h-100 p-4 border rounded-4 position-relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
                  borderColor: 'rgba(99, 102, 241, 0.2)',
                  boxShadow: '0 4px 24px rgba(99, 102, 241, 0.15)',
                  minHeight: '180px',
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p
                      className="text-uppercase fw-bold small mb-2 text-secondary"
                      style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}
                    >
                      Response Rate
                    </p>
                    <h2 className="fw-bold mb-1" style={{ color: '#818cf8', fontSize: '2.5rem' }}>
                      {analyticsInsights.responseRate}%
                    </h2>
                    <p className="small mb-0" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {analyticsInsights.respondedTickets} of {stats.total} tickets responded
                    </p>
                  </div>
                  {/* Circular Progress Indicator */}
                  <div className="position-relative" style={{ width: '70px', height: '70px' }}>
                    <svg
                      viewBox="0 0 36 36"
                      style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
                    >
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="rgba(99, 102, 241, 0.2)"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="3"
                        strokeDasharray={`${analyticsInsights.responseRate}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div
                      className="position-absolute"
                      style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                    >
                      <CIcon
                        icon={cilCheckCircle}
                        style={{ color: '#818cf8', width: '20px', height: '20px' }}
                      />
                    </div>
                  </div>
                </div>
                {/* Background Decoration */}
                <div
                  className="position-absolute"
                  style={{
                    right: '-30px',
                    bottom: '-30px',
                    width: '120px',
                    height: '120px',
                    background:
                      'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                  }}
                />
              </div>
            </CCol>

            {/* Extended Tickets Card */}
            <CCol sm={6} lg={4}>
              <div
                className="h-100 p-4 border rounded-4 position-relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, #1a1a2e, #1e2a3a)',
                  borderColor: 'rgba(245, 158, 11, 0.2)',
                  boxShadow: '0 4px 24px rgba(245, 158, 11, 0.12)',
                  minHeight: '180px',
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p
                      className="text-uppercase fw-bold small mb-2 text-secondary"
                      style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}
                    >
                      Extended Tickets
                    </p>
                    <h2 className="fw-bold mb-1" style={{ color: '#fbbf24', fontSize: '2.5rem' }}>
                      {analyticsInsights.extendedCount}
                    </h2>
                    <p className="small mb-0" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Deadline extended beyond initial period
                    </p>
                  </div>
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3"
                    style={{
                      width: '56px',
                      height: '56px',
                      background: 'rgba(245, 158, 11, 0.15)',
                    }}
                  >
                    <CIcon
                      icon={cilClock}
                      style={{ color: '#fbbf24', width: '28px', height: '28px' }}
                    />
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Extension ratio</span>
                    <span style={{ color: '#fbbf24' }}>
                      {stats.total > 0
                        ? Math.round((analyticsInsights.extendedCount / stats.total) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      borderRadius: '3px',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${stats.total > 0 ? (analyticsInsights.extendedCount / stats.total) * 100 : 0}%`,
                        background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                        borderRadius: '3px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            </CCol>

            {/* Avg Resolution Time Card */}
            <CCol sm={6} lg={4}>
              <div
                className="h-100 p-4 border rounded-4 position-relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, #1a1a2e, #1a2e2a)',
                  borderColor: 'rgba(16, 185, 129, 0.2)',
                  boxShadow: '0 4px 24px rgba(16, 185, 129, 0.12)',
                  minHeight: '180px',
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p
                      className="text-uppercase fw-bold small mb-2 text-secondary"
                      style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}
                    >
                      Avg Resolution Time
                    </p>
                    <div className="d-flex align-items-baseline gap-2">
                      <h2
                        className="fw-bold mb-0"
                        style={{
                          color: '#34d399',
                          fontSize: analyticsInsights.avgResolutionTime >= 24 ? '2rem' : '2.5rem',
                        }}
                      >
                        {analyticsInsights.avgResolutionTime >= 24
                          ? `${Math.floor(analyticsInsights.avgResolutionTime / 24)}d ${analyticsInsights.avgResolutionTime % 24}h`
                          : analyticsInsights.avgResolutionTime}
                      </h2>
                      <span style={{ color: '#34d399', fontSize: '1.2rem' }}>
                        {analyticsInsights.avgResolutionTime >= 24 ? '' : 'hours'}
                      </span>
                    </div>
                    <p className="small mb-0 mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Average time to complete tickets
                    </p>
                  </div>
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3"
                    style={{
                      width: '56px',
                      height: '56px',
                      background: 'rgba(16, 185, 129, 0.15)',
                    }}
                  >
                    <CIcon
                      icon={cilTask}
                      style={{ color: '#34d399', width: '28px', height: '28px' }}
                    />
                  </div>
                </div>
                {/* Stats Row */}
                <div className="d-flex gap-3 mt-3">
                  <div
                    className="px-3 py-2 rounded-3"
                    style={{ background: 'rgba(16, 185, 129, 0.1)' }}
                  >
                    <span className="small" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Completed:
                    </span>
                    <span className="fw-bold ms-2" style={{ color: '#34d399' }}>
                      {stats.completed}
                    </span>
                  </div>
                </div>
              </div>
            </CCol>

            {/* Unassigned Tickets Card */}
            <CCol sm={6} lg={4}>
              <div
                className="h-100 p-4 border rounded-4 position-relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, #1a1a2e, #252540)',
                  borderColor: 'rgba(156, 163, 175, 0.2)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                  minHeight: '180px',
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p
                      className="text-uppercase fw-bold small mb-2 text-secondary"
                      style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}
                    >
                      Unassigned Tickets
                    </p>
                    <h2
                      className="fw-bold mb-1"
                      style={{
                        color: analyticsInsights.unassignedCount > 0 ? '#f87171' : '#9ca3af',
                        fontSize: '2.5rem',
                      }}
                    >
                      {analyticsInsights.unassignedCount}
                    </h2>
                    <p className="small mb-0" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {analyticsInsights.unassignedCount > 0
                        ? 'Awaiting operator assignment'
                        : 'All tickets assigned'}
                    </p>
                  </div>
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3"
                    style={{
                      width: '56px',
                      height: '56px',
                      background:
                        analyticsInsights.unassignedCount > 0
                          ? 'rgba(248, 113, 113, 0.15)'
                          : 'rgba(156, 163, 175, 0.15)',
                    }}
                  >
                    <CIcon
                      icon={cilUser}
                      style={{
                        color: analyticsInsights.unassignedCount > 0 ? '#f87171' : '#9ca3af',
                        width: '28px',
                        height: '28px',
                      }}
                    />
                  </div>
                </div>
                {analyticsInsights.unassignedCount > 0 && (
                  <div
                    className="mt-3 px-3 py-2 rounded-3 d-inline-flex align-items-center gap-2"
                    style={{ background: 'rgba(248, 113, 113, 0.1)' }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#f87171',
                        animation: 'pulse 2s infinite',
                      }}
                    />
                    <span className="small" style={{ color: '#f87171' }}>
                      Needs attention
                    </span>
                  </div>
                )}
              </div>
            </CCol>

            {/* Top Services Card */}
            <CCol sm={6} lg={4}>
              <div
                className="h-100 p-4 border rounded-4 position-relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, #1a1a2e, #1e2640)',
                  borderColor: 'rgba(59, 130, 246, 0.2)',
                  boxShadow: '0 4px 24px rgba(59, 130, 246, 0.12)',
                  minHeight: '180px',
                }}
              >
                <p
                  className="text-uppercase fw-bold small mb-3 text-secondary"
                  style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}
                >
                  Top Services
                </p>
                <div className="d-flex flex-column gap-2">
                  {analyticsInsights.sortedServices.length > 0 ? (
                    analyticsInsights.sortedServices.map(([service, count], index) => {
                      const maxCount = analyticsInsights.sortedServices[0][1]
                      const percentage = (count / maxCount) * 100
                      const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']
                      return (
                        <div key={index} className="d-flex align-items-center gap-3">
                          <div
                            className="fw-bold"
                            style={{ color: colors[index], minWidth: '24px', fontSize: '0.85rem' }}
                          >
                            #{index + 1}
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between mb-1">
                              <span
                                className="small text-truncate"
                                style={{ color: 'rgba(255,255,255,0.8)', maxWidth: '120px' }}
                              >
                                {service}
                              </span>
                              <span className="small fw-bold" style={{ color: colors[index] }}>
                                {count}
                              </span>
                            </div>
                            <div
                              style={{
                                height: '4px',
                                background: 'rgba(59, 130, 246, 0.2)',
                                borderRadius: '2px',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${percentage}%`,
                                  background: colors[index],
                                  borderRadius: '2px',
                                  transition: 'width 0.5s ease',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="small text-secondary mb-0">No service data available</p>
                  )}
                </div>
              </div>
            </CCol>

            {/* Urgent Alerts Card */}
            <CCol sm={6} lg={4}>
              <div
                className="h-100 p-4 border rounded-4 position-relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, #1a1a2e, #2e1a1a)',
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                  boxShadow: '0 4px 24px rgba(239, 68, 68, 0.12)',
                  minHeight: '180px',
                }}
              >
                <p
                  className="text-uppercase fw-bold small mb-3 text-secondary"
                  style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}
                >
                  Urgent Alerts
                </p>
                <div className="d-flex flex-wrap gap-3">
                  {/* Expiring Soon */}
                  <div
                    className="flex-grow-1 p-3 rounded-3"
                    style={{
                      background: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid rgba(251, 191, 36, 0.2)',
                      minWidth: '100px',
                    }}
                  >
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <CIcon
                        icon={cilClock}
                        style={{ color: '#fbbf24', width: '16px', height: '16px' }}
                      />
                      <span className="small" style={{ color: '#fbbf24' }}>
                        Expiring Soon
                      </span>
                    </div>
                    <h4 className="fw-bold mb-0" style={{ color: '#fbbf24' }}>
                      {analyticsInsights.expiringSoon}
                    </h4>
                    <span className="small" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      within 3 days
                    </span>
                  </div>
                  {/* Overdue */}
                  <div
                    className="flex-grow-1 p-3 rounded-3"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      minWidth: '100px',
                    }}
                  >
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <CIcon
                        icon={cilWarning}
                        style={{ color: '#ef4444', width: '16px', height: '16px' }}
                      />
                      <span className="small" style={{ color: '#ef4444' }}>
                        Overdue
                      </span>
                    </div>
                    <h4 className="fw-bold mb-0" style={{ color: '#ef4444' }}>
                      {analyticsInsights.overdueCount}
                    </h4>
                    <span className="small" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      past deadline
                    </span>
                  </div>
                </div>
              </div>
            </CCol>
          </CRow>

          {/* Charts Row */}
          <CRow className="g-3">
            {/* Service Health Matrix - Stacked Bar Chart */}
            <CCol lg={6}>
              <div
                className="h-100 p-4 border rounded-4"
                style={{
                  background: 'linear-gradient(145deg, #1e1e2f, #252535)',
                  borderColor: 'rgba(255,255,255,0.05)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h6 className="fw-bold text-white mb-1" style={{ fontSize: '0.95rem' }}>
                      Service Health Matrix
                    </h6>
                    <p className="small text-secondary mb-0" style={{ fontSize: '0.75rem' }}>
                      Status breakdown by service category
                    </p>
                  </div>
                  <CIcon
                    icon={cilList}
                    className="text-secondary"
                    style={{ width: '20px', height: '20px' }}
                  />
                </div>
                <div style={{ height: '220px' }}>
                  <CChartBar
                    data={serviceHealthData}
                    options={{
                      maintainAspectRatio: false,
                      responsive: true,
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top',
                          align: 'end',
                          labels: {
                            color: '#9ca3af',
                            boxWidth: 10,
                            padding: 15,
                            font: { size: 11 },
                          },
                        },
                        tooltip: {
                          backgroundColor: 'rgba(17, 24, 39, 0.95)',
                          padding: 12,
                          cornerRadius: 8,
                          displayColors: true,
                          intersect: false,
                          mode: 'index',
                        },
                      },
                      scales: {
                        x: {
                          stacked: true,
                          grid: { display: false },
                          ticks: { color: '#9ca3af', font: { size: 11 } },
                        },
                        y: {
                          stacked: true,
                          grid: { color: 'rgba(255, 255, 255, 0.05)', borderDash: [4, 4] },
                          ticks: { color: '#9ca3af', stepSize: 1, padding: 8 },
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </CCol>

            {/* Status Overview - Doughnut Chart */}
            <CCol sm={6} lg={3}>
              <div
                className="h-100 p-4 border rounded-4"
                style={{
                  background: 'linear-gradient(145deg, #1e1e2f, #2e2535)',
                  borderColor: 'rgba(239, 68, 68, 0.15)',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.1)',
                }}
              >
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold text-white mb-0" style={{ fontSize: '0.9rem' }}>
                    Status Overview
                  </h6>
                  <CIcon
                    icon={cilChartPie}
                    className="text-secondary"
                    style={{ width: '18px', height: '18px' }}
                  />
                </div>

                {/* CHART CONTAINER FIXES:
        1. Height increased to '320px' (This allows the circle to grow)
        2. 'justify-content-center' centers it horizontally
        3. Removed manual margin-top (align-items-center handles vertical centering)
    */}
                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{
                    height: '320px',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <CChartDoughnut
                      data={statusOverviewData}
                      style={{ height: '200px', width: '200px', transform: 'translate(5%, 20%)' }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false, // Essential for custom heights
                        cutout: '65%',
                        plugins: {
                          legend: {
                            display: true,
                            position: 'bottom', // Chart.js shrinks the chart to fit this. See note below.
                            labels: {
                              color: '#9ca3af',
                              boxWidth: 10, // Smaller box to save space
                              padding: 8,
                              font: { size: 14 },
                            },
                          },
                          tooltip: {
                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                            padding: 10,
                            cornerRadius: 6,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </CCol>

            {/* Operator Workload - Doughnut Chart */}
            <CCol sm={6} lg={3}>
              <div
                className="h-100 p-4 border rounded-4"
                style={{
                  background: 'linear-gradient(145deg, #1e1e2f, #1e3040)',
                  borderColor: 'rgba(59, 130, 246, 0.15)',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)',
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold text-white mb-0" style={{ fontSize: '0.9rem' }}>
                    Operator Workload
                  </h6>
                  <CIcon
                    icon={cilUser}
                    className="text-secondary"
                    style={{ width: '18px', height: '18px' }}
                  />
                </div>
                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{
                    height: '320px',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <CChartDoughnut
                      data={operatorWorkloadData}
                      style={{ height: '195px', width: '195px', transform: 'translate(5%, 20%)' }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '65%',
                        plugins: {
                          legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                              color: '#9ca3af',
                              boxWidth: 10,
                              padding: 8,
                              font: { size: 14 },
                            },
                          },
                          tooltip: {
                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                            padding: 10,
                            cornerRadius: 6,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </CCol>
          </CRow>
        </div>
      </CCollapse>

      <div className="dashboard-table-card p-0 mb-5 mt-4">
        <div className="p-4 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h4 className="fw-bold mb-1">Ticket Overview</h4>
            <p className="small mb-0 opacity-75">Detailed view of all system tickets and status.</p>
          </div>
          <CButton
            color="primary"
            className="d-flex align-items-center gap-2 rounded-pill px-4"
            onClick={retrieveTickets}
          >
            <CIcon icon={cilTask} /> Refresh Data
          </CButton>
        </div>

        <div>
          <table className="ticket-table align-middle">
            <thead>
              <tr>
                <th style={{ paddingLeft: '1.5rem' }}>Ticket & Service</th>
                <th>Created By</th>
                <th>Assigned Operator</th>
                <th>Status</th>
                <th>Timeline</th>
                <th className="text-center">Details</th>
                <th className="text-end" style={{ paddingRight: '1.5rem' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((item, index) => (
                <tr key={index}>
                  <td style={{ paddingLeft: '1.5rem' }}>
                    <div className="d-flex align-items-center">
                      <div className="ticket-service-icon">
                        <CIcon icon={getServiceIcon(item.service)} />
                      </div>
                      <div>
                        {/* removed text-dark to allow inheritance */}
                        <div className="fw-bold">{item.service}</div>
                        <div className="small opacity-75">ID: #{item.id}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="d-flex align-items-center">
                      <div
                        className="avatar-circle me-2"
                        style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}
                      >
                        {getInitials(item.userEmail)}
                      </div>
                      <div>
                        <div
                          className="fw-semibold text-truncate"
                          style={{ maxWidth: '150px' }}
                          title={item.userEmail}
                        >
                          {item.userEmail}
                        </div>
                        <div className="small opacity-75">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    {item.assignedToName ? (
                      <div className="d-flex align-items-center">
                        <div
                          className="avatar-circle me-2"
                          style={{
                            background: 'linear-gradient(135deg, #17ead9 0%, #6078ea 100%)',
                            width: '28px',
                            height: '28px',
                          }}
                        >
                          {getInitials(item.assignedToName)}
                        </div>
                        {/* removed text-dark */}
                        <span className="fw-medium">{item.assignedToName}</span>
                      </div>
                    ) : (
                      <span className="badge bg-secondary bg-opacity-10 text-secondary fw-normal px-3 py-1 rounded-pill">
                        Unassigned
                      </span>
                    )}
                  </td>

                  <td>
                    <CDropdown>
                      <CDropdownToggle
                        caret={false}
                        className={`border-0 p-0 badge-pill ${getBadgeClass(item.status)} text-decoration-none`}
                        disabled={
                          !(
                            userRole === 'Admin' ||
                            authService.getPermissions()['tickets']?.includes('action')
                          )
                        }
                        style={{
                          cursor:
                            userRole === 'Admin' ||
                            authService.getPermissions()['tickets']?.includes('action')
                              ? 'pointer'
                              : 'default',
                        }}
                      >
                        {item.status}
                      </CDropdownToggle>
                      {(userRole === 'Admin' ||
                        authService.getPermissions()['tickets']?.includes('action')) && (
                        <CDropdownMenu>
                          <CDropdownItem onClick={() => handleStatusChange(item.id, 'Pending')}>
                            Pending
                          </CDropdownItem>
                          <CDropdownItem onClick={() => handleStatusChange(item.id, 'In Progress')}>
                            In Progress
                          </CDropdownItem>
                          <CDropdownItem onClick={() => handleStatusChange(item.id, 'Completed')}>
                            Completed
                          </CDropdownItem>
                        </CDropdownMenu>
                      )}
                    </CDropdown>
                  </td>

                  <td>
                    <CButton
                      color="primary"
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetailsModal(item)}
                    >
                      Read More
                    </CButton>
                  </td>

                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <CButton
                        color="info"
                        variant="ghost"
                        size="sm"
                        onClick={() => openContentModal(item)}
                        title="View Details"
                      >
                        <CIcon icon={cilDescription} className="me-1" />
                        View Details
                      </CButton>
                    </div>
                  </td>

                  <td className="text-end" style={{ paddingRight: '1.5rem' }}>
                    {/* Actions Dropdown */}
                    <CDropdown alignment="end">
                      <CDropdownToggle
                        color="transparent"
                        size="sm"
                        className="btn-icon-soft text-secondary p-0 rotate-icon"
                      >
                        <CIcon icon={cilOptions} size="lg" className="rotate-90" />
                      </CDropdownToggle>
                      <CDropdownMenu>
                        {(userRole === 'Admin' ||
                          item.userId === currentUserId ||
                          authService.getPermissions()['tickets']?.includes('delete')) && (
                          <CDropdownItem
                            onClick={() => handleDelete(item.id)}
                            className="text-danger"
                          >
                            <CIcon icon={cilTrash} className="me-2" /> Delete Ticket
                          </CDropdownItem>
                        )}
                        {userRole === 'Admin' && (
                          <CDropdownItem onClick={() => openAssignModal(item)}>
                            <CIcon icon={cilUser} className="me-2" /> Assign Operator
                          </CDropdownItem>
                        )}
                        {/* <CDropdownItem
                          onClick={() => openContentModal(item)}
                          style={{ cursor: 'pointer' }}
                        >
                          <CIcon icon={cilDescription} className="me-2" /> View Details & Notes
                        </CDropdownItem> */}
                        {String(item.userId) === String(currentUserId) && (
                          <>
                            <CDropdownItem
                              onClick={() => openEditModal(item)}
                              style={{ cursor: 'pointer' }}
                            >
                              <CIcon icon={cilPencil} className="me-2" /> Edit Ticket
                            </CDropdownItem>
                            <CDropdownItem
                              onClick={() => handleExtend(item.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <CIcon icon={cilClock} className="me-2" /> Extend Expiry
                            </CDropdownItem>
                          </>
                        )}
                      </CDropdownMenu>
                    </CDropdown>
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <div className="mb-3">
                      <CIcon icon={cilList} size="4xl" className="text-light-emphasis" />
                    </div>
                    No tickets found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Content Modal */}
      <CModal
        visible={contentModalVisible}
        onClose={() => setContentModalVisible(false)}
        size="lg"
        alignment="center"
      >
        <CModalHeader onClose={() => setContentModalVisible(false)} className="bg-light">
          <CModalTitle className="fw-bold text-dark">
            Ticket Details #{selectedTicketContent?.id}
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="bg-light text-dark">
          {selectedTicketContent && (
            <div className="d-flex flex-column gap-4">
              {/* Description Section */}
              <div className="bg-white p-3 rounded-3 shadow-sm border">
                <h6 className="fw-bold mb-2">Description</h6>
                <p className="mb-0 text-black">{selectedTicketContent.description}</p>
              </div>

              {/* Image Section */}
              {selectedTicketContent.image && (
                <div className="bg-white p-3 rounded-3 shadow-sm border">
                  <h6 className="fw-bold mb-2">Attached Image</h6>
                  <div className="text-center bg-dark rounded p-2">
                    <img
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:5656/api'}/../${selectedTicketContent.image}`}
                      alt="Ticket Attachment"
                      className="img-fluid rounded"
                      style={{ maxHeight: '400px', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div>
                <h6 className="fw-bold mb-2">Notes & Updates</h6>
                <div
                  className="mb-3 d-flex flex-column gap-3"
                  style={{ maxHeight: '300px', overflowY: 'auto' }}
                >
                  {currentTicketNotes.length === 0 ? (
                    <div className="text-center py-4 text-secondary border rounded-3 bg-white">
                      No notes available yet.
                    </div>
                  ) : (
                    currentTicketNotes.map((note, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-3 shadow-sm border border-light"
                      >
                        <div className="d-flex justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="avatar-circle"
                              style={{ width: '24px', height: '24px', fontSize: '0.6rem' }}
                            >
                              {getInitials(note.author)}
                            </div>
                            <strong className="text-dark">{note.author}</strong>
                          </div>
                          <small className="text-secondary text-opacity-75">
                            {new Date(note.timestamp).toLocaleString()}
                          </small>
                        </div>
                        <p className="mb-0 text-dark">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Note Form */}
                {(userRole === 'Admin' || userRole === 'Operator') && (
                  <CForm
                    onSubmit={handleAddNote}
                    className="bg-white p-3 rounded-3 border text-dark"
                  >
                    <div className="mb-3">
                      <CFormLabel className="fw-bold small text-dark">Add New Note</CFormLabel>
                      <CFormTextarea
                        rows={2}
                        className="text-dark bg-white"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Type your note here..."
                        style={{ color: '#000' }}
                      />
                    </div>
                    <div className="d-flex justify-content-end">
                      <CButton
                        type="submit"
                        color="primary"
                        className="px-4 rounded-pill"
                        disabled={!noteText.trim()}
                      >
                        Post Note
                      </CButton>
                    </div>
                  </CForm>
                )}
              </div>
            </div>
          )}
        </CModalBody>
        <CModalFooter className="bg-light">
          <CButton color="secondary" onClick={() => setContentModalVisible(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Assign Modal */}
      <CModal visible={assignVisible} onClose={() => setAssignVisible(false)} alignment="center">
        <CModalHeader onClose={() => setAssignVisible(false)}>
          <CModalTitle>Assign Operator</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel className="fw-bold">Select Operator</CFormLabel>
              <CFormSelect
                size="lg"
                value={selectedOperatorId}
                onChange={(e) => setSelectedOperatorId(e.target.value)}
              >
                <option value="">Select an Operator</option>
                {operators.map((op) => (
                  <option key={op.id || op._id} value={op.id || op._id}>
                    {op.username}
                  </option>
                ))}
              </CFormSelect>
              <div className="form-text mt-2">
                The selected operator will be notified and assigned ownership of this ticket.
              </div>
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setAssignVisible(false)}>
            Cancel
          </CButton>
          <CButton color="primary" className="rounded-pill px-4" onClick={handleAssignSubmit}>
            Confirm Assignment
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Timeline Details Modal */}
      <CModal visible={detailsVisible} onClose={() => setDetailsVisible(false)} alignment="center">
        <CModalHeader onClose={() => setDetailsVisible(false)}>
          <CModalTitle>Timeline Details</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedTicketForDetails && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="fw-semibold">Login Time</span>
                <span className="text-secondary">
                  {selectedTicketForDetails.userDetails?.lastLogin
                    ? new Date(selectedTicketForDetails.userDetails.lastLogin).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="fw-semibold">Ticket Create Time</span>
                <span className="text-secondary">
                  {new Date(selectedTicketForDetails.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="fw-semibold">Ticket Close Time</span>
                <span className="text-secondary">
                  {selectedTicketForDetails.status === 'Completed'
                    ? new Date(selectedTicketForDetails.updatedAt).toLocaleString()
                    : 'In Progress/Pending'}
                </span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="fw-semibold">Last Update</span>
                <span className="text-secondary">
                  {new Date(selectedTicketForDetails.updatedAt).toLocaleString()}
                </span>
              </div>
              <div className="d-flex justify-content-between pb-2">
                <span className="fw-semibold">Expires At</span>
                <span className="text-primary">
                  {selectedTicketForDetails.expiresAt
                    ? new Date(selectedTicketForDetails.expiresAt).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDetailsVisible(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Edit Modal */}
      <CModal visible={editVisible} onClose={() => setEditVisible(false)}>
        <CModalHeader onClose={() => setEditVisible(false)}>
          <CModalTitle>Edit Ticket</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel>Service</CFormLabel>
              <CFormSelect
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                options={['Plumbing', 'Electrical', 'Carpentry', 'Gas', 'Others']}
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Description</CFormLabel>
              <CFormTextarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setEditVisible(false)}>
            Close
          </CButton>
          <CButton color="primary" onClick={handleEditSubmit}>
            Save changes
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default TicketAnalytics
