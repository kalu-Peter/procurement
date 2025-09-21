export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'procurement_officer' | 'department_head' | 'supplier';
  department?: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Get user from localStorage
export const getCurrentUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  }
  return null;
};

// Save user to localStorage
export const setCurrentUser = (user: User | null): void => {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }
};

// Logout user and redirect to home page 
export const logoutUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  }
};
    

// Logout user
export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  }
};
  

// Role-based permission control
export const hasPermission = (user: User | null, action: string): boolean => {
  if (!user || !user.isActive) return false;

  const permissions: Record<string, string[]> = {
    admin: ['*'],
    procurement_officer: [
      'view_assets', 'create_assets', 'edit_assets', 'transfer_assets',
      'approve_transfers', 'dispose_assets', 'import_excel', 'view_reports'
    ],
    department_head: [
      'view_assets', 'request_transfer', 'approve_department_transfers',
      'view_department_reports'
    ],
    supplier: ['view_assets', 'create_quotes', 'view_orders']
  };

  const userPermissions = permissions[user.role] || [];
  return userPermissions.includes('*') || userPermissions.includes(action);
};
