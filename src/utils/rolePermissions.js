/**
 * Role-Based Access Control (RBAC) Configuration
 *
 * This file defines what features are accessible to each role
 */

export const ROLES = {
  ADMIN: 'Admin',
  FIELD_EXECUTIVE: 'Field Executive',
  HR: 'HR',
  END_USER: 'End-User',
  CASE_MANAGER: 'Case Manager',
  SHEETAL_ADMIN: 'SheetalAdmin',
  SUPER_ADMIN: 'Super Admin',
}

export const rolePermissions = {
  [ROLES.ADMIN]: {
    canCreateTicket: false, // Admins manage tickets, don't create them
    canViewAllTickets: true,
    canEditTicket: false, // Cannot edit ticket content (only manage status/assignment)
    canDeleteTicket: true,
    canAssignTicket: true,
    canViewAnalytics: true,
    canManageUsers: true,
    canExtendTicketTime: false, // Field Executives extend time, not admins
    canAddNotes: true,
    canViewNotes: true,
    canChangeTicketStatus: true,
    canViewDashboard: true,
    canRateTicket: false, // Admin cannot rate
    canViewRatings: true, // Admin can view ratings
    canViewCases: true,
    canCreateCase: true,
    canDeleteCase: true,
    canAssignCaseManager: true,
    canChangeCaseStatus: true,
    canUpdateCaseMetadata: true,
  },
  [ROLES.FIELD_EXECUTIVE]: {
    canCreateTicket: false, // Field Executives work on tickets, don't create them
    canViewAllTickets: true,
    canEditTicket: false, // Can edit ticket content while working on it
    canDeleteTicket: false, // Cannot delete
    canAssignTicket: false, // Cannot assign (Admin only)
    canViewAnalytics: true, // Can view analytics
    canManageUsers: false,
    canExtendTicketTime: false, // Can extend time while working
    canAddNotes: true,
    canViewNotes: true,
    canChangeTicketStatus: true, // Can change status of their tickets
    canViewDashboard: true,
    canRateTicket: false, // Field Executive cannot rate
    canViewRatings: true, // Field Executive can view ratings
    canViewCases: true,
    canCreateCase: false,
    canDeleteCase: false,
    canAssignCaseManager: false,
    canChangeCaseStatus: true,
    canUpdateCaseMetadata: false,
  },
  [ROLES.HR]: {
    canCreateTicket: false, // HR doesn't create tickets
    canViewAllTickets: true, // Only sees HR-related tickets
    canEditTicket: false,
    canDeleteTicket: false,
    canAssignTicket: false,
    canViewAnalytics: true,
    canManageUsers: true, // Can manage users
    canExtendTicketTime: false,
    canAddNotes: true,
    canViewNotes: true,
    canChangeTicketStatus: false,
    canViewDashboard: true,
    canRateTicket: false, // HR cannot rate
    canViewRatings: true, // HR can view ratings
    canViewCases: true, // Specific permissions for Cases module
    canCreateCase: true,
    canDeleteCase: false,
    canAssignCaseManager: false,
    canChangeCaseStatus: false,
    canUpdateCaseMetadata: false,
  },
  [ROLES.END_USER]: {
    canCreateTicket: true, // End users create tickets
    canViewAllTickets: true, // Only sees their own tickets
    canEditTicket: true, // Cannot edit after creation
    canDeleteTicket: false,
    canAssignTicket: false,
    canViewAnalytics: true,
    canManageUsers: false,
    canExtendTicketTime: true,
    canAddNotes: false,
    canViewNotes: true, // Can view notes on their tickets
    canChangeTicketStatus: false,
    canViewDashboard: true,
    canRateTicket: true, // End Users CAN rate
    canViewRatings: true, // End Users can view their own ratings
    canViewCases: false,
    canCreateCase: false,
    canDeleteCase: false,
    canAssignCaseManager: false,
    canChangeCaseStatus: false,
    canUpdateCaseMetadata: false,
  },
  [ROLES.CASE_MANAGER]: {
    canCreateTicket: false,
    canViewAllTickets: false,
    canEditTicket: false,
    canDeleteTicket: false,
    canAssignTicket: false,
    canViewAnalytics: false,
    canManageUsers: false,
    canExtendTicketTime: false,
    canAddNotes: false,
    canViewNotes: false,
    canChangeTicketStatus: false,
    canViewDashboard: true,
    canRateTicket: false,
    canViewRatings: false,
    canViewCases: true,
    canCreateCase: false,
    canDeleteCase: false,
    canAssignCaseManager: false,
    canChangeCaseStatus: true,
    canUpdateCaseMetadata: true,
  },
  [ROLES.SHEETAL_ADMIN]: {
    canCreateTicket: false,
    canViewAllTickets: true,
    canEditTicket: false,
    canDeleteTicket: true,
    canAssignTicket: true,
    canViewAnalytics: true,
    canManageUsers: false,
    canExtendTicketTime: false,
    canAddNotes: true,
    canViewNotes: true,
    canChangeTicketStatus: true,
    canViewDashboard: true,
    canRateTicket: false,
    canViewRatings: true,
    canViewCases: true,
    canCreateCase: true,
    canDeleteCase: true,
    canAssignCaseManager: true,
    canChangeCaseStatus: true,
    canUpdateCaseMetadata: true,
  },
  [ROLES.SUPER_ADMIN]: {
    canCreateTicket: false,
    canViewAllTickets: true,
    canEditTicket: false,
    canDeleteTicket: true,
    canAssignTicket: true,
    canViewAnalytics: true,
    canManageUsers: true,
    canExtendTicketTime: false,
    canAddNotes: true,
    canViewNotes: true,
    canChangeTicketStatus: true,
    canViewDashboard: true,
    canRateTicket: false,
    canViewRatings: true,
    canViewCases: true,
    canCreateCase: true,
    canDeleteCase: true,
    canAssignCaseManager: true,
    canChangeCaseStatus: true,
    canUpdateCaseMetadata: true,
  },
}

/**
 * Get permissions for a specific role
 */
export function getPermissions(role) {
  return rolePermissions[role] || rolePermissions[ROLES.END_USER]
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role, permission) {
  const permissions = getPermissions(role)
  return permissions[permission] || false
}

/**
 * Check if the user can access a specific route
 */
export const canAccessRoute = (role, route) => {
  const permissions = getPermissions(role)

  // Route-based access control
  const routePermissions = {
    '/tickets/analytics': permissions.canViewAnalytics,
    '/users': permissions.canManageUsers,
    '/dashboard': permissions.canViewDashboard,
  }

  if (route in routePermissions) {
    return routePermissions[route]
  }

  return true // Default to true for unlisted routes
}
