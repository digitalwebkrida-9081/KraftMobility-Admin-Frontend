import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import TicketService from '../../services/ticketService'
import UserService from '../../services/userService'

import {
  CRow,
  CCol,
  CDropdown,
  CDropdownMenu,
  CDropdownItem,
  CDropdownToggle,
  CWidgetStatsA,
  CWidgetStatsB,
  CWidgetStatsC,
  CWidgetStatsF,
} from '@coreui/react'
import { getStyle } from '@coreui/utils'
import { CChartBar, CChartLine } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import {
  cilArrowBottom,
  cilArrowTop,
  cilOptions,
  cilPeople,
  cilSpeedometer,
  cilClock,
  cilCheckCircle,
} from '@coreui/icons'

const WidgetsDropdown = (props) => {
  const widgetChartRef1 = useRef(null)
  const widgetChartRef2 = useRef(null)

  const [stats, setStats] = useState({
    users: 0,
    totalTickets: 0,
    completedTickets: 0,
    pendingTickets: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await UserService.getUsers()
        const usersData = usersRes.data.data || usersRes.data
        const usersCount = usersData.length || usersRes.data.totalItems || 0

        const analyticsRes = await TicketService.getAnalytics()
        const ticketStats = analyticsRes.data.stats

        setStats({
          users: usersCount,
          totalTickets: ticketStats.total || 0,
          completedTickets: ticketStats.completed || 0,
          pendingTickets: ticketStats.pending || 0,
        })
      } catch (error) {
        console.error('Error fetching dashboard widgets data', error)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    document.documentElement.addEventListener('ColorSchemeChange', () => {
      if (widgetChartRef1.current) {
        setTimeout(() => {
          widgetChartRef1.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-primary')
          widgetChartRef1.current.update()
        })
      }

      if (widgetChartRef2.current) {
        setTimeout(() => {
          widgetChartRef2.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-info')
          widgetChartRef2.current.update()
        })
      }
    })
  }, [widgetChartRef1, widgetChartRef2])

  return (
    <CRow className={props.className} xs={{ gutter: 4 }}>
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsC
          className="mb-3 text-white shadow-lg border-0"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '15px',
          }}
          icon={<CIcon icon={cilPeople} height={36} className="text-white opacity-75" />}
          progress={{ value: 100, color: 'white' }}
          title={<span className="fs-6 fw-bold text-uppercase opacity-75">Total Users</span>}
          value={<span className="fs-2 fw-bold">{stats.users.toLocaleString()}</span>}
        />
      </CCol>
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsC
          className="mb-3 text-white shadow-lg border-0"
          style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '15px',
          }}
          icon={<CIcon icon={cilSpeedometer} height={36} className="text-white opacity-75" />}
          progress={{ value: 100, color: 'white' }}
          title={<span className="fs-6 fw-bold text-uppercase opacity-75">Total Tickets</span>}
          value={<span className="fs-2 fw-bold">{stats.totalTickets.toLocaleString()}</span>}
        />
      </CCol>
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsC
          className="mb-3 text-white shadow-lg border-0"
          style={{
            background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
            borderRadius: '15px',
          }}
          icon={<CIcon icon={cilClock} height={36} className="text-white opacity-75" />}
          progress={{ value: 100, color: 'white' }}
          title={<span className="fs-6 fw-bold text-uppercase opacity-75">Pending Tickets</span>}
          value={<span className="fs-2 fw-bold">{stats.pendingTickets.toLocaleString()}</span>}
        />
      </CCol>
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsC
          className="mb-3 text-white shadow-lg border-0"
          style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            borderRadius: '15px',
          }}
          icon={<CIcon icon={cilCheckCircle} height={36} className="text-white opacity-75" />}
          progress={{ value: 100, color: 'white' }}
          title={<span className="fs-6 fw-bold text-uppercase opacity-75">Completed</span>}
          value={<span className="fs-2 fw-bold">{stats.completedTickets.toLocaleString()}</span>}
        />
      </CCol>
    </CRow>
  )
}

WidgetsDropdown.propTypes = {
  className: PropTypes.string,
  withCharts: PropTypes.bool,
}

export default WidgetsDropdown
