import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilCalculator,
  cilChartPie,
  cilCursor,
  cilDescription,
  cilDrop,
  cilExternalLink,
  cilNotes,
  cilPencil,
  cilPuzzle,
  cilSpeedometer,
  cilStar,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'
import { hasPermission } from 'src/utils/rolePermissions'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    permission: 'canViewDashboard',
  },
  {
    component: CNavItem,
    name: 'Ticket Analytics',
    to: '/tickets/analytics',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
    permission: 'canViewAnalytics',
  },
  {
    component: CNavItem,
    name: 'Cases',
    to: '/cases',
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />, // using cilNotes instead of missing icon
    permission: 'canViewCases',
  },
]

/**
 * Filter navigation items based on user role
 * @param {string} userRole - The role of the current user
 * @returns {Array} Filtered navigation items
 */
export const getFilteredNav = (userRole) => {
  if (!userRole) return []

  return _nav.filter((item) => {
    // If no permission is defined, show the item
    if (!item.permission) return true

    // Check if user has the required permission
    return hasPermission(userRole, item.permission)
  })
}

export default _nav
