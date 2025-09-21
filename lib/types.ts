
export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  department: string;
  description: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Obsolete';
  location: string;
  serialNumber?: string;
  model?: string;
  brand?: string;
  status: 'Active' | 'Disposed' | 'Transferred' | 'Under Maintenance' | 'Pending Disposal';
  createdAt: string;
  updatedAt: string;
}

export interface TransferRequest {
  id: string;
  assetId: string;
  asset: Asset;
  fromDepartment: string;
  toDepartment: string;
  requestedBy: string;
  requestedByName: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
  completedDate?: string;
  notes?: string;
}

export interface DisposalRequest {
  id: string;
  assetId: string;
  asset: Asset;
  reason: string;
  method: 'Sale' | 'Donation' | 'Destruction' | 'Recycling';
  requestedBy: string;
  requestedByName: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
  completedDate?: string;
  saleAmount?: number;
  recipientDetails?: string;
  notes?: string;
}

export interface DisposalRecord {
  id: string;
  assetId: string;
  asset: Asset;
  reason: string;
  method: 'Sale' | 'Donation' | 'Destruction' | 'Recycling';
  disposalDate: string;
  disposedBy: string;
  disposedByName: string;
  approvedBy: string;
  saleAmount?: number;
  recipientDetails?: string;
  notes?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  budget: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'transfer_request' | 'transfer_approved' | 'transfer_rejected' | 'disposal_request' | 'disposal_approved' | 'disposal_rejected' | 'system';
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  transferRequests: boolean;
  disposalRequests: boolean;
  systemUpdates: boolean;
  weeklyReports: boolean;
  instantNotifications: boolean;
  autoApprovalLimit: number;
  requiredApprovals: number;
  assetTagFormat: string;
  defaultCurrency: string;
  fiscalYearStart: string;
  backupFrequency: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: 'asset' | 'transfer' | 'disposal' | 'user' | 'system';
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}
