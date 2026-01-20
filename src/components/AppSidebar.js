import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'

import { cilUser } from '@coreui/icons'
import { CNavGroup, CNavItem } from '@coreui/react'
import { useAuth } from '../context/AuthContext'
import { AppSidebarNav } from './AppSidebarNav'

import logo from 'src/assets/brand/logo.png'
import { sygnet } from 'src/assets/brand/sygnet'

// sidebar nav config
import navigation from '../config/nav'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const { user } = useAuth()

  const navItems = [...navigation]
  if (user?.role === 'Admin') {
    // Check if added to avoid duplicates if re-rendering (though clone prevents it, good to be safe id strict mode)
    if (!navItems.find((item) => item.name === 'Users')) {
      navItems.splice(1, 0, {
        component: CNavGroup,
        name: 'Users',
        to: '/users',
        icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
        items: [
          {
            component: CNavItem,
            name: 'All Users',
            to: '/users',
          },
          {
            component: CNavItem,
            name: 'Admin',
            to: '/users?role=Admin',
          },
          {
            component: CNavItem,
            name: 'Operator',
            to: '/users?role=Operator',
          },
          {
            component: CNavItem,
            name: 'HR',
            to: '/users?role=HR',
          },
          {
            component: CNavItem,
            name: 'End-User',
            to: '/users?role=End-User',
          },
        ],
      })
    }
  }

  // Hide Create Ticket for Admin/Operator/HR
  if (['Admin', 'Operator', 'HR'].includes(user?.role)) {
    // Filter out the 'Create Ticket' item
    const index = navItems.findIndex((item) => item.to === '/tickets/create')
    if (index !== -1) {
      navItems.splice(index, 1)
    }
  }

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand to="/">
          <img src={logo} alt="Logo" height={32} />
          {/* <CIcon customClassName="sidebar-brand-narrow" icon={sygnet} height={32} /> */}
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>
      <AppSidebarNav items={navItems} />
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
