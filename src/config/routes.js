import React from 'react'

const Dashboard = React.lazy(() => import('../pages/dashboard/Dashboard'))
const Colors = React.lazy(() => import('../pages/theme/colors/Colors'))
const Typography = React.lazy(() => import('../pages/theme/typography/Typography'))

// Base
const Accordion = React.lazy(() => import('../pages/base/accordion/Accordion'))
const Breadcrumbs = React.lazy(() => import('../pages/base/breadcrumbs/Breadcrumbs'))
const Cards = React.lazy(() => import('../pages/base/cards/Cards'))
const Carousels = React.lazy(() => import('../pages/base/carousels/Carousels'))
const Collapses = React.lazy(() => import('../pages/base/collapses/Collapses'))
const ListGroups = React.lazy(() => import('../pages/base/list-groups/ListGroups'))
const Navs = React.lazy(() => import('../pages/base/navs/Navs'))
const Paginations = React.lazy(() => import('../pages/base/paginations/Paginations'))
const Placeholders = React.lazy(() => import('../pages/base/placeholders/Placeholders'))
const Popovers = React.lazy(() => import('../pages/base/popovers/Popovers'))
const Progress = React.lazy(() => import('../pages/base/progress/Progress'))
const Spinners = React.lazy(() => import('../pages/base/spinners/Spinners'))
const Tabs = React.lazy(() => import('../pages/base/tabs/Tabs'))
const Tables = React.lazy(() => import('../pages/base/tables/Tables'))
const Tooltips = React.lazy(() => import('../pages/base/tooltips/Tooltips'))

// Buttons
const Buttons = React.lazy(() => import('../pages/buttons/buttons/Buttons'))
const ButtonGroups = React.lazy(() => import('../pages/buttons/button-groups/ButtonGroups'))
const Dropdowns = React.lazy(() => import('../pages/buttons/dropdowns/Dropdowns'))

//Forms
const ChecksRadios = React.lazy(() => import('../pages/forms/checks-radios/ChecksRadios'))
const FloatingLabels = React.lazy(() => import('../pages/forms/floating-labels/FloatingLabels'))
const FormControl = React.lazy(() => import('../pages/forms/form-control/FormControl'))
const InputGroup = React.lazy(() => import('../pages/forms/input-group/InputGroup'))
const Layout = React.lazy(() => import('../pages/forms/layout/Layout'))
const Range = React.lazy(() => import('../pages/forms/range/Range'))
const Select = React.lazy(() => import('../pages/forms/select/Select'))
const Validation = React.lazy(() => import('../pages/forms/validation/Validation'))

const Charts = React.lazy(() => import('../pages/charts/Charts'))

// Icons
const CoreUIIcons = React.lazy(() => import('../pages/icons/coreui-icons/CoreUIIcons'))
const Flags = React.lazy(() => import('../pages/icons/flags/Flags'))
const Brands = React.lazy(() => import('../pages/icons/brands/Brands'))

// Notifications
const Alerts = React.lazy(() => import('../pages/notifications/alerts/Alerts'))
const Badges = React.lazy(() => import('../pages/notifications/badges/Badges'))
const Modals = React.lazy(() => import('../pages/notifications/modals/Modals'))
const Toasts = React.lazy(() => import('../pages/notifications/toasts/Toasts'))

