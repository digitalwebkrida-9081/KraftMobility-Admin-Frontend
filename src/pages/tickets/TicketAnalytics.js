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
  CButtonGroup,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCheckCircle,
  cilClock,
  cilWarning,
  cilList,
  cilGrid,
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
  cilFilter,
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

  const [analyticsInsights, setAnalyticsInsights] = useState({
    responseRate: 0,
    respondedTickets: 0,
    extendedCount: 0,
    avgResolutionTime: 0,
    unassignedCount: 0,
    sortedServices: [],
    expiringSoon: 0,
    overdueCount: 0,
    serviceHealth: [],
  })

  const [assignmentDist, setAssignmentDist] = useState({
    assigned: 0,
    unassigned: 0,
    completed: 0,
  })

  // Filter State
  const [filterStatus, setFilterStatus] = useState('All')
  const [viewMode, setViewMode] = useState('grid')

  const [filterTicketService, setFilterTicketService] = useState('All')
  const [filterTicketCity, setFilterTicketCity] = useState('')
  const [filterTicketSort, setFilterTicketSort] = useState('Newest')

  const filteredTickets = tickets
    .filter((t) => filterStatus === 'All' || t.status === filterStatus)
    .filter((t) => filterTicketService === 'All' || t.service === filterTicketService)
    .filter((t) => {
      if (!filterTicketCity) return true
      const userObj = t.userDetails || {}
      const city = userObj.location || userObj.propertyAddress || ''
      return city.toLowerCase().includes(filterTicketCity.toLowerCase())
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return filterTicketSort === 'Newest' ? dateB - dateA : dateA - dateB
    })

  const availableServices = ['All', ...new Set(tickets.map((t) => t.service || 'General Service'))]
  const availableCities = [
    ...new Set(
      tickets.map((t) => {
        const userObj = t.userDetails || {}
        return userObj.location || userObj.propertyAddress || ''
      }),
    ),
  ].filter((c) => c.trim() !== '')

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
  const [fieldExecutives, setFieldExecutives] = useState([])
  const [selectedFieldExecutiveId, setSelectedFieldExecutiveId] = useState('')
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
    fieldExecutive: '',
    startDate: '',
    endDate: '',
    service: 'All',
    sort: 'Newest',
  })

  const [ticketFilterModalVisible, setTicketFilterModalVisible] = useState(false)
  const [reviewFilterModalVisible, setReviewFilterModalVisible] = useState(false)

  const toggleCharts = () => {
    setShowCharts(!showCharts)
  }

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await TicketService.getTickets()
        const data = response.data.data || response.data
        setTickets(data)

        const analyticsRes = await TicketService.getAnalytics()
        const { stats: fetchedStats, insights, assignmentDist: dist } = analyticsRes.data

        setStats(fetchedStats)
        setAnalyticsInsights({ ...insights, serviceHealth: insights.serviceHealth || [] })
        setAssignmentDist(dist)

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
            const ops = res.data.filter((u) => u.role === 'Field Executive')
            setFieldExecutives(ops)
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
    // Check if any note author is 'Admin' or 'Field Executive'
    if (!ticket.notes || ticket.notes.length === 0) return false
    return ticket.notes.some((n) => n.author === 'Admin' || n.author === 'Field Executive')
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
        retrieveTickets(false)
        toast.success(`Ticket status updated to ${newStatus}`)
      })
      .catch((e) => {
        console.log(e)
      })
  }

  const retrieveTickets = async (showSuccessMessage = false) => {
    try {
      const response = await TicketService.getTickets()
      const data = response.data.data || response.data
      setTickets(data)

      const analyticsRes = await TicketService.getAnalytics()
      const { stats: fetchedStats, insights, assignmentDist: dist } = analyticsRes.data

      setStats(fetchedStats)
      setAnalyticsInsights({ ...insights, serviceHealth: insights.serviceHealth || [] })
      setAssignmentDist(dist)

      checkRatedTickets(data)

      if (showSuccessMessage) {
        toast.success('Dashboard data refreshed successfully')
      }
    } catch (error) {
      console.error('Error fetching tickets', error)
      toast.error('Failed to refresh data')
    }
  }

  const checkRatedTickets = async (ticketsToCheck) => {
    const user = authService.getCurrentUser()
    if (!user || !ticketsToCheck || ticketsToCheck.length === 0) return

    const completedTickets = ticketsToCheck.filter(
      (t) => t.status === 'Completed' && String(t.userId) === String(user.id),
    )

    if (completedTickets.length === 0) return

    try {
      const ticketIds = completedTickets.map((t) => t.id)
      const res = await RatingService.checkRatedTicketsBatch(ticketIds)
      if (res.data) {
        setRatedTicketIds(new Set(res.data))
      }
    } catch (err) {
      console.error('Error checking rated tickets batch', err)
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
      confirmButtonColor: '#ff0000',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        confirmButton: 'swal2-confirm-danger',
      },
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
    setSelectedFieldExecutiveId(ticket.assignedTo || '')
    setAssignVisible(true)
  }

  const handleAssignSubmit = () => {
    if (!selectedFieldExecutiveId) {
      toast.error('Please select a Field Executive')
      return
    }
    const fieldExecutive = fieldExecutives.find(
      (o) => String(o.id || o._id) === String(selectedFieldExecutiveId),
    )
    const fieldExecutiveName = fieldExecutive ? fieldExecutive.username : ''

    TicketService.assignTicket(assignTicketId, selectedFieldExecutiveId, fieldExecutiveName)
      .then(() => {
        setAssignVisible(false)
        retrieveTickets()
        toast.success(`Ticket assigned to ${fieldExecutiveName}`)
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
    if (ticket.status === 'In Progress') {
      MySwal.fire({
        title: 'Notice',
        text: 'You cannot edit a ticket while it is in progress.',
        icon: 'info',
        confirmButtonColor: '#3085d6',
      })
      return
    }
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

  // Advanced Analytics data is fetched directly from backend APIs and stored in state

  // Chart Data Preparation - Service Health Matrix (Stacked Bar)
  const getServiceHealthData = () => {
    const serviceHealth = analyticsInsights.serviceHealth || []
    const labels = serviceHealth.map((s) => s._id || 'Other')
    return {
      labels,
      datasets: [
        {
          label: 'Pending',
          backgroundColor: '#ef4444',
          data: serviceHealth.map((l) => l.pending || 0),
          barPercentage: 0.6,
          borderRadius: 4,
        },
        {
          label: 'In Progress',
          backgroundColor: '#f59e0b',
          data: serviceHealth.map((l) => l.inProgress || 0),
          barPercentage: 0.6,
          borderRadius: 4,
        },
        {
          label: 'Completed',
          backgroundColor: '#10b981',
          data: serviceHealth.map((l) => l.completed || 0),
          barPercentage: 0.6,
          borderRadius: 4,
        },
      ],
    }
  }
  const serviceHealthData = getServiceHealthData()

  // Chart Data - Assignment Distribution (Doughnut)
  const getAssignmentData = () => {
    return {
      labels: ['Assigned', 'Unassigned', 'Completed'],
      datasets: [
        {
          backgroundColor: ['#3b82f6', '#f87171', '#10b981'],
          borderWidth: 0,
          hoverOffset: 8,
          data: [
            assignmentDist.assigned || 0,
            assignmentDist.unassigned || 0,
            assignmentDist.completed || 0,
          ],
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
    const responded = analyticsInsights.respondedTickets || 0
    const notResponded = (stats.total || 0) - responded

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
    const fieldExecutive = fieldExecutives.find((fe) => String(fe.id || fe._id) === String(ticket?.assignedTo))
    return {
      ...rating,
      ticketService: ticket?.service || 'Unknown',
      ticketDescription: ticket?.description || '',
      customerName: user?.username || ticket?.userEmail || 'Unknown',
      userEmail: ticket?.userEmail || user?.email || 'N/A', // Add userEmail
      userPhone: user?.phoneNumber || 'N/A', // Add userPhone
      customerCity: user?.location || user?.propertyAddress || 'Unknown',
      customerLocation: user?.location || 'N/A',
      customerPropertyAddress: user?.propertyAddress || 'N/A',
      fieldExecutiveName: ticket?.assignedToName || 'Unassigned',
      fieldExecutiveId: ticket?.assignedTo || 'N/A', // Add fieldExecutiveId
      fieldExecutiveEmail: fieldExecutive?.email || 'N/A',
      fieldExecutivePhone: fieldExecutive?.phoneNumber || 'N/A',
      ticketId: rating.ticketId,
      ratingId: rating._id || rating.id,
      createdAt: rating.createdAt,
    }
  })

  // Filter Logic
  const filteredReviews = reviewDetails
    .filter((r) => {
      // City Filter
      if (
        reviewFilters.city &&
        !r.customerCity.toLowerCase().includes(reviewFilters.city.toLowerCase())
      ) {
        return false
      }
      // Field Executive Filter
      if (reviewFilters.fieldExecutive && String(r.fieldExecutiveId) !== String(reviewFilters.fieldExecutive)) {
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
      // Service Filter
      if (
        reviewFilters.service &&
        reviewFilters.service !== 'All' &&
        r.ticketService !== reviewFilters.service
      ) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return reviewFilters.sort === 'Oldest' ? dateA - dateB : dateB - dateA
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
                            ? 'Awaiting field executive assignment'
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
              <div className="d-flex align-items-center gap-3">
                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={() => setTicketFilterModalVisible(true)}
                  className="d-flex align-items-center gap-2"
                >
                  <CIcon icon={cilFilter} /> Filter & Sort
                </CButton>
                <CButtonGroup role="group" aria-label="View Mode">
                  <CButton
                    color={viewMode === 'list' ? 'primary' : 'secondary'}
                    variant={viewMode === 'list' ? '' : 'outline'}
                    onClick={() => setViewMode('list')}
                  >
                    <CIcon icon={cilList} />
                  </CButton>
                  <CButton
                    color={viewMode === 'grid' ? 'primary' : 'secondary'}
                    variant={viewMode === 'grid' ? '' : 'outline'}
                    onClick={() => setViewMode('grid')}
                  >
                    <CIcon icon={cilGrid} />
                  </CButton>
                </CButtonGroup>
                <CButton
                  color="primary"
                  className="d-flex align-items-center gap-2 rounded-pill px-4"
                  onClick={() => retrieveTickets(true)}
                >
                  <CIcon icon={cilTask} /> Refresh Data
                </CButton>
              </div>
            </div>

            <div>
              {viewMode === 'list' ? (
                <table className="ticket-table align-middle">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: '1.5rem' }}>Ticket & Service</th>
                      {!(userRole === 'End-User' || userRole === 'User') && <th>Created By</th>}
                      <th>Assigned Field Executive</th>
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

                        {!(userRole === 'End-User' || userRole === 'User') && (
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
                        )}

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
                                <CDropdownItem
                                  onClick={() => handleStatusChange(item.id, 'Pending')}
                                >
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
                          {(() => {
                            const showDelete =
                              userRole === 'Admin' ||
                              hasPermission(userRole, 'canDeleteTicket') ||
                              authService.getPermissions()['tickets']?.includes('delete')
                            const showAssign = userRole === 'Admin'
                            const showOwnerActions = String(item.userId) === String(currentUserId)
                            if (!showDelete && !showAssign && !showOwnerActions) return null
                            return (
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
                                    hasPermission(userRole, 'canDeleteTicket') ||
                                    authService
                                      .getPermissions()
                                      ['tickets']?.includes('delete')) && (
                                    <CDropdownItem
                                      onClick={() => handleDelete(item.id)}
                                      className="text-danger"
                                    >
                                      <CIcon icon={cilTrash} className="me-2" /> Delete Ticket
                                    </CDropdownItem>
                                  )}
                                  {userRole === 'Admin' && (
                                    <CDropdownItem onClick={() => openAssignModal(item)}>
                                      <CIcon icon={cilUser} className="me-2" /> Assign Field Executive
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
                                        style={{
                                          cursor:
                                            item.status === 'Completed' ? 'default' : 'pointer',
                                        }}
                                        disabled={item.status === 'Completed'}
                                      >
                                        <CIcon icon={cilPencil} className="me-2" /> Edit Ticket
                                      </CDropdownItem>
                                      <CDropdownItem
                                        onClick={() => handleExtend(item.id)}
                                        style={{
                                          cursor:
                                            item.status === 'Completed' ? 'default' : 'pointer',
                                        }}
                                        disabled={item.status === 'Completed'}
                                      >
                                        <CIcon icon={cilClock} className="me-2" /> Extend Expiry
                                      </CDropdownItem>
                                    </>
                                  )}
                                </CDropdownMenu>
                              </CDropdown>
                            )
                          })()}
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
              ) : (
                <CRow className="g-4 p-4">
                  {filteredTickets.map((item, index) => (
                    <CCol xs={12} md={6} xl={4} key={index}>
                      <CCard
                        className="h-100 ticket-grid-card modern-card"
                        style={{
                          '--card-status-color':
                            item.status === 'Pending'
                              ? '#e55353'
                              : item.status === 'In Progress'
                                ? '#f9b115'
                                : item.status === 'Completed'
                                  ? '#2eb85c'
                                  : '#3399ff',
                          '--card-status-color-rgb':
                            item.status === 'Pending'
                              ? '229, 83, 83'
                              : item.status === 'In Progress'
                                ? '249, 177, 21'
                                : item.status === 'Completed'
                                  ? '46, 184, 92'
                                  : '51, 153, 255',
                        }}
                        onClick={(e) => {
                          const el = e.target
                          if (
                            el.closest('.dropdown') ||
                            el.closest('.dropdown-menu') ||
                            el.closest('button') ||
                            el.closest('.btn')
                          ) {
                            return
                          }
                          openDetailsModal(item)
                        }}
                      >
                        <CCardBody className="p-4 d-flex flex-column h-100">
                          {/* Top Strip: ID, Date, Status */}
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="d-flex flex-column gap-1">
                              <span
                                className="fw-bold text-dark"
                                style={{ letterSpacing: '0.5px', fontSize: '1rem' }}
                              >
                                KRAFT-{item.id}
                              </span>
                              <span className="text-muted small">
                                {new Date(item.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Main Service Identifier */}
                          <div className="mb-4">
                            <div className="d-flex align-items-start gap-3 mb-2">
                              <div
                                className="service-icon-wrapper rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                                style={{ width: '42px', height: '42px' }}
                              >
                                <CIcon icon={getServiceIcon(item.service)} size="xl" />
                              </div>
                              <div>
                                <h5
                                  className="mb-1 fw-bold text-dark"
                                  style={{ lineHeight: '1.3' }}
                                >
                                  {item.service}
                                </h5>
                                {item.description && (
                                  <p
                                    className="text-secondary small mb-0"
                                    style={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: '2',
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Flexible spacer to push grid to bottom */}
                          <div className="flex-grow-1"></div>

                          {/* Actors Grid: Creator & Assignee */}
                          <div className="row g-2 mb-4">
                            {!(userRole === 'End-User' || userRole === 'User') && (
                              <div className="col-6">
                                <p
                                  className="text-uppercase text-muted mb-2"
                                  style={{
                                    fontSize: '0.65rem',
                                    fontWeight: '700',
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  Created By
                                </p>
                                <div className="d-flex align-items-center gap-2">
                                  <div
                                    className="avatar-circle flex-shrink-0"
                                    style={{ width: '26px', height: '26px', fontSize: '0.65rem' }}
                                  >
                                    {getInitials(item.userEmail)}
                                  </div>
                                  <div className="d-flex flex-column">
                                    <span
                                      className="text-truncate small fw-medium text-dark"
                                      title={item.userEmail}
                                    >
                                      {item.userEmail.split('@')[0]}
                                    </span>
                                    {item.userDetails &&
                                      (item.userDetails.location ||
                                        item.userDetails.propertyAddress) && (
                                        <span
                                          className="text-truncate text-muted"
                                          style={{ fontSize: '0.6rem' }}
                                          title={[
                                            item.userDetails.location,
                                            item.userDetails.propertyAddress,
                                          ]
                                            .filter(Boolean)
                                            .join(', ')}
                                        >
                                          <CIcon
                                            icon={cilUser}
                                            size="sm"
                                            className="me-1"
                                            style={{ width: '10px' }}
                                          />
                                          {[
                                            item.userDetails.location,
                                            item.userDetails.propertyAddress,
                                          ]
                                            .filter(Boolean)
                                            .join(', ')}
                                        </span>
                                      )}
                                  </div>
                                </div>
                              </div>
                            )}
                            <div
                              className={
                                !(userRole === 'End-User' || userRole === 'User')
                                  ? 'col-6 border-start ps-3'
                                  : 'col-12'
                              }
                            >
                              <p
                                className="text-uppercase text-muted mb-2"
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: '700',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                Assigned To
                              </p>
                              <div className="d-flex align-items-center gap-2">
                                {item.assignedToName ? (
                                  <>
                                    <div
                                      className="avatar-circle flex-shrink-0"
                                      style={{
                                        width: '26px',
                                        height: '26px',
                                        fontSize: '0.65rem',
                                        background:
                                          'linear-gradient(135deg, #17ead9 0%, #6078ea 100%)',
                                      }}
                                    >
                                      {getInitials(item.assignedToName)}
                                    </div>
                                    <span
                                      className="text-truncate small fw-medium text-dark"
                                      title={item.assignedToName}
                                    >
                                      {item.assignedToName}
                                    </span>
                                  </>
                                ) : (
                                  <span className="badge bg-secondary bg-opacity-10 text-secondary fw-normal px-2 py-1 rounded-pill small">
                                    Unassigned
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Footer Actions Strip */}
                          <div className="pt-3 border-top d-flex justify-content-between align-items-center mt-auto flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-2">
                              <CButton
                                color="primary"
                                size="sm"
                                className="d-flex align-items-center gap-2 px-3 border-0 text-nowrap"
                                style={{
                                  backgroundColor: '#5856d6',
                                  color: 'white',
                                  borderRadius: '6px',
                                  fontWeight: '500',
                                }}
                                onClick={() => {
                                  openContentModal(item)
                                }}
                              >
                                <span>View Details</span>
                                <CIcon icon={cilDescription} size="sm" />
                              </CButton>

                              {(() => {
                                const isCompleted = item.status === 'Completed'
                                const isOwner = String(item.userId) === String(currentUserId)
                                const isNotRated = !ratedTicketIds.has(String(item.id))
                                const canRate = hasPermission(userRole, 'canRateTicket')

                                if (isCompleted && isOwner && isNotRated && canRate) {
                                  return (
                                    <CButton
                                      color="warning"
                                      variant="outline"
                                      size="sm"
                                      className="d-flex align-items-center gap-1 px-3 text-nowrap"
                                      style={{
                                        borderRadius: '6px',
                                        fontWeight: '500',
                                      }}
                                      onClick={() => {
                                        openRatingModal(item.id)
                                      }}
                                      title="Rate Service"
                                    >
                                      <CIcon icon={cilStar} size="sm" /> Rate
                                    </CButton>
                                  )
                                }
                                return null
                              })()}
                            </div>

                            <div className="d-flex align-items-center gap-2">
                              {/* Dedicated Actionable Status Badge Dropdown */}
                              {(() => {
                                const canChangeStatus =
                                  userRole === 'Admin' ||
                                  authService.getPermissions()['tickets']?.includes('action')

                                return canChangeStatus ? (
                                  <CDropdown alignment="end" direction="up">
                                    <CDropdownToggle
                                      size="sm"
                                      className="d-flex align-items-center gap-2 border-0 text-nowrap"
                                      style={{
                                        backgroundColor: 'rgba(var(--card-status-color-rgb), 0.12)',
                                        color: 'var(--card-status-color)',
                                        fontWeight: '700',
                                        borderRadius: '20px',
                                        padding: '0.35rem 0.85rem',
                                        fontSize: '0.75rem',
                                        boxShadow: 'none',
                                      }}
                                    >
                                      <span
                                        className="d-inline-block rounded-circle"
                                        style={{
                                          width: '6px',
                                          height: '6px',
                                          backgroundColor: 'var(--card-status-color)',
                                        }}
                                      ></span>
                                      {item.status}
                                    </CDropdownToggle>
                                    <CDropdownMenu>
                                      <CDropdownItem
                                        onClick={() => handleStatusChange(item.id, 'Pending')}
                                        className="d-flex align-items-center gap-2"
                                      >
                                        <span
                                          className="d-inline-block rounded-circle bg-danger"
                                          style={{ width: '8px', height: '8px' }}
                                        ></span>
                                        <span className="fw-semibold text-dark">Pending</span>
                                      </CDropdownItem>
                                      <CDropdownItem
                                        onClick={() => handleStatusChange(item.id, 'In Progress')}
                                        className="d-flex align-items-center gap-2"
                                      >
                                        <span
                                          className="d-inline-block rounded-circle bg-warning"
                                          style={{ width: '8px', height: '8px' }}
                                        ></span>
                                        <span className="fw-semibold text-dark">In Progress</span>
                                      </CDropdownItem>
                                      <CDropdownItem
                                        onClick={() => handleStatusChange(item.id, 'Completed')}
                                        className="d-flex align-items-center gap-2"
                                      >
                                        <span
                                          className="d-inline-block rounded-circle bg-success"
                                          style={{ width: '8px', height: '8px' }}
                                        ></span>
                                        <span className="fw-semibold text-dark">Completed</span>
                                      </CDropdownItem>
                                    </CDropdownMenu>
                                  </CDropdown>
                                ) : (
                                  <span
                                    className="badge rounded-pill px-3 py-1"
                                    style={{
                                      color: 'var(--card-status-color)',
                                      backgroundColor: 'rgba(var(--card-status-color-rgb), 0.1)',
                                      fontWeight: '600',
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    <span
                                      className="d-inline-block rounded-circle me-2"
                                      style={{
                                        width: '6px',
                                        height: '6px',
                                        backgroundColor: 'var(--card-status-color)',
                                      }}
                                    ></span>
                                    {item.status}
                                  </span>
                                )
                              })()}

                              {(() => {
                                const showDelete =
                                  userRole === 'Admin' ||
                                  hasPermission(userRole, 'canDeleteTicket') ||
                                  authService.getPermissions()['tickets']?.includes('delete')
                                const showAssign = userRole === 'Admin'
                                const showOwnerActions =
                                  String(item.userId) === String(currentUserId)
                                if (!showDelete && !showAssign && !showOwnerActions) return null
                                return (
                                  <CDropdown alignment="end">
                                    <CDropdownToggle
                                      color="light"
                                      size="sm"
                                      className="btn-icon-soft text-secondary p-1"
                                    >
                                      <CIcon icon={cilOptions} />
                                    </CDropdownToggle>
                                    <CDropdownMenu>
                                      {(userRole === 'Admin' ||
                                        hasPermission(userRole, 'canDeleteTicket') ||
                                        authService
                                          .getPermissions()
                                          ['tickets']?.includes('delete')) && (
                                        <CDropdownItem
                                          onClick={() => handleDelete(item.id)}
                                          className="text-danger"
                                        >
                                          <CIcon icon={cilTrash} className="me-2" /> Delete
                                        </CDropdownItem>
                                      )}
                                      {userRole === 'Admin' && (
                                        <CDropdownItem onClick={() => openAssignModal(item)}>
                                          <CIcon icon={cilUser} className="me-2" /> Assign Field Executive
                                        </CDropdownItem>
                                      )}
                                      {String(item.userId) === String(currentUserId) && (
                                        <>
                                          <CDropdownItem
                                            onClick={() => openEditModal(item)}
                                            style={{
                                              cursor:
                                                item.status === 'Completed' ? 'default' : 'pointer',
                                            }}
                                            disabled={item.status === 'Completed'}
                                          >
                                            <CIcon icon={cilPencil} className="me-2" /> Edit Ticket
                                          </CDropdownItem>
                                          <CDropdownItem
                                            onClick={() => handleExtend(item.id)}
                                            style={{
                                              cursor:
                                                item.status === 'Completed' ? 'default' : 'pointer',
                                            }}
                                            disabled={item.status === 'Completed'}
                                          >
                                            <CIcon icon={cilClock} className="me-2" /> Extend Expiry
                                          </CDropdownItem>
                                        </>
                                      )}
                                    </CDropdownMenu>
                                  </CDropdown>
                                )
                              })()}
                            </div>
                          </div>
                        </CCardBody>
                      </CCard>
                    </CCol>
                  ))}
                  {tickets.length === 0 && (
                    <CCol xs={12} className="text-center py-5 text-muted">
                      <div className="mb-3">
                        <CIcon icon={cilGrid} size="4xl" className="text-light-emphasis" />
                      </div>
                      No tickets found in the database.
                    </CCol>
                  )}
                </CRow>
              )}
            </div>
          </div>
        </CTabPane>

        {/* Review Analysis Tab */}
        <CTabPane role="tabpanel" aria-labelledby="reviews-tab" visible={activeKey === 'reviews'}>
          <CCard className="border-0 shadow-sm mt-4">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Reviews ({filteredReviews.length})</h5>
                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={() => setReviewFilterModalVisible(true)}
                  className="d-flex align-items-center gap-2"
                >
                  <CIcon icon={cilFilter} /> Filter & Sort
                </CButton>
              </div>
              <div className="table-responsive">
                <table className="table ticket-table table-hover align-middle">
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
                              {review.fieldExecutiveName && review.fieldExecutiveName !== 'Unassigned' && (
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    background: '#3b82f6',
                                    fontSize: '10px',
                                  }}
                                >
                                  {review.fieldExecutiveName.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span>{review.fieldExecutiveName}</span>
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
                              style={{ maxWidth: '150px' }}
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
        size="xl"
        alignment="center"
      >
        <CModalHeader onClose={() => setContentModalVisible(false)}>
          <CModalTitle>
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilDescription} className="text-primary" />
              <span>Ticket Details</span>
              <span className="text-secondary ms-2" style={{ fontSize: '0.9rem' }}>
                #{selectedTicketContent?.id} • {selectedTicketContent?.service}
              </span>
            </div>
          </CModalTitle>
        </CModalHeader>
        ;
        <CModalBody className="p-3 p-md-4 bg-body-tertiary">
          {selectedTicketContent && (
            <CRow className="g-4">
              {/* Main Content Column */}
              <CCol lg={8} className="d-flex flex-column gap-4">
                {/* Header & Description Card */}
                <div className="bg-body rounded-4 shadow-sm border p-4">
                  <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary d-none d-sm-block">
                      <CIcon icon={cilTask} size="xl" />
                    </div>
                    <div>
                      <h4 className="fw-bold mb-1 text-dark">{selectedTicketContent.service}</h4>
                      <div className="text-muted small d-flex align-items-center gap-2">
                        <CIcon icon={cilClock} size="sm" />
                        <span>
                          Submitted on{' '}
                          {new Date(selectedTicketContent.createdAt).toLocaleDateString()} at{' '}
                          {new Date(selectedTicketContent.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <CIcon icon={cilDescription} className="text-secondary" /> Ticket Description
                  </h6>
                  <div className="p-3 bg-body-tertiary rounded-3 border-start border-primary border-4">
                    <p
                      className="text-secondary mb-0"
                      style={{ fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}
                    >
                      {selectedTicketContent.description}
                    </p>
                  </div>
                </div>

                {/* Image Attachment Card */}
                {selectedTicketContent.image && (
                  <div className="bg-body rounded-4 shadow-sm border p-4">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <CIcon icon={cilImage} className="text-secondary" /> Attached Image
                    </h6>
                    <div className="text-center rounded-3 p-3 bg-body-secondary border shadow-inner">
                      <a
                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:5656/api'}/../${selectedTicketContent.image}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="d-inline-block overflow-hidden rounded-3"
                        style={{ cursor: 'zoom-in', outline: 'none' }}
                      >
                        <img
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:5656/api'}/../${selectedTicketContent.image}`}
                          alt="Ticket Attachment"
                          className="img-fluid"
                          style={{
                            maxHeight: '400px',
                            objectFit: 'contain',
                            transition: 'transform 0.3s ease',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        />
                      </a>
                    </div>
                  </div>
                )}

                {/* Rating Card */}
                {selectedTicketRating && hasPermission(userRole, 'canViewRatings') && (
                  <div className="bg-body rounded-4 shadow-sm border p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                        <CIcon icon={cilStar} className="text-warning" /> Customer Rating
                      </h6>
                      <div className="d-flex align-items-center gap-1 bg-warning bg-opacity-10 px-3 py-1 rounded-pill">
                        <span className="fw-bold text-warning">
                          {selectedTicketRating.rating}.0
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          style={{
                            color:
                              star <= selectedTicketRating.rating
                                ? getDetailedRatingColor(selectedTicketRating.rating)
                                : 'rgba(100,100,100,0.15)',
                            fontSize: '1.4rem',
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    {selectedTicketRating.feedback && (
                      <div
                        className="p-3 rounded-3 bg-body-tertiary text-secondary border border-start border-warning border-4 fst-italic shadow-sm"
                        style={{ fontSize: '0.95rem' }}
                      >
                        "{selectedTicketRating.feedback}"
                      </div>
                    )}
                  </div>
                )}

                {/* Notes & Activity Card */}
                <div className="bg-body rounded-4 shadow-sm border p-4">
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                      <CIcon icon={cilList} className="text-secondary" /> Notes & Updates
                    </h6>
                    <span className="badge bg-secondary rounded-pill px-3 py-2">
                      {currentTicketNotes.length} Note{currentTicketNotes.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div
                    className="d-flex flex-column gap-3 mb-4 pe-2"
                    style={{
                      maxHeight: '400px',
                      overflowY: 'auto',
                    }}
                  >
                    {currentTicketNotes.length === 0 ? (
                      <div className="text-center py-5 rounded-3 border border-dashed bg-body-tertiary">
                        <CIcon
                          icon={cilPencil}
                          size="xxl"
                          className="text-muted opacity-25 mb-3 d-block mx-auto"
                        />
                        <p className="mb-0 text-muted fw-medium">
                          No updates or notes have been added yet.
                        </p>
                      </div>
                    ) : (
                      currentTicketNotes.map((note, idx) => (
                        <div key={idx} className="d-flex gap-3">
                          <div className="flex-shrink-0">
                            <div
                              className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm ${
                                note.author === 'Admin'
                                  ? 'bg-primary'
                                  : note.author === 'Field Executive'
                                    ? 'bg-info'
                                    : 'bg-secondary'
                              }`}
                              style={{ width: '40px', height: '40px', fontSize: '0.9rem' }}
                            >
                              {getInitials(note.author)}
                            </div>
                          </div>
                          <div className="flex-grow-1 p-3 rounded-3 bg-body-tertiary border shadow-sm position-relative">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <strong className="text-dark">{note.author}</strong>
                              <small
                                className="text-muted fw-medium"
                                style={{ fontSize: '0.75rem' }}
                              >
                                {new Date(note.timestamp).toLocaleString([], {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </small>
                            </div>
                            <p
                              className="mb-0 text-secondary"
                              style={{
                                fontSize: '0.9rem',
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
                      <div className="p-3 bg-body-tertiary border rounded-3 shadow-inner">
                        <CFormLabel className="fw-bold text-dark mb-2">
                          Post a New Update
                        </CFormLabel>
                        <CFormTextarea
                          rows={3}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Type progress updates, internal notes, or information here..."
                          className="bg-body border-secondary border-opacity-25 shadow-none focus-ring"
                          style={{ resize: 'vertical' }}
                        />
                        <div className="d-flex justify-content-end mt-3">
                          <CButton
                            type="submit"
                            color="primary"
                            disabled={!noteText.trim()}
                            className="d-flex align-items-center gap-2 px-4 shadow-sm"
                          >
                            <CIcon icon={cilPencil} size="sm" /> Submit Note
                          </CButton>
                        </div>
                      </div>
                    </CForm>
                  )}
                </div>
              </CCol>

              {/* Sidebar Column */}
              <CCol lg={4}>
                <div
                  className="d-flex flex-column gap-4 sticky-top"
                  style={{ zIndex: 1, top: '1rem' }}
                >
                  {/* Status & Assignment Card */}
                  <div className="bg-body rounded-4 shadow-sm border p-4">
                    <h6
                      className="fw-bold text-dark mb-4 text-uppercase"
                      style={{ fontSize: '0.75rem', letterSpacing: '1px' }}
                    >
                      Ticket Control
                    </h6>

                    <div className="mb-4">
                      <span className="text-muted small d-block mb-2">Current Status</span>
                      <span
                        className={`d-inline-block px-4 py-2 rounded-3 fw-bold border shadow-sm w-100 text-center ${
                          selectedTicketContent.status === 'Completed'
                            ? 'bg-success bg-opacity-10 text-success border-success border-opacity-25'
                            : selectedTicketContent.status === 'In Progress'
                              ? 'bg-warning bg-opacity-10 text-warning border-warning border-opacity-25'
                              : 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25'
                        }`}
                        style={{ fontSize: '0.95rem' }}
                      >
                        {selectedTicketContent.status}
                      </span>
                    </div>

                    <div className="mb-4">
                      <span className="text-muted small d-block mb-2">Internal ID</span>
                      <div className="d-flex align-items-center gap-2 bg-body-tertiary px-3 py-2 rounded-3 border">
                        <CIcon icon={cilGrid} className="text-secondary" />
                        <span className="fw-semibold text-dark font-monospace">
                          #{selectedTicketContent.id}
                        </span>
                      </div>
                    </div>

                    {selectedTicketContent.assignedToName && (
                      <div>
                        <span className="text-muted small d-block mb-2">Assigned Field Executive</span>
                        <div className="d-flex align-items-center gap-3 p-2 bg-body-tertiary rounded-3 border">
                          <div
                            className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                            style={{ width: '36px', height: '36px' }}
                          >
                            {getInitials(selectedTicketContent.assignedToName)}
                          </div>
                          <span className="fw-bold text-dark">
                            {selectedTicketContent.assignedToName}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Customer Details Card (Only for authorized roles) */}
                  {['Admin', 'Field Executive', 'HR'].includes(userRole) &&
                    selectedTicketContent.userDetails && (
                      <div className="bg-body rounded-4 shadow-sm border p-0 overflow-hidden">
                        <div className="bg-primary bg-opacity-10 p-3 border-bottom border-primary border-opacity-25">
                          <h6
                            className="fw-bold text-primary mb-0 d-flex align-items-center gap-2 text-uppercase"
                            style={{ fontSize: '0.75rem', letterSpacing: '1px' }}
                          >
                            <CIcon icon={cilUser} /> Customer Overview
                          </h6>
                        </div>

                        <div className="p-4 d-flex flex-column gap-3">
                          <div>
                            <span className="text-muted small fw-medium d-block mb-1">
                              Full Name
                            </span>
                            <strong className="text-dark fs-6">
                              {selectedTicketContent.userDetails.username || 'N/A'}
                            </strong>
                          </div>

                          <div>
                            <span className="text-muted small fw-medium d-block mb-1">
                              Phone Number
                            </span>
                            <div className="d-flex align-items-center gap-2">
                              <strong className="text-dark">
                                {selectedTicketContent.userDetails.phoneNumber || 'N/A'}
                              </strong>
                            </div>
                          </div>

                          <div>
                            <span className="text-muted small fw-medium d-block mb-1">
                              Email Address
                            </span>
                            <a
                              href={`mailto:${selectedTicketContent.userDetails.email || selectedTicketContent.userEmail}`}
                              className="text-decoration-none fw-medium text-primary text-break"
                            >
                              {selectedTicketContent.userDetails.email ||
                                selectedTicketContent.userEmail ||
                                'N/A'}
                            </a>
                          </div>

                          <div className="p-3 bg-body-tertiary rounded-3 border mt-2">
                            <span
                              className="text-muted small fw-bold text-uppercase d-block mb-2"
                              style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}
                            >
                              Service Location
                            </span>

                            <div className="mb-2">
                              <span className="text-muted small fw-medium d-block mb-1">
                                Location (City / Area)
                              </span>
                              {selectedTicketContent.userDetails.location ? (
                                <p className="text-dark fw-medium mb-0 small lh-sm">
                                  {selectedTicketContent.userDetails.location}
                                </p>
                              ) : (
                                <span className="text-muted fst-italic small">N/A</span>
                              )}
                            </div>

                            <div className="pt-2 border-top border-secondary border-opacity-25">
                              <span className="text-muted small fw-medium d-block mb-1">
                                Property Address
                              </span>
                              {selectedTicketContent.userDetails.propertyAddress ? (
                                <p className="text-dark fw-medium mb-0 small lh-sm text-break">
                                  {selectedTicketContent.userDetails.propertyAddress}
                                </p>
                              ) : (
                                <span className="text-muted fst-italic small">N/A</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </CCol>
            </CRow>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setContentModalVisible(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Assign Modal */}
      <CModal visible={assignVisible} onClose={() => setAssignVisible(false)} alignment="center">
        <CModalHeader onClose={() => setAssignVisible(false)}>
          <CModalTitle>Assign Field Executive</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel className="fw-bold">Select Field Executive</CFormLabel>
              <CFormSelect
                size="lg"
                value={selectedFieldExecutiveId}
                onChange={(e) => setSelectedFieldExecutiveId(e.target.value)}
              >
                <option value="">Select a Field Executive</option>
                {fieldExecutives.map((fe) => (
                  <option key={fe.id || fe._id} value={fe.id || fe._id}>
                    {fe.username}
                  </option>
                ))}
              </CFormSelect>
              <div className="form-text mt-2">
                The selected field executive will be notified and assigned ownership of this ticket.
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
      <CModal
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        alignment="center"
        size="lg"
      >
        <CModalHeader onClose={() => setDetailsVisible(false)}>
          <CModalTitle>
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilClock} className="text-primary" />
              <span>Ticket Timeline</span>
              <span className="text-secondary ms-2" style={{ fontSize: '0.9rem' }}>
                #{selectedTicketForDetails?.id} • {selectedTicketForDetails?.service}
              </span>
            </div>
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedTicketForDetails && (
            <div className="d-flex flex-column gap-3">
              {/* Last Login */}
              <div className="d-flex align-items-center gap-3 p-3 bg-body-secondary border rounded-3 text-body">
                <div
                  className="flex-shrink-0 d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle"
                  style={{ width: '40px', height: '40px' }}
                >
                  <CIcon icon={cilUser} className="text-primary" />
                </div>
                <div className="flex-grow-1">
                  <p
                    className="text-uppercase fw-bold mb-0 text-secondary"
                    style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
                  >
                    Last Login
                  </p>
                  <p className="fw-semibold mb-0" style={{ fontSize: '0.95rem' }}>
                    {selectedTicketForDetails.userDetails?.lastLogin
                      ? new Date(selectedTicketForDetails.userDetails.lastLogin).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
                <small className="text-secondary">User activity</small>
              </div>

              {/* Created On */}
              <div className="d-flex align-items-center gap-3 p-3 bg-body-secondary border rounded-3 text-body">
                <div
                  className="flex-shrink-0 d-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle"
                  style={{ width: '40px', height: '40px' }}
                >
                  <CIcon icon={cilPlus} className="text-success" />
                </div>
                <div className="flex-grow-1">
                  <p
                    className="text-uppercase fw-bold mb-0 text-secondary"
                    style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
                  >
                    Created On
                  </p>
                  <p className="fw-semibold mb-0" style={{ fontSize: '0.95rem' }}>
                    {new Date(selectedTicketForDetails.createdAt).toLocaleString()}
                  </p>
                </div>
                <small className="text-secondary">Initialized</small>
              </div>

              {/* Closed On */}
              <div className="d-flex align-items-center gap-3 p-3 bg-body-secondary border rounded-3 text-body">
                <div
                  className={`flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle ${selectedTicketForDetails.status === 'Completed' ? 'bg-primary bg-opacity-10' : 'bg-secondary bg-opacity-10'}`}
                  style={{ width: '40px', height: '40px' }}
                >
                  <CIcon
                    icon={cilCheckCircle}
                    className={
                      selectedTicketForDetails.status === 'Completed'
                        ? 'text-primary'
                        : 'text-secondary'
                    }
                  />
                </div>
                <div className="flex-grow-1">
                  <p
                    className="text-uppercase fw-bold mb-0 text-secondary"
                    style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
                  >
                    Closed On
                  </p>
                  <p className="fw-semibold mb-0" style={{ fontSize: '0.95rem' }}>
                    {selectedTicketForDetails.status === 'Completed'
                      ? new Date(selectedTicketForDetails.updatedAt).toLocaleString()
                      : 'Pending...'}
                  </p>
                </div>
                <small className="text-secondary">Resolution</small>
              </div>

              {/* Last Update */}
              <div className="d-flex align-items-center gap-3 p-3 bg-body-secondary border rounded-3 text-body">
                <div
                  className="flex-shrink-0 d-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle"
                  style={{ width: '40px', height: '40px' }}
                >
                  <CIcon icon={cilPencil} className="text-warning" />
                </div>
                <div className="flex-grow-1">
                  <p
                    className="text-uppercase fw-bold mb-0 text-secondary"
                    style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
                  >
                    Last Update
                  </p>
                  <p className="fw-semibold mb-0" style={{ fontSize: '0.95rem' }}>
                    {new Date(selectedTicketForDetails.updatedAt).toLocaleString()}
                  </p>
                </div>
                <small className="text-secondary">Recent activity</small>
              </div>

              {/* Display Expiry */}
              <div
                className={`d-flex align-items-center gap-3 p-3 bg-body-secondary border rounded-3 text-body border-start border-4 ${selectedTicketForDetails.expiresAt && new Date(selectedTicketForDetails.expiresAt) < new Date() ? 'border-danger' : 'border-success'}`}
              >
                <div
                  className={`flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle ${selectedTicketForDetails.expiresAt && new Date(selectedTicketForDetails.expiresAt) < new Date() ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}
                  style={{ width: '40px', height: '40px' }}
                >
                  <CIcon
                    icon={
                      selectedTicketForDetails.expiresAt &&
                      new Date(selectedTicketForDetails.expiresAt) < new Date()
                        ? cilWarning
                        : cilCheckCircle
                    }
                  />
                </div>
                <div className="flex-grow-1">
                  <p
                    className="text-uppercase fw-bold mb-0 text-secondary"
                    style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
                  >
                    Display Expiry
                  </p>
                  <p className="fw-semibold mb-0" style={{ fontSize: '0.95rem' }}>
                    {selectedTicketForDetails.expiresAt
                      ? new Date(selectedTicketForDetails.expiresAt).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
                <span
                  className={`badge ${selectedTicketForDetails.expiresAt && new Date(selectedTicketForDetails.expiresAt) < new Date() ? 'bg-danger' : 'bg-success'}`}
                >
                  {selectedTicketForDetails.expiresAt &&
                  new Date(selectedTicketForDetails.expiresAt) < new Date()
                    ? 'Expired'
                    : 'Active'}
                </span>
              </div>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDetailsVisible(false)}>
            Close
          </CButton>
          <CButton
            color="primary"
            onClick={() => {
              setDetailsVisible(false)
              openContentModal(selectedTicketForDetails)
            }}
          >
            View Full Details
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
      {/* Review Details Modal */}
      <CModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        size="lg"
        alignment="center"
      >
        <CModalHeader onClose={() => setReviewModalVisible(false)}>
          <CModalTitle>
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilDescription} className="text-primary" />
              <span>Review Details</span>
              <span className="text-secondary ms-2" style={{ fontSize: '0.9rem' }}>
                (ID: #{selectedReview?.ratingId})
              </span>
            </div>
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedReview && (
            <CRow className="g-4">
              <CCol md={6}>
                <div className="p-3 border rounded-3 h-100 bg-body-secondary">
                  <h6 className="text-uppercase small fw-bold mb-3 text-secondary">
                    Customer Details
                  </h6>
                  <div className="d-flex flex-column gap-2 text-body">
                    <div>
                      <span className="text-secondary small d-block">Name</span>
                      <span className="fw-medium">{selectedReview.customerName}</span>
                    </div>
                    <div>
                      <span className="text-secondary small d-block">Location (City / Area)</span>
                      <span className="fw-medium">{selectedReview.customerLocation}</span>
                    </div>
                    <div>
                      <span className="text-secondary small d-block">Property Address</span>
                      <span className="fw-medium">{selectedReview.customerPropertyAddress}</span>
                    </div>
                    <div>
                      <span className="text-secondary small d-block">Contact Info</span>
                      <span className="fw-medium d-block">{selectedReview.userEmail}</span>
                      <span className="fw-medium d-block">{selectedReview.userPhone}</span>
                    </div>
                  </div>
                </div>
              </CCol>

              <CCol md={6}>
                <div className="p-3 border rounded-3 h-100 bg-body-secondary">
                  <h6 className="text-uppercase small fw-bold mb-3 text-secondary">
                    Field Executive Details
                  </h6>
                  <div className="d-flex flex-column gap-2 text-body">
                    <div>
                      <span className="text-secondary small d-block">Assigned Field Executive</span>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        {selectedReview.fieldExecutiveName !== 'Unassigned' && (
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold bg-primary"
                            style={{
                              width: '24px',
                              height: '24px',
                              fontSize: '10px',
                            }}
                          >
                            {selectedReview.fieldExecutiveName.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="fw-medium">{selectedReview.fieldExecutiveName}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-secondary small d-block">Field Executive ID</span>
                      <span className="fw-medium">{selectedReview.fieldExecutiveId || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-secondary small d-block">Contact Info</span>
                      <span className="fw-medium d-block">{selectedReview.fieldExecutiveEmail}</span>
                      <span className="fw-medium d-block">{selectedReview.fieldExecutivePhone}</span>
                    </div>
                  </div>
                </div>
              </CCol>

              <CCol md={12}>
                <div className="p-3 border rounded-3 bg-body-secondary">
                  <h6 className="text-uppercase small fw-bold mb-3 text-secondary">
                    Service Details
                  </h6>
                  <div className="d-flex flex-wrap gap-4 text-body">
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

              <CCol md={12}>
                <div className="p-3 border border-warning rounded-3 bg-warning bg-opacity-10">
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
                                  : 'rgba(100,100,100,0.2)',
                              fontSize: '1.2rem',
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="fw-bold text-body ms-2">{selectedReview.rating}/5</span>
                      <span className="text-secondary small ms-auto">
                        Submitted on {new Date(selectedReview.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-2 bg-body-tertiary text-body shadow-sm border fst-italic">
                      "{selectedReview.feedback || 'No written feedback provided.'}"
                    </div>
                  </div>
                </div>
              </CCol>
            </CRow>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setReviewModalVisible(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Ticket Filter Modal */}
      <CModal
        visible={ticketFilterModalVisible}
        onClose={() => setTicketFilterModalVisible(false)}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>Filter & Sort Tickets</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel className="small fw-bold">Sort By</CFormLabel>
            <CFormSelect
              value={filterTicketSort}
              onChange={(e) => setFilterTicketSort(e.target.value)}
            >
              <option value="Newest">Newest First</option>
              <option value="Oldest">Oldest First</option>
            </CFormSelect>
          </div>
          <div className="mb-3">
            <CFormLabel className="small fw-bold">Service</CFormLabel>
            <CFormSelect
              value={filterTicketService}
              onChange={(e) => setFilterTicketService(e.target.value)}
            >
              {availableServices.map((srv, index) => (
                <option key={index} value={srv}>
                  {srv}
                </option>
              ))}
            </CFormSelect>
          </div>
          <div className="mb-3">
            <CFormLabel className="small fw-bold">Filter by City</CFormLabel>
            <CFormSelect
              value={filterTicketCity}
              onChange={(e) => setFilterTicketCity(e.target.value)}
            >
              <option value="">All Cities</option>
              {availableCities.map((city, index) => (
                <option key={index} value={city}>
                  {city}
                </option>
              ))}
            </CFormSelect>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setFilterTicketSort('Newest')
              setFilterTicketService('All')
              setFilterTicketCity('')
            }}
          >
            Clear
          </CButton>
          <CButton color="primary" onClick={() => setTicketFilterModalVisible(false)}>
            Apply Defaults
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Review Filter Modal */}
      <CModal
        visible={reviewFilterModalVisible}
        onClose={() => setReviewFilterModalVisible(false)}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>Review Analysis Filters</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel className="small fw-bold">City</CFormLabel>
            <CFormSelect
              value={reviewFilters.city}
              onChange={(e) => setReviewFilters({ ...reviewFilters, city: e.target.value })}
            >
              <option value="">All Cities</option>
              {availableCities.map((city, index) => (
                <option key={index} value={city}>
                  {city}
                </option>
              ))}
            </CFormSelect>
          </div>
          <div className="mb-3">
            <CFormLabel className="small fw-bold">Field Executive</CFormLabel>
            <CFormSelect
              aria-label="Filter by Field Executive"
              value={reviewFilters.fieldExecutive}
              onChange={(e) => setReviewFilters({ ...reviewFilters, fieldExecutive: e.target.value })}
            >
              <option value="">All Field Executives</option>
              {fieldExecutives.map((fe) => (
                <option key={fe.id || fe._id} value={fe.id || fe._id}>
                  {fe.username}
                </option>
              ))}
            </CFormSelect>
          </div>
          <div className="mb-3 d-flex gap-2">
            <div className="flex-fill">
              <CFormLabel className="small fw-bold">Start Date</CFormLabel>
              <CFormInput
                type="date"
                value={reviewFilters.startDate}
                onChange={(e) => setReviewFilters({ ...reviewFilters, startDate: e.target.value })}
              />
            </div>
            <div className="flex-fill">
              <CFormLabel className="small fw-bold">End Date</CFormLabel>
              <CFormInput
                type="date"
                value={reviewFilters.endDate}
                onChange={(e) => setReviewFilters({ ...reviewFilters, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="mb-3">
            <CFormLabel className="small fw-bold">Service</CFormLabel>
            <CFormSelect
              value={reviewFilters.service}
              onChange={(e) => setReviewFilters({ ...reviewFilters, service: e.target.value })}
            >
              {availableServices.map((srv, index) => (
                <option key={index} value={srv}>
                  {srv}
                </option>
              ))}
            </CFormSelect>
          </div>
          <div className="mb-3">
            <CFormLabel className="small fw-bold">Sort By</CFormLabel>
            <CFormSelect
              value={reviewFilters.sort}
              onChange={(e) => setReviewFilters({ ...reviewFilters, sort: e.target.value })}
            >
              <option value="Newest">Newest First</option>
              <option value="Oldest">Oldest First</option>
            </CFormSelect>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() =>
              setReviewFilters({
                city: '',
                fieldExecutive: '',
                startDate: '',
                endDate: '',
                service: 'All',
                sort: 'Newest',
              })
            }
          >
            Clear Filters
          </CButton>
          <CButton color="primary" onClick={() => setReviewFilterModalVisible(false)}>
            Apply Filters
          </CButton>
        </CModalFooter>
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
