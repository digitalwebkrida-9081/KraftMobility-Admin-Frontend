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
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
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
  cilX,
  cilStar,
} from '@coreui/icons'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import UserService from '../../services/userService'
import { CChartDoughnut, CChartBar } from '@coreui/react-chartjs'

const MySwal = withReactContent(Swal)

import TicketService from '../../services/ticketService'
import { authService } from '../../services/authService'
import RatingModal from '../../components/RatingModal'
import RatingService from '../../services/ratingService'

import { hasPermission } from '../../utils/rolePermissions'

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
  const [selectedTicketRating, setSelectedTicketRating] = useState(null)

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

  // Rating State
  const [ratingModalVisible, setRatingModalVisible] = useState(false)
  const [ratingTicketId, setRatingTicketId] = useState(null)
  const [ratedTicketIds, setRatedTicketIds] = useState(new Set())

  // Chart Toggle State
  const [showCharts, setShowCharts] = useState(false)
  const chartsRef = useRef(null)

  // Tabs State
  const [activeKey, setActiveKey] = useState('overview')

  // Review Analysis State
  const [allRatings, setAllRatings] = useState([])
  const [reviewFilters, setReviewFilters] = useState({
    city: '',
    operator: '',
    startDate: '',
    endDate: '',
  })

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
        // Check which completed tickets are already rated
        checkRatedTickets(data)
      } catch (error) {
        console.error('Error fetching tickets for dashboard', error)
      }
    }

    fetchTickets()

    const user = authService.getCurrentUser()
    if (user) {
      setUserRole(user.role)
      setCurrentUserId(user.id)

      if (user.role === 'Admin' || user.role === 'HR') {
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

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'success'
    if (rating === 3) return 'warning'
    return 'danger'
  }

  const getDetailedRatingColor = (rating) => {
    switch (rating) {
      case 1:
        return '#ef4444' // Red
      case 2:
        return '#f97316' // Orange
      case 3:
        return '#eab308' // Yellow
      case 4:
        return '#84cc16' // Lime
      case 5:
        return '#22c55e' // Green
      default:
        return '#eab308'
    }
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

  const retrieveTickets = async (showSuccessMessage = false) => {
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
      if (showSuccessMessage) {
        toast.success('Dashboard data refreshed successfully')
      }
      checkRatedTickets(data)
    } catch (error) {
      console.error('Error fetching tickets', error)
      toast.error('Failed to refresh data')
    }
  }

  const checkRatedTickets = async (ticketsToCheck) => {
    const user = authService.getCurrentUser()
    if (!user) return

    const completedTickets = ticketsToCheck.filter(
      (t) => t.status === 'Completed' && String(t.userId) === String(user.id),
    )

    // Optimization: If no completed tickets, skip
    if (completedTickets.length === 0) return

    const newRatedTicketIds = new Set(ratedTicketIds)
    let hasChanges = false

    // We need to check each completed ticket.
    // Ideally backend should return "isRated" flag, but for now we fetch.
    // To avoid N requests, we might want a "getRatingsForUser" endpoint later.
    // For now, parallel requests.
    try {
      const checks = await Promise.allSettled(
        completedTickets.map((t) => RatingService.getRatingByTicketId(t.id)),
      )

      checks.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value && result.value.data) {
          newRatedTicketIds.add(String(completedTickets[index].id))
          hasChanges = true
        }
      })

      if (hasChanges || newRatedTicketIds.size !== ratedTicketIds.size) {
        setRatedTicketIds(newRatedTicketIds)
      }
    } catch (err) {
      console.error('Error checking rated tickets', err)
    }
  }

  const openRatingModal = (ticketId) => {
    setRatingTicketId(String(ticketId))
    setRatingModalVisible(true)
  }

  const handleRatingSubmit = async (ticketId, rating, feedback) => {
    try {
      await RatingService.createRating(ticketId, rating, feedback)
      toast.success('Thank you for your rating!')
      setRatingModalVisible(false)
      setRatedTicketIds((prev) => {
        const newSet = new Set(prev)
        newSet.add(String(ticketId))
        return newSet
      })
      // Refresh to ensure everything aligns
      // retrieveTickets(false);
    } catch (error) {
      console.error(error)
      // Check for specific error message
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Failed to submit rating')
      }
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
    setSelectedTicketRating(null) // Reset rating
    setNoteText('')
    setContentModalVisible(true)

    // Fetch rating if ticket is completed
    if (ticket.status === 'Completed') {
      RatingService.getRatingByTicketId(ticket.id)
        .then((response) => {
          setSelectedTicketRating(response.data)
        })
        .catch((err) => {
          // Ignore 404 (not rated yet)
          if (err.response && err.response.status !== 404) {
            console.error('Error fetching rating', err)
          }
        })
    }
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

  // Chart Data - Review Analytics (Bar Chart)
  // Compute Rating Stats
  const [ratingStats, setRatingStats] = useState({
    average: 0,
    counts: [0, 0, 0, 0, 0], // 1 to 5 stars
    total: 0,
  })

  // Review Details Modal State
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await RatingService.getAllRatings()
        const ratings = response.data
        setAllRatings(ratings) // Store all ratings
        const counts = [0, 0, 0, 0, 0]
        let sum = 0
        ratings.forEach((r) => {
          if (r.rating >= 1 && r.rating <= 5) {
            counts[r.rating - 1]++
            sum += r.rating
          }
        })
        const average = ratings.length > 0 ? (sum / ratings.length).toFixed(1) : 0
        setRatingStats({
          average,
          counts,
          total: ratings.length,
        })
      } catch (error) {
        console.error('Error fetching ratings', error)
      }
    }
    fetchRatings()
  }, []) // Fetch once on mount, or could depend on tickets if we want real-time updates when a ticket is rated

  const getReviewAnalyticsData = () => {
    return {
      labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
      datasets: [
        {
          label: 'Reviews',
          backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'],
          data: ratingStats.counts,
          barPercentage: 0.6,
          borderRadius: 4,
        },
      ],
    }
  }
  const reviewAnalyticsData = getReviewAnalyticsData()

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
  // --- Review Analysis Logic ---
  const reviewDetails = allRatings.map((rating) => {
    const ticket = tickets.find((t) => String(t.id) === String(rating.ticketId))
    const user = ticket ? ticket.userDetails : null
    const operator = operators.find((op) => String(op.id || op._id) === String(ticket?.assignedTo))
    return {
      ...rating,
      ticketService: ticket?.service || 'Unknown',
      ticketDescription: ticket?.description || '',
      customerName: user?.username || ticket?.userEmail || 'Unknown',
      userEmail: ticket?.userEmail || user?.email || 'N/A', // Add userEmail
      userPhone: user?.phoneNumber || 'N/A', // Add userPhone
      customerCity: user?.location || user?.propertyAddress || 'Unknown',
      operatorName: ticket?.assignedToName || 'Unassigned',
      operatorId: ticket?.assignedTo || 'N/A', // Add operatorId
      operatorEmail: operator?.email || 'N/A',
      operatorPhone: operator?.phoneNumber || 'N/A',
      ticketId: rating.ticketId,
      ratingId: rating._id || rating.id,
      createdAt: rating.createdAt,
    }
  })

  // Filter Logic
  const filteredReviews = reviewDetails.filter((r) => {
    // City Filter
    if (
      reviewFilters.city &&
      !r.customerCity.toLowerCase().includes(reviewFilters.city.toLowerCase())
    ) {
      return false
    }
    // Operator Filter
    if (reviewFilters.operator && String(r.operatorId) !== String(reviewFilters.operator)) {
      return false
    }
    // Date Filter
    if (reviewFilters.startDate && new Date(r.createdAt) < new Date(reviewFilters.startDate)) {
      return false
    }
    if (reviewFilters.endDate) {
      const end = new Date(reviewFilters.endDate)
      end.setHours(23, 59, 59, 999)
      if (new Date(r.createdAt) > end) return false
    }
    return true
  })

  return (
    <div className="container-fluid px-4 fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-0">Analytics Dashboard</h3>
          <p className="text-secondary small mb-0">Detailed insights and performance metrics</p>
        </div>
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

      {/* Tabs Navigation */}
      {(userRole === 'Admin' || userRole === 'HR') && (
        <CNav variant="tabs" className="mb-4 border-bottom-0">
          <CNavItem>
            <CNavLink
              active={activeKey === 'overview'}
              onClick={() => setActiveKey('overview')}
              style={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              Overview
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink
              active={activeKey === 'reviews'}
              onClick={() => setActiveKey('reviews')}
              style={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              Review & Feedback Analysis
            </CNavLink>
          </CNavItem>
        </CNav>
      )}

      <CTabContent>
        {/* Overview Tab */}
        <CTabPane role="tabpanel" aria-labelledby="overview-tab" visible={activeKey === 'overview'}>
          {/* Stats Cards */}
          <CRow className="mb-4 g-3">
            <CCol
              sm={6}
              lg={3}
              onClick={() => setFilterStatus('All')}
              style={{ cursor: 'pointer' }}
            >
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
                        <h2
                          className="fw-bold mb-1"
                          style={{ color: '#818cf8', fontSize: '2.5rem' }}
                        >
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
                        <h2
                          className="fw-bold mb-1"
                          style={{ color: '#fbbf24', fontSize: '2.5rem' }}
                        >
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
                              fontSize:
                                analyticsInsights.avgResolutionTime >= 24 ? '2rem' : '2.5rem',
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
                                style={{
                                  color: colors[index],
                                  minWidth: '24px',
                                  fontSize: '0.85rem',
                                }}
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
                          style={{
                            height: '200px',
                            width: '200px',
                            transform: 'translate(5%, 20%)',
                          }}
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

                {/* Review Analytics - Bar Chart */}
                <CCol sm={6} lg={3}>
                  <div
                    className="h-100 p-4 border rounded-4 d-flex flex-column"
                    style={{
                      background: 'linear-gradient(145deg, #1e1e2f, #1e3040)',
                      borderColor: 'rgba(59, 130, 246, 0.15)',
                      boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold text-white mb-0" style={{ fontSize: '0.9rem' }}>
                        Review Analytics
                      </h6>
                      <div className="d-flex align-items-center gap-1">
                        <CIcon
                          icon={cilStar}
                          className="text-warning"
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span className="fw-bold text-white small">{ratingStats.average}</span>
                        <span className="text-secondary small">({ratingStats.total})</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                      <CChartBar
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                        }}
                        data={reviewAnalyticsData}
                        options={{
                          maintainAspectRatio: false,
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              backgroundColor: 'rgba(17, 24, 39, 0.95)',
                              padding: 10,
                              cornerRadius: 6,
                            },
                          },
                          scales: {
                            x: {
                              grid: { display: false },
                              ticks: { color: '#9ca3af', font: { size: 11 } },
                            },
                            y: {
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
              </CRow>
            </div>
          </CCollapse>

          <div className="dashboard-table-card p-0 mb-5 mt-4">
            <div className="p-4 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div>
                <h4 className="fw-bold mb-1">Ticket Overview</h4>
                <p className="small mb-0 opacity-75">
                  Detailed view of all system tickets and status.
                </p>
              </div>
              <CButton
                color="primary"
                className="d-flex align-items-center gap-2 rounded-pill px-4"
                onClick={() => retrieveTickets(true)}
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
                              <CDropdownItem
                                onClick={() => handleStatusChange(item.id, 'In Progress')}
                              >
                                In Progress
                              </CDropdownItem>
                              <CDropdownItem
                                onClick={() => handleStatusChange(item.id, 'Completed')}
                              >
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

                          {/* Rating Button */}
                          {(() => {
                            const isCompleted = item.status === 'Completed'
                            const isOwner = String(item.userId) === String(currentUserId)
                            // Ensure stringent ID check
                            const isNotRated = !ratedTicketIds.has(String(item.id))
                            const canRate = hasPermission(userRole, 'canRateTicket')

                            // Debug log to console if needed
                            // console.log(`ID:${item.id} C:${isCompleted} O:${isOwner} R:${isNotRated}`);

                            if (isCompleted && isOwner && isNotRated && canRate) {
                              return (
                                <CButton
                                  color="warning"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRatingModal(item.id)}
                                  title="Rate Service"
                                >
                                  <CIcon icon={cilStar} className="me-1" /> Rate
                                </CButton>
                              )
                            }
                            return null
                          })()}
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
        </CTabPane>

        {/* Review Analysis Tab */}
        <CTabPane role="tabpanel" aria-labelledby="reviews-tab" visible={activeKey === 'reviews'}>
          <CCard className="mb-4 border-0 shadow-sm" style={{ background: '#1e2330' }}>
            <CCardBody>
              <h5 className="mb-4 text-white">Review Analysis Filters</h5>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel className="text-secondary small">City</CFormLabel>
                  <CFormInput
                    placeholder="Search by City"
                    value={reviewFilters.city}
                    onChange={(e) => setReviewFilters({ ...reviewFilters, city: e.target.value })}
                    style={{ background: '#1a1f2e', color: '#fff', border: '1px solid #374151' }}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel className="text-secondary small">Operator</CFormLabel>
                  <CFormSelect
                    aria-label="Filter by Operator"
                    value={reviewFilters.operator}
                    onChange={(e) =>
                      setReviewFilters({ ...reviewFilters, operator: e.target.value })
                    }
                    style={{ background: '#1a1f2e', color: '#fff', border: '1px solid #374151' }}
                  >
                    <option value="">All Operators</option>
                    {operators.map((op) => (
                      <option key={op.id || op._id} value={op.id || op._id}>
                        {op.username}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel className="text-secondary small">Start Date</CFormLabel>
                  <CFormInput
                    type="date"
                    value={reviewFilters.startDate}
                    onChange={(e) =>
                      setReviewFilters({ ...reviewFilters, startDate: e.target.value })
                    }
                    style={{ background: '#1a1f2e', color: '#fff', border: '1px solid #374151' }}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel className="text-secondary small">End Date</CFormLabel>
                  <CFormInput
                    type="date"
                    value={reviewFilters.endDate}
                    onChange={(e) =>
                      setReviewFilters({ ...reviewFilters, endDate: e.target.value })
                    }
                    style={{ background: '#1a1f2e', color: '#fff', border: '1px solid #374151' }}
                  />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          <CCard className="border-0 shadow-sm" style={{ background: '#1e2330' }}>
            <CCardBody>
              <h5 className="mb-4 text-white">Reviews ({filteredReviews.length})</h5>
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Submitted By</th>
                      <th>Assigned To</th>
                      <th>Rating</th>
                      <th>Feedback</th>
                      <th>Submitted On</th>
                      <th>City</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.length > 0 ? (
                      filteredReviews.map((review, idx) => (
                        <tr
                          key={idx}
                          onClick={() => {
                            setSelectedReview(review)
                            setReviewModalVisible(true)
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <span className="badge bg-secondary bg-opacity-25 text-info">
                              #{review.ticketId}
                            </span>
                            <div className="small text-muted">{review.ticketService}</div>
                          </td>
                          <td>
                            <div className="fw-bold">{review.customerName}</div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {review.operatorName !== 'Unassigned' && (
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    background: '#3b82f6',
                                    fontSize: '10px',
                                  }}
                                >
                                  {review.operatorName.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span>{review.operatorName}</span>
                            </div>
                          </td>
                          <td>
                            <div
                              className="d-flex align-items-center"
                              style={{ color: getDetailedRatingColor(review.rating) }}
                            >
                              <span className="fw-bold me-1">{review.rating}</span>
                              <CIcon icon={cilStar} size="sm" />
                            </div>
                          </td>
                          <td>
                            <div
                              className="text-truncate"
                              style={{ maxWidth: '250px' }}
                              title={review.feedback}
                            >
                              {review.feedback || (
                                <span className="text-muted fst-italic">No feedback provided</span>
                              )}
                            </div>
                          </td>
                          <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                          <td>{review.customerCity}</td>
                          <td>
                            <CButton
                              color="primary"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation() // Prevent row click
                                setSelectedReview(review)
                                setReviewModalVisible(true)
                              }}
                            >
                              <CIcon icon={cilOptions} /> View More
                            </CButton>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-5 text-muted">
                          No reviews found matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CCardBody>
          </CCard>
        </CTabPane>
      </CTabContent>

      {/* Unified Content Modal - Clean Dark */}
      <CModal
        visible={contentModalVisible}
        onClose={() => setContentModalVisible(false)}
        size="lg"
        alignment="center"
        className="modern-detail-modal"
      >
        <div
          style={{
            background: '#1e2330',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: '#252b3b',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '18px 22px',
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CIcon
                    icon={cilDescription}
                    style={{ color: '#fff', width: '18px', height: '18px' }}
                  />
                </div>
                <div>
                  <h5 className="fw-bold mb-0" style={{ color: '#f0f0f0', fontSize: '1.05rem' }}>
                    Ticket Details
                  </h5>
                  <span style={{ color: '#8892a4', fontSize: '0.8rem' }}>
                    #{selectedTicketContent?.id} • {selectedTicketContent?.service}
                  </span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                {selectedTicketContent && (
                  <span
                    className="px-3 py-1 rounded-pill fw-semibold"
                    style={{
                      fontSize: '0.72rem',
                      background:
                        selectedTicketContent.status === 'Completed'
                          ? 'rgba(34,197,94,0.12)'
                          : selectedTicketContent.status === 'In Progress'
                            ? 'rgba(234,179,8,0.12)'
                            : 'rgba(239,68,68,0.12)',
                      color:
                        selectedTicketContent.status === 'Completed'
                          ? '#4ade80'
                          : selectedTicketContent.status === 'In Progress'
                            ? '#facc15'
                            : '#f87171',
                      border: `1px solid ${selectedTicketContent.status === 'Completed' ? 'rgba(34,197,94,0.2)' : selectedTicketContent.status === 'In Progress' ? 'rgba(234,179,8,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    }}
                  >
                    {selectedTicketContent.status}
                  </span>
                )}
                <button
                  onClick={() => setContentModalVisible(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#8892a4',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.color = '#ccc'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#8892a4'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 22px', maxHeight: '65vh', overflowY: 'auto' }}>
            {selectedTicketContent && (
              <div className="d-flex flex-column" style={{ gap: '16px' }}>
                {/* Description */}
                <div
                  style={{
                    background: '#252b3b',
                    borderRadius: '8px',
                    padding: '16px 18px',
                    borderLeft: '3px solid #3b82f6',
                  }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <CIcon
                      icon={cilDescription}
                      style={{ color: '#8892a4', width: '15px', height: '15px' }}
                    />
                    <h6
                      className="fw-semibold mb-0"
                      style={{ color: '#cdd3e0', fontSize: '0.85rem' }}
                    >
                      Description
                    </h6>
                  </div>
                  <p
                    className="mb-0"
                    style={{ color: '#9aa1b3', fontSize: '0.9rem', lineHeight: '1.65' }}
                  >
                    {selectedTicketContent.description}
                  </p>
                </div>

                {/* Image */}
                {selectedTicketContent.image && (
                  <div
                    style={{
                      background: '#252b3b',
                      borderRadius: '8px',
                      padding: '16px 18px',
                    }}
                  >
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <CIcon
                        icon={cilImage}
                        style={{ color: '#8892a4', width: '15px', height: '15px' }}
                      />
                      <h6
                        className="fw-semibold mb-0"
                        style={{ color: '#cdd3e0', fontSize: '0.85rem' }}
                      >
                        Attachment
                      </h6>
                    </div>
                    <div
                      className="text-center rounded-2 p-3"
                      style={{
                        background: '#1a1f2e',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <img
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5656/api'}/../${selectedTicketContent.image}`}
                        alt="Ticket Attachment"
                        className="img-fluid rounded-2"
                        style={{ maxHeight: '350px', objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                )}

                {/* Rating */}
                {selectedTicketRating && hasPermission(userRole, 'canViewRatings') && (
                  <div
                    style={{
                      background: '#252b3b',
                      borderRadius: '8px',
                      padding: '16px 18px',
                      borderLeft: '3px solid #eab308',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <CIcon
                          icon={cilStar}
                          style={{ color: '#facc15', width: '15px', height: '15px' }}
                        />
                        <h6
                          className="fw-semibold mb-0"
                          style={{ color: '#cdd3e0', fontSize: '0.85rem' }}
                        >
                          User Rating
                        </h6>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            style={{
                              color:
                                star <= selectedTicketRating.rating
                                  ? getDetailedRatingColor(selectedTicketRating.rating)
                                  : 'rgba(255,255,255,0.12)',
                              fontSize: '1.1rem',
                            }}
                          >
                            ★
                          </span>
                        ))}
                        <span
                          className="ms-2 fw-bold"
                          style={{
                            color: getDetailedRatingColor(selectedTicketRating.rating),
                            fontSize: '0.82rem',
                            background: `${getDetailedRatingColor(selectedTicketRating.rating)}1A`, // 10% opacity
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          {selectedTicketRating.rating}/5
                        </span>
                      </div>
                    </div>
                    {selectedTicketRating.feedback && (
                      <div
                        style={{
                          background: '#1a1f2e',
                          borderRadius: '6px',
                          padding: '10px 14px',
                          fontStyle: 'italic',
                          color: '#9aa1b3',
                          fontSize: '0.85rem',
                        }}
                      >
                        &ldquo;{selectedTicketRating.feedback}&rdquo;
                      </div>
                    )}
                  </div>
                )}

                {/* Notes & Activity */}
                <div
                  style={{
                    background: '#252b3b',
                    borderRadius: '8px',
                    padding: '16px 18px',
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <CIcon
                        icon={cilList}
                        style={{ color: '#8892a4', width: '15px', height: '15px' }}
                      />
                      <h6
                        className="fw-semibold mb-0"
                        style={{ color: '#cdd3e0', fontSize: '0.85rem' }}
                      >
                        Notes & Activity
                      </h6>
                    </div>
                    <span
                      style={{
                        color: '#6b7280',
                        fontSize: '0.72rem',
                        background: 'rgba(255,255,255,0.04)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                      }}
                    >
                      {currentTicketNotes.length} note{currentTicketNotes.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div
                    className="d-flex flex-column gap-3 pe-1"
                    style={{
                      maxHeight: '300px',
                      overflowY: 'auto',
                      marginBottom: currentTicketNotes.length > 0 ? '14px' : '0',
                    }}
                  >
                    {currentTicketNotes.length === 0 ? (
                      <div
                        className="text-center py-4 rounded-2"
                        style={{
                          background: '#1a1f2e',
                          border: '1px dashed rgba(255,255,255,0.06)',
                        }}
                      >
                        <CIcon
                          icon={cilPencil}
                          size="xl"
                          style={{ color: 'rgba(136,146,164,0.35)', marginBottom: '6px' }}
                        />
                        <p className="mb-0" style={{ color: '#6b7280', fontSize: '0.82rem' }}>
                          No notes yet
                        </p>
                      </div>
                    ) : (
                      currentTicketNotes.map((note, idx) => (
                        <div
                          key={idx}
                          className="d-flex gap-3"
                          style={{ animation: `fadeIn 0.3s ease ${idx * 0.05}s both` }}
                        >
                          <div className="flex-shrink-0">
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background:
                                  note.author === 'Admin'
                                    ? '#3b82f6'
                                    : note.author === 'Operator'
                                      ? '#6366f1'
                                      : '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '0.65rem',
                                fontWeight: '700',
                              }}
                            >
                              {getInitials(note.author)}
                            </div>
                          </div>
                          <div
                            className="flex-grow-1 rounded-2"
                            style={{
                              background: '#1a1f2e',
                              border: '1px solid rgba(255,255,255,0.04)',
                              padding: '10px 14px',
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <strong style={{ color: '#cdd3e0', fontSize: '0.78rem' }}>
                                {note.author}
                              </strong>
                              <small style={{ color: '#6b7280', fontSize: '0.68rem' }}>
                                {new Date(note.timestamp).toLocaleString()}
                              </small>
                            </div>
                            <p
                              className="mb-0"
                              style={{
                                color: '#9aa1b3',
                                fontSize: '0.82rem',
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.5',
                              }}
                            >
                              {note.content}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Note Form */}
                  {hasPermission(userRole, 'canAddNotes') && (
                    <CForm onSubmit={handleAddNote}>
                      <div
                        style={{
                          background: '#1a1f2e',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.04)',
                          padding: '14px',
                        }}
                      >
                        <CFormLabel
                          className="fw-semibold mb-2"
                          style={{ color: '#8892a4', fontSize: '1rem' }}
                        >
                          Add Note
                        </CFormLabel>
                        <CFormTextarea
                          rows={2}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Type your note..."
                          style={{
                            background: 'rgba(0,0,0,0.25)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '6px',
                            color: '#e2e8f0',
                            fontSize: '0.85rem',
                            resize: 'none',
                          }}
                        />
                        <div className="d-flex justify-content-end mt-2">
                          <CButton
                            type="submit"
                            disabled={!noteText.trim()}
                            className="d-flex align-items-center gap-2 border-0"
                            style={{
                              background: noteText.trim() ? '#3b82f6' : 'rgba(255,255,255,0.04)',
                              color: noteText.trim() ? '#fff' : '#6b7280',
                              borderRadius: '6px',
                              padding: '7px 18px',
                              fontSize: '0.82rem',
                              fontWeight: '600',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <CIcon icon={cilPencil} size="sm" /> Post Note
                          </CButton>
                        </div>
                      </div>
                    </CForm>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '14px 22px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: '#1a1f2e',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={() => setContentModalVisible(false)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                padding: '7px 22px',
                color: '#8892a4',
                fontSize: '0.82rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = '#ccc'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.color = '#8892a4'
              }}
            >
              Close
            </button>
          </div>
        </div>
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

      {/* Timeline Details Modal - Clean Dark */}
      <CModal
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        alignment="center"
        size="lg"
        className="modern-detail-modal"
      >
        <div
          style={{
            background: '#1e2330',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: '#252b3b',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '18px 22px',
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CIcon icon={cilClock} style={{ color: '#fff', width: '18px', height: '18px' }} />
                </div>
                <div>
                  <h5 className="fw-bold mb-0" style={{ color: '#f0f0f0', fontSize: '1.05rem' }}>
                    Ticket Timeline
                  </h5>
                  <span style={{ color: '#8892a4', fontSize: '0.8rem' }}>
                    #{selectedTicketForDetails?.id} • {selectedTicketForDetails?.service}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetailsVisible(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#8892a4',
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.color = '#ccc'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#8892a4'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 22px' }}>
            {selectedTicketForDetails && (
              <div className="d-flex flex-column" style={{ gap: '12px' }}>
                {/* Last Login */}
                <div
                  className="d-flex align-items-center gap-3"
                  style={{
                    background: '#252b3b',
                    borderRadius: '8px',
                    padding: '14px 18px',
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'rgba(59,130,246,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CIcon
                      icon={cilUser}
                      style={{ color: '#3b82f6', width: '16px', height: '16px' }}
                    />
                  </div>
                  <div className="flex-grow-1">
                    <p
                      className="text-uppercase fw-bold mb-0"
                      style={{ color: '#8892a4', fontSize: '0.68rem', letterSpacing: '0.3px' }}
                    >
                      Last Login
                    </p>
                    <p
                      className="fw-semibold mb-0"
                      style={{ color: '#e2e8f0', fontSize: '0.88rem' }}
                    >
                      {selectedTicketForDetails.userDetails?.lastLogin
                        ? new Date(selectedTicketForDetails.userDetails.lastLogin).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                  <small style={{ color: '#6b7280', fontSize: '0.7rem' }}>User activity</small>
                </div>

                {/* Created On */}
                <div
                  className="d-flex align-items-center gap-3"
                  style={{
                    background: '#252b3b',
                    borderRadius: '8px',
                    padding: '14px 18px',
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'rgba(34,197,94,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CIcon
                      icon={cilPlus}
                      style={{ color: '#22c55e', width: '16px', height: '16px' }}
                    />
                  </div>
                  <div className="flex-grow-1">
                    <p
                      className="text-uppercase fw-bold mb-0"
                      style={{ color: '#8892a4', fontSize: '0.68rem', letterSpacing: '0.3px' }}
                    >
                      Created On
                    </p>
                    <p
                      className="fw-semibold mb-0"
                      style={{ color: '#e2e8f0', fontSize: '0.88rem' }}
                    >
                      {new Date(selectedTicketForDetails.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <small style={{ color: '#6b7280', fontSize: '0.7rem' }}>Initialized</small>
                </div>

                {/* Closed On */}
                <div
                  className="d-flex align-items-center gap-3"
                  style={{
                    background: '#252b3b',
                    borderRadius: '8px',
                    padding: '14px 18px',
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background:
                        selectedTicketForDetails.status === 'Completed'
                          ? 'rgba(59,130,246,0.12)'
                          : 'rgba(107,114,128,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CIcon
                      icon={cilCheckCircle}
                      style={{
                        color:
                          selectedTicketForDetails.status === 'Completed' ? '#3b82f6' : '#6b7280',
                        width: '16px',
                        height: '16px',
                      }}
                    />
                  </div>
                  <div className="flex-grow-1">
                    <p
                      className="text-uppercase fw-bold mb-0"
                      style={{ color: '#8892a4', fontSize: '0.68rem', letterSpacing: '0.3px' }}
                    >
                      Closed On
                    </p>
                    <p
                      className="fw-semibold mb-0"
                      style={{ color: '#e2e8f0', fontSize: '0.88rem' }}
                    >
                      {selectedTicketForDetails.status === 'Completed'
                        ? new Date(selectedTicketForDetails.updatedAt).toLocaleString()
                        : 'Pending...'}
                    </p>
                  </div>
                  <small style={{ color: '#6b7280', fontSize: '0.7rem' }}>Resolution</small>
                </div>

                {/* Last Update */}
                <div
                  className="d-flex align-items-center gap-3"
                  style={{
                    background: '#252b3b',
                    borderRadius: '8px',
                    padding: '14px 18px',
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'rgba(234,179,8,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CIcon
                      icon={cilPencil}
                      style={{ color: '#eab308', width: '16px', height: '16px' }}
                    />
                  </div>
                  <div className="flex-grow-1">
                    <p
                      className="text-uppercase fw-bold mb-0"
                      style={{ color: '#8892a4', fontSize: '0.68rem', letterSpacing: '0.3px' }}
                    >
                      Last Update
                    </p>
                    <p
                      className="fw-semibold mb-0"
                      style={{ color: '#e2e8f0', fontSize: '0.88rem' }}
                    >
                      {new Date(selectedTicketForDetails.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <small style={{ color: '#6b7280', fontSize: '0.7rem' }}>Recent activity</small>
                </div>

                {/* Display Expiry */}
                <div
                  className="d-flex align-items-center gap-3"
                  style={{
                    background: '#252b3b',
                    borderRadius: '8px',
                    padding: '14px 18px',
                    borderLeft:
                      selectedTicketForDetails.expiresAt &&
                      new Date(selectedTicketForDetails.expiresAt) < new Date()
                        ? '3px solid #ef4444'
                        : '3px solid #252b3b',
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'rgba(239,68,68,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CIcon
                      icon={cilWarning}
                      style={{ color: '#ef4444', width: '16px', height: '16px' }}
                    />
                  </div>
                  <div className="flex-grow-1">
                    <p
                      className="text-uppercase fw-bold mb-0"
                      style={{ color: '#8892a4', fontSize: '0.68rem', letterSpacing: '0.3px' }}
                    >
                      Display Expiry
                    </p>
                    <p
                      className="fw-semibold mb-0"
                      style={{ color: '#e2e8f0', fontSize: '0.88rem' }}
                    >
                      {selectedTicketForDetails.expiresAt
                        ? new Date(selectedTicketForDetails.expiresAt).toLocaleDateString(
                            undefined,
                            {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            },
                          )
                        : 'N/A'}
                    </p>
                  </div>
                  <span
                    className="px-2 py-1 rounded-pill"
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      background:
                        selectedTicketForDetails.expiresAt &&
                        new Date(selectedTicketForDetails.expiresAt) < new Date()
                          ? 'rgba(239,68,68,0.12)'
                          : 'rgba(34,197,94,0.1)',
                      color:
                        selectedTicketForDetails.expiresAt &&
                        new Date(selectedTicketForDetails.expiresAt) < new Date()
                          ? '#f87171'
                          : '#4ade80',
                    }}
                  >
                    {selectedTicketForDetails.expiresAt &&
                    new Date(selectedTicketForDetails.expiresAt) < new Date()
                      ? 'Expired'
                      : 'Active'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '14px 22px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: '#1a1f2e',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              onClick={() => setDetailsVisible(false)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                padding: '7px 22px',
                color: '#8892a4',
                fontSize: '0.82rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = '#ccc'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.color = '#8892a4'
              }}
            >
              Close
            </button>
            <button
              onClick={() => {
                setDetailsVisible(false)
                openContentModal(selectedTicketForDetails)
              }}
              style={{
                background: '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 22px',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#2563eb'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#3b82f6'
              }}
            >
              View Full Details
            </button>
          </div>
        </div>
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
      {/* Review Details Modal */}
      <CModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        size="lg"
        alignment="center"
        className="modern-detail-modal"
      >
        <div
          style={{
            background: '#1e2330',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: '#252b3b',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '18px 22px',
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CIcon
                    icon={cilDescription}
                    style={{ color: '#fff', width: '18px', height: '18px' }}
                  />
                </div>
                <div>
                  <h5 className="fw-bold mb-0" style={{ color: '#f0f0f0', fontSize: '1.05rem' }}>
                    Review Details
                  </h5>
                  <span style={{ color: '#8892a4', fontSize: '0.8rem' }}>
                    Review ID: #{selectedReview?.ratingId}
                  </span>
                </div>
              </div>
              <CButton
                color="secondary"
                variant="ghost"
                size="sm"
                onClick={() => setReviewModalVisible(false)}
                style={{ color: '#8892a4' }}
              >
                <CIcon icon={cilX} />
              </CButton>
            </div>
          </div>

          <div className="p-4">
            {selectedReview && (
              <CRow className="g-4">
                {/* Customer Details */}
                <CCol md={6}>
                  <div
                    className="p-3 rounded-3 h-100"
                    style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <h6 className="text-secondary text-uppercase small fw-bold mb-3">
                      Customer Details
                    </h6>
                    <div className="d-flex flex-column gap-2 text-white">
                      <div>
                        <span className="text-secondary small d-block">Name</span>
                        <span className="fw-medium">{selectedReview.customerName}</span>
                      </div>
                      <div>
                        <span className="text-secondary small d-block">City / Location</span>
                        <span className="fw-medium">{selectedReview.customerCity}</span>
                      </div>
                      <div>
                        <span className="text-secondary small d-block">Contact Info</span>
                        <span className="fw-medium d-block">{selectedReview.userEmail}</span>
                        <span className="fw-medium d-block">{selectedReview.userPhone}</span>
                      </div>
                    </div>
                  </div>
                </CCol>

                {/* Operator Details */}
                <CCol md={6}>
                  <div
                    className="p-3 rounded-3 h-100"
                    style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <h6 className="text-secondary text-uppercase small fw-bold mb-3">
                      Operator Details
                    </h6>
                    <div className="d-flex flex-column gap-2 text-white">
                      <div>
                        <span className="text-secondary small d-block">Assigned Operator</span>
                        <div className="d-flex align-items-center gap-2 mt-1">
                          {selectedReview.operatorName !== 'Unassigned' && (
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                              style={{
                                width: '24px',
                                height: '24px',
                                background: '#3b82f6',
                                fontSize: '10px',
                              }}
                            >
                              {selectedReview.operatorName.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="fw-medium">{selectedReview.operatorName}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-secondary small d-block">Operator ID</span>
                        <span className="fw-medium">{selectedReview.operatorId || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-secondary small d-block">Contact Info</span>
                        <span className="fw-medium d-block">{selectedReview.operatorEmail}</span>
                        <span className="fw-medium d-block">{selectedReview.operatorPhone}</span>
                      </div>
                    </div>
                  </div>
                </CCol>

                {/* Service Details */}
                <CCol md={12}>
                  <div
                    className="p-3 rounded-3"
                    style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <h6 className="text-secondary text-uppercase small fw-bold mb-3">
                      Service Details
                    </h6>
                    <div className="d-flex flex-wrap gap-4 text-white">
                      <div>
                        <span className="text-secondary small d-block">Service Type</span>
                        <span className="fw-medium">{selectedReview.ticketService}</span>
                      </div>
                      <div className="flex-grow-1">
                        <span className="text-secondary small d-block">Description</span>
                        <span className="fw-medium">{selectedReview.ticketDescription}</span>
                      </div>
                      <div>
                        <span className="text-secondary small d-block">Ticket ID</span>
                        <span className="badge bg-info bg-opacity-25 text-info">
                          #{selectedReview.ticketId}
                        </span>
                      </div>
                    </div>
                  </div>
                </CCol>

                {/* Review Content */}
                <CCol md={12}>
                  <div
                    className="p-3 rounded-3"
                    style={{
                      background: 'rgba(234, 179, 8, 0.05)',
                      border: '1px solid rgba(234, 179, 8, 0.1)',
                    }}
                  >
                    <h6 className="text-warning text-uppercase small fw-bold mb-3">
                      Feedback & Rating
                    </h6>
                    <div className="d-flex flex-column gap-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="d-flex text-warning">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              style={{
                                color:
                                  star <= selectedReview.rating
                                    ? getDetailedRatingColor(selectedReview.rating)
                                    : 'rgba(255,255,255,0.1)',
                                fontSize: '1.2rem',
                              }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="fw-bold text-white ms-2">{selectedReview.rating}/5</span>
                        <span className="text-secondary small ms-auto">
                          Submitted on {new Date(selectedReview.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div
                        className="p-3 rounded-2"
                        style={{
                          background: 'rgba(0,0,0,0.2)',
                          color: '#e0e0e0',
                          fontStyle: 'italic',
                        }}
                      >
                        "{selectedReview.feedback || 'No written feedback provided.'}"
                      </div>
                    </div>
                  </div>
                </CCol>
              </CRow>
            )}
          </div>

          {/* Footer Actions */}
          <div
            className="d-flex justify-content-end p-3"
            style={{
              background: '#252b3b',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <button
              onClick={() => setReviewModalVisible(false)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 22px',
                color: '#8892a4',
                fontSize: '0.82rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = '#ccc'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.color = '#8892a4'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </CModal>
      <RatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={handleRatingSubmit}
        ticketId={ratingTicketId}
      />
    </div>
  )
}

export default TicketAnalytics