const Widgets = React.lazy(() => import('../pages/widgets/Widgets'))
const UserList = React.lazy(() => import('../pages/users/UserList'))
const CreateUser = React.lazy(() => import('../pages/users/CreateUser'))
const CreateTicket = React.lazy(() => import('../pages/tickets/CreateTicket'))
const TicketList = React.lazy(() => import('../pages/tickets/TicketList'))
const ModulePermissions = React.lazy(() => import('../pages/admin/ModulePermissions'))
const ApprovalList = React.lazy(() => import('../pages/users/ApprovalList'))
const TicketAnalytics = React.lazy(() => import('../pages/tickets/TicketAnalytics'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/theme', name: 'Theme', element: Colors, exact: true },
  { path: '/theme/colors', name: 'Colors', element: Colors },
  { path: '/theme/typography', name: 'Typography', element: Typography },
  { path: '/base', name: 'Base', element: Cards, exact: true },
  { path: '/base/accordion', name: 'Accordion', element: Accordion },
  { path: '/base/breadcrumbs', name: 'Breadcrumbs', element: Breadcrumbs },
  { path: '/base/cards', name: 'Cards', element: Cards },
  { path: '/base/carousels', name: 'Carousel', element: Carousels },
  { path: '/base/collapses', name: 'Collapse', element: Collapses },
  { path: '/base/list-groups', name: 'List Groups', element: ListGroups },
  { path: '/base/navs', name: 'Navs', element: Navs },
  { path: '/base/paginations', name: 'Paginations', element: Paginations },
  { path: '/base/placeholders', name: 'Placeholders', element: Placeholders },
  { path: '/base/popovers', name: 'Popovers', element: Popovers },
  { path: '/base/progress', name: 'Progress', element: Progress },
  { path: '/base/spinners', name: 'Spinners', element: Spinners },
  { path: '/base/tabs', name: 'Tabs', element: Tabs },
  { path: '/base/tables', name: 'Tables', element: Tables },
  { path: '/base/tooltips', name: 'Tooltips', element: Tooltips },
  { path: '/buttons', name: 'Buttons', element: Buttons, exact: true },
  { path: '/buttons/buttons', name: 'Buttons', element: Buttons },
  { path: '/buttons/dropdowns', name: 'Dropdowns', element: Dropdowns },
  { path: '/buttons/button-groups', name: 'Button Groups', element: ButtonGroups },
  { path: '/charts', name: 'Charts', element: Charts },
  { path: '/forms', name: 'Forms', element: FormControl, exact: true },
  { path: '/forms/form-control', name: 'Form Control', element: FormControl },
  { path: '/forms/select', name: 'Select', element: Select },
  { path: '/forms/checks-radios', name: 'Checks & Radios', element: ChecksRadios },
  { path: '/forms/range', name: 'Range', element: Range },
  { path: '/forms/input-group', name: 'Input Group', element: InputGroup },
  { path: '/forms/floating-labels', name: 'Floating Labels', element: FloatingLabels },
  { path: '/forms/layout', name: 'Layout', element: Layout },
  { path: '/forms/validation', name: 'Validation', element: Validation },
  { path: '/icons', exact: true, name: 'Icons', element: CoreUIIcons },
  { path: '/icons/coreui-icons', name: 'CoreUI Icons', element: CoreUIIcons },
  { path: '/icons/flags', name: 'Flags', element: Flags },
  { path: '/icons/brands', name: 'Brands', element: Brands },
  { path: '/notifications', name: 'Notifications', element: Alerts, exact: true },
  { path: '/notifications/alerts', name: 'Alerts', element: Alerts },
  { path: '/notifications/badges', name: 'Badges', element: Badges },
  { path: '/notifications/modals', name: 'Modals', element: Modals },
  { path: '/notifications/toasts', name: 'Toasts', element: Toasts },
  { path: '/widgets', name: 'Widgets', element: Widgets },
  { path: '/users', name: 'Users', element: UserList, exact: true, roles: ['Admin'] },
  { path: '/users/create', name: 'Create User', element: CreateUser, roles: ['Admin'] },
  { path: '/users/edit/:id', name: 'Edit User', element: CreateUser, roles: ['Admin'] },
  { path: '/users/approvals', name: 'Approval List', element: ApprovalList, roles: ['Admin'] },
  { path: '/tickets', name: 'Tickets', element: TicketList, exact: true },
  { path: '/tickets/create', name: 'Create Ticket', element: CreateTicket },
  { path: '/tickets/analytics', name: 'Ticket Analytics', element: TicketAnalytics },
  {
    path: '/admin/permissions',
    name: 'Module Permissions',
    element: ModulePermissions,
    roles: ['Admin'],
  },
]

export default routes
