export type AnnouncementTargetType = 'platform' | 'plan' | 'shop' | 'branch';
export type AnnouncementDeliveryMethod = 'in-app' | 'email' | 'push';
export type AnnouncementType = 'information' | 'warning' | 'maintenance' | 'critical' | 'marketing' | 'feature_release';
export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'expired' | 'archived';

export interface AnnouncementTarget {
  type: AnnouncementTargetType;
  ids?: string[]; // Empty if 'platform', otherwise array of plan/shop/branch IDs
}

export interface AnnouncementDeliveryStatus {
  inApp: boolean;
  email: boolean;
  push: boolean;
}

export interface Announcement {
  id?: string;
  title: string;
  message: string;
  type: AnnouncementType;
  target: AnnouncementTarget;
  deliveryMethods: AnnouncementDeliveryMethod[];
  
  status: AnnouncementStatus;
  
  scheduledAt?: string;
  expiresAt?: string;
  timezone: string;
  
  createdBy: string;
  createdAt: string;
  publishedAt?: string;
  updatedAt: string;
  
  metrics: {
    targetCount: number;
    deliveryStatus: AnnouncementDeliveryStatus;
    openRate: number;
  };
}
