export type Phlebotomist = {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  photo_url?: string;
  experience_years: number;
  specialisations: string[];
  location: {
    lat: number;
    lng: number;
  };
  home_address?: string;
  service_radius_km: number;
  is_available: boolean;
  status: 'active' | 'on_leave' | 'off_duty';
  notes?: string;
  created_at: string;
  deleted_at?: string;
};

export type Assignment = {
  id: string;
  phlebotomist_id: string;
  patient_area: string;
  patient_lat: number;
  patient_lng: number;
  dispatcher_id: string;
  dispatcher_email: string;
  assigned_at: string;
  notes?: string;
};

export type NearestPhlebotomist = {
  id: string;
  name: string;
  phone: string;
  experience_years: number;
  distance_km: number;
  is_available: boolean;
  status: string;
  notes: string;
};
