
import { Asset, Department, Category, TransferRequest, DisposalRequest, DisposalRecord, Notification } from './types';

export const mockDepartments: Department[] = [
  { id: '1', name: 'Information Technology', code: 'IT', head: 'Michael Brown', budget: 500000, isActive: true },
  { id: '2', name: 'Finance', code: 'FIN', head: 'Jane Smith', budget: 300000, isActive: true },
  { id: '3', name: 'Human Resources', code: 'HR', head: 'Robert Davis', budget: 200000, isActive: true },
  { id: '4', name: 'Engineering', code: 'ENG', head: 'Alice Johnson', budget: 800000, isActive: true },
  { id: '5', name: 'Marketing', code: 'MKT', head: 'David Wilson', budget: 250000, isActive: true }
];

export const mockCategories: Category[] = [
  { id: '1', name: 'Computers', code: 'COMP', description: 'Desktop and laptop computers', isActive: true },
  { id: '2', name: 'Furniture', code: 'FURN', description: 'Office furniture and fixtures', isActive: true },
  { id: '3', name: 'Vehicles', code: 'VEH', description: 'Company vehicles and transport', isActive: true },
  { id: '4', name: 'Equipment', code: 'EQUIP', description: 'Technical and office equipment', isActive: true },
  { id: '5', name: 'Software', code: 'SOFT', description: 'Software licenses and applications', isActive: true }
];

export const mockAssets: Asset[] = [
  {
    id: '1',
    assetTag: 'TUM/IT/COMP/001-24',
    name: 'Dell OptiPlex 7090',
    category: 'Computers',
    department: 'IT',
    description: 'Desktop computer for office work',
    purchaseDate: '2024-01-15',
    purchasePrice: 85000,
    currentValue: 75000,
    condition: 'Excellent',
    location: 'IT Office - Room 201',
    serialNumber: 'DL789456123',
    model: 'OptiPlex 7090',
    brand: 'Dell',
    status: 'Active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    assetTag: 'TUM/FIN/FURN/002-24',
    name: 'Executive Office Desk',
    category: 'Furniture',
    department: 'Finance',
    description: 'Wooden executive desk with drawers',
    purchaseDate: '2024-02-10',
    purchasePrice: 45000,
    currentValue: 40000,
    condition: 'Good',
    location: 'Finance Office - Room 105',
    status: 'Active',
    createdAt: '2024-02-10T14:30:00Z',
    updatedAt: '2024-02-10T14:30:00Z'
  },
  {
    id: '3',
    assetTag: 'TUM/ENG/EQUIP/003-24',
    name: 'HP LaserJet Pro M404n',
    category: 'Equipment',
    department: 'Engineering',
    description: 'Monochrome laser printer',
    purchaseDate: '2024-03-05',
    purchasePrice: 28000,
    currentValue: 25000,
    condition: 'Good',
    location: 'Engineering Lab - Room 301',
    serialNumber: 'HP123987456',
    model: 'LaserJet Pro M404n',
    brand: 'HP',
    status: 'Active',
    createdAt: '2024-03-05T09:15:00Z',
    updatedAt: '2024-03-05T09:15:00Z'
  },
  {
    id: '4',
    assetTag: 'TUM/IT/COMP/004-24',
    name: 'Old Desktop Computer',
    category: 'Computers',
    department: 'IT',
    description: 'Outdated desktop computer requiring disposal',
    purchaseDate: '2018-06-10',
    purchasePrice: 45000,
    currentValue: 5000,
    condition: 'Obsolete',
    location: 'IT Storage - Room 205',
    serialNumber: 'OLD123456789',
    model: 'OptiPlex 3020',
    brand: 'Dell',
    status: 'Pending Disposal',
    createdAt: '2018-06-10T10:00:00Z',
    updatedAt: '2024-03-20T14:30:00Z'
  }
];

export const mockTransferRequests: TransferRequest[] = [
  {
    id: '1',
    assetId: '1',
    asset: mockAssets[0],
    fromDepartment: 'IT',
    toDepartment: 'Finance',
    requestedBy: '3',
    requestedByName: 'Michael Brown',
    reason: 'Department restructuring - Finance needs additional computer',
    status: 'Pending',
    requestDate: '2024-03-15T10:30:00Z'
  }
];

export const mockDisposalRequests: DisposalRequest[] = [
  {
    id: '1',
    assetId: '4',
    asset: mockAssets[3],
    reason: 'Asset condition marked as obsolete - no longer functional',
    method: 'Recycling',
    requestedBy: '3',
    requestedByName: 'Michael Brown',
    status: 'Pending',
    requestDate: '2024-03-20T14:30:00Z'
  }
];

export const mockDisposalRecords: DisposalRecord[] = [];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '2',
    title: 'New Transfer Request',
    message: 'Transfer request for Dell OptiPlex 7090 from IT to Finance requires approval',
    type: 'transfer_request',
    isRead: false,
    createdAt: '2024-03-15T10:30:00Z',
    relatedId: '1'
  },
  {
    id: '2',
    userId: '1',
    title: 'New Disposal Request',
    message: 'Disposal request for Old Desktop Computer - obsolete condition submitted',
    type: 'disposal_request',
    isRead: false,
    createdAt: '2024-03-20T14:30:00Z',
    relatedId: '1'
  },
  {
    id: '3',
    userId: '1',
    title: 'Transfer Approved',
    message: 'HP LaserJet Pro transfer from Engineering to Finance has been approved',
    type: 'transfer_approved',
    isRead: true,
    createdAt: '2024-03-18T09:15:00Z',
    relatedId: '2'
  },
  {
    id: '4',
    userId: '3',
    title: 'System Maintenance',
    message: 'Scheduled system maintenance on March 25th from 2:00 AM to 4:00 AM',
    type: 'system',
    isRead: false,
    createdAt: '2024-03-19T16:00:00Z'
  },
  {
    id: '5',
    userId: '1',
    title: 'Weekly Report Available',
    message: 'Your weekly asset management report is ready for review',
    type: 'system',
    isRead: true,
    createdAt: '2024-03-17T08:00:00Z'
  }
];

export const mockActivityLogs = [
  {
    id: '1',
    userId: '1',
    userEmail: 'admin@tum.ac.ke',
    action: 'Asset Created',
    resourceType: 'asset' as const,
    resourceId: '1',
    details: 'Created new asset: Dell OptiPlex 7090',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2024-03-15T10:00:00Z'
  },
  {
    id: '2',
    userId: '3',
    userEmail: 'it.head@tum.ac.ke',
    action: 'Transfer Request',
    resourceType: 'transfer' as const,
    resourceId: '1',
    details: 'Submitted transfer request for Dell OptiPlex 7090',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    timestamp: '2024-03-15T10:30:00Z'
  },
  {
    id: '3',
    userId: '1',
    userEmail: 'admin@tum.ac.ke',
    action: 'User Login',
    resourceType: 'system' as const,
    details: 'User successfully logged in',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2024-03-21T08:15:00Z'
  }
];
