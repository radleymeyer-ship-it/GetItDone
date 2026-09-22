export type UserRole = 'customer' | 'pro';

export interface Profile {
  id: string;
  user_type: UserRole;
  full_name: string;
  phone_number?: string;
  suburb?: string;
  city?: string;
  province?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
}