// Central API client for the 2BR Service System REST API
// Fetches the API base URL from configuration.json, manages JWT tokens, and provides typed request helpers.

const CONFIG_URL = "https://2gr.softcamp.hu/configuration.json";

let _apiAddress: string | null = null;

// ─── Configuration ───────────────────────────────────────────
export async function getApiAddress(): Promise<string> {
  if (_apiAddress) return _apiAddress;
  const res = await fetch(CONFIG_URL);
  if (!res.ok) throw new Error("Nem sikerült betölteni az API konfigurációt");
  const json = await res.json();
  if (!json.api_address) throw new Error("Hiányzó api_address a konfigurációban");
  _apiAddress = json.api_address;
  return _apiAddress!;
}

// ─── Token helpers ───────────────────────────────────────────
const TOKEN_KEY = "2br_access_token";
const REFRESH_KEY = "2br_refresh_token";
const USER_KEY = "2br_user";

export interface ApiUser {
  id: number;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  permission: "CLIENT" | "ADMIN";
  is_confirmed?: number;
  is_banned?: number;
  notes?: string;
  created_at?: number;
  updated_at?: number;
}

export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  };
}

export function getStoredUser(): ApiUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeAuth(accessToken: string, refreshToken: string, user: ApiUser) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

// ─── Token refresh ───────────────────────────────────────────
let _refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Deduplicate concurrent refresh calls
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const { refreshToken } = getStoredTokens();
    if (!refreshToken) return null;
    try {
      const base = await getApiAddress();
      const res = await fetch(`${base}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) {
        clearAuth();
        return null;
      }
      const json = await res.json();
      if (json.success && json.data) {
        localStorage.setItem(TOKEN_KEY, json.data.access_token);
        localStorage.setItem(REFRESH_KEY, json.data.refresh_token);
        return json.data.access_token as string;
      }
      clearAuth();
      return null;
    } catch {
      clearAuth();
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ─── Generic request helper ──────────────────────────────────
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  code?: number;
  timestamp?: number;
}

export interface PaginatedData<T> {
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  [key: string]: T[] | any;
}

interface RequestOptions {
  method?: string;
  body?: any;
  params?: Record<string, string | number | undefined>;
  auth?: boolean; // default true
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = "GET", body, params, auth = true } = options;
  const base = await getApiAddress();

  let url = `${base}${path}`;
  if (params) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") sp.set(k, String(v));
    }
    const qs = sp.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth) {
    let token = getStoredTokens().accessToken;
    if (!token) {
      return { success: false, message: "Nincs bejelentkezve", code: 401 };
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // If 401, try to refresh and retry once
  if (res.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } else {
      return { success: false, message: "Munkamenet lejárt, kérjük jelentkezzen be újra", code: 401 };
    }
  }

  const json: ApiResponse<T> = await res.json();
  return json;
}

// ─── Auth API ────────────────────────────────────────────────
export interface LoginResponse {
  user: ApiUser;
  access_token: string;
  refresh_token: string;
}

export async function apiLogin(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
  const result = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  if (result.success && result.data) {
    storeAuth(result.data.access_token, result.data.refresh_token, result.data.user);
  }
  return result;
}

export interface RegisterBody {
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
}

export async function apiRegister(body: RegisterBody): Promise<ApiResponse<LoginResponse>> {
  const result = await apiRequest<LoginResponse>("/auth/register", {
    method: "POST",
    body,
    auth: false,
  });
  if (result.success && result.data) {
    storeAuth(result.data.access_token, result.data.refresh_token, result.data.user);
  }
  return result;
}

export async function apiLogout(): Promise<void> {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
  clearAuth();
}

// ─── Locations ───────────────────────────────────────────────
export interface Location {
  id: number;
  name: string;
  zip: string;
  city: string;
  address: string;
  phone: string;
  description: string | null;
  is_visible: number;
}

export async function getLocations(): Promise<Location[]> {
  const res = await apiRequest<Location[]>("/locations", { auth: false });
  return res.data || [];
}

export async function getLocation(id: number): Promise<Location | null> {
  const res = await apiRequest<Location>(`/locations/${id}`, { auth: false });
  return res.data || null;
}

// ─── Location Stations ──────────────────────────────────────
export interface LocationStation {
  id: number;
  location_id: number;
  name: string;
  description: string | null;
  is_visible: number;
}

export async function getLocationStations(locationId?: number): Promise<LocationStation[]> {
  const res = await apiRequest<LocationStation[]>("/location-stations", {
    auth: false,
    params: locationId ? { location_id: locationId } : undefined,
  });
  return res.data || [];
}

// ─── Vehicles (vehicle types) ────────────────────────────────
export interface VehicleType {
  id: number;
  name: string;
  avatar: string | null;
  description: string | null;
  is_visible: number;
}

export async function getVehicleTypes(): Promise<VehicleType[]> {
  const res = await apiRequest<VehicleType[]>("/vehicles", { auth: false });
  return res.data || [];
}

// ─── User Vehicles ───────────────────────────────────────────
export interface UserVehicle {
  id: number;
  user_id: number;
  vehicle_type_id: number;
  name: string | null;
  vin: string | null;
  license_plate: string | null;
  year: number | null;
  color: string | null;
  notes: string | null;
  vehicle_type?: { id: number; name: string; avatar?: string };
}

export async function getUserVehicles(): Promise<UserVehicle[]> {
  const res = await apiRequest<UserVehicle[]>("/user-vehicles");
  return res.data || [];
}

export async function createUserVehicle(body: {
  vehicle_type_id: number;
  name?: string;
  vin?: string;
  license_plate?: string;
  year?: number;
  color?: string;
  notes?: string;
}): Promise<ApiResponse<UserVehicle>> {
  return apiRequest<UserVehicle>("/user-vehicles", { method: "POST", body });
}

export async function updateUserVehicle(id: number, body: Partial<UserVehicle>): Promise<ApiResponse<UserVehicle>> {
  return apiRequest<UserVehicle>(`/user-vehicles/${id}`, { method: "PUT", body });
}

export async function deleteUserVehicle(id: number): Promise<ApiResponse> {
  return apiRequest(`/user-vehicles/${id}`, { method: "DELETE" });
}

// ─── Services ────────────────────────────────────────────────
export interface Service {
  id: number;
  category_id: number | null;
  image_url: string | null;
  name: string;
  description: string | null;
  duration_in_hours: number | null;
  price_net: number | null;
  price: number | null;
  is_visible: number;
}

export async function getServices(): Promise<Service[]> {
  const res = await apiRequest<Service[]>("/services", { auth: false });
  return res.data || [];
}

export async function getService(id: number): Promise<Service | null> {
  const res = await apiRequest<Service>(`/services/${id}`, { auth: false });
  return res.data || null;
}

// ─── Service Categories ─────────────────────────────────────
export interface ServiceCategory {
  id: number;
  name: string;
  description: string | null;
}

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const res = await apiRequest<ServiceCategory[]>("/service-categories", { auth: false });
  return res.data || [];
}

// ─── Reservations ────────────────────────────────────────────
export interface AvailableSlot {
  start_time: string;
  end_time: string;
}

export async function getAvailableSlots(params: {
  location_id: number;
  service_id: number;
  start_date: string;
  end_date: string;
}): Promise<AvailableSlot[]> {
  const res = await apiRequest<AvailableSlot[]>("/reservations/available-slots", {
    auth: false,
    params: params as any,
  });
  return res.data || [];
}

export interface Reservation {
  id: number;
  user_vehicle_id: number;
  service_id: number;
  location_id: number;
  location_station_id: number;
  reservation_from: string;
  reservation_to: string;
  status: number;
  notes: string | null;
  summarization: string | null;
  price_net: number | null;
  price: number | null;
  request_deletion: number;
  created_at: number;
  workflow?: { id: number; name: string; is_end_state: number };
  vehicle?: UserVehicle;
  service?: Service;
  location?: Location;
}

export async function getMyReservations(): Promise<Reservation[]> {
  const res = await apiRequest<Reservation[]>("/reservations/my");
  return res.data || [];
}

export async function getReservation(id: number): Promise<Reservation | null> {
  const res = await apiRequest<Reservation>(`/reservations/${id}`);
  return res.data || null;
}

export async function createReservation(body: {
  user_vehicle_id: number;
  service_id: number;
  location_id: number;
  reservation_from: string;
  notes?: string;
}): Promise<ApiResponse<Reservation>> {
  return apiRequest<Reservation>("/reservations", { method: "POST", body });
}

export async function updateReservation(id: number, body: Partial<{
  user_vehicle_id: number;
  service_id: number;
  location_id: number;
  reservation_from: string;
  notes: string;
  request_deletion: number;
}>): Promise<ApiResponse<Reservation>> {
  return apiRequest<Reservation>(`/reservations/${id}`, { method: "PUT", body });
}

// ─── Reservation Messages ────────────────────────────────────
export interface ReservationMessage {
  id: number;
  reservation_id: number;
  message: string;
  created_at: number;
  is_admin: number;
  is_deleted: number;
  user_id?: number;
}

export async function getReservationMessages(reservationId: number): Promise<ReservationMessage[]> {
  const res = await apiRequest<ReservationMessage[]>("/reservation-messages", {
    params: { reservation_id: reservationId },
  });
  return res.data || [];
}

export async function sendReservationMessage(reservationId: number, message: string): Promise<ApiResponse<ReservationMessage>> {
  return apiRequest<ReservationMessage>("/reservation-messages", {
    method: "POST",
    body: { reservation_id: reservationId, message },
  });
}

export async function deleteReservationMessage(id: number): Promise<ApiResponse> {
  return apiRequest(`/reservation-messages/${id}`, { method: "DELETE" });
}

// ─── User profile (GET /users/{id} for self) ─────────────────
export async function getMyProfile(): Promise<ApiUser | null> {
  const user = getStoredUser();
  if (!user) return null;
  const res = await apiRequest<ApiUser>(`/users/${user.id}`);
  if (res.success && res.data) {
    // Update stored user
    localStorage.setItem(USER_KEY, JSON.stringify(res.data));
    return res.data;
  }
  return user;
}

// ─── Admin: Users ────────────────────────────────────────────
export async function getUsers(params?: {
  page?: number;
  per_page?: number;
  permission?: string;
  search?: string;
}): Promise<ApiResponse<{ users: ApiUser[]; pagination: any }>> {
  return apiRequest("/users", { params: params as any });
}

export async function getUser(id: number): Promise<ApiResponse<ApiUser>> {
  return apiRequest(`/users/${id}`);
}

export async function createUser(body: any): Promise<ApiResponse<ApiUser>> {
  return apiRequest("/users", { method: "POST", body });
}

export async function updateUser(id: number, body: any): Promise<ApiResponse<ApiUser>> {
  return apiRequest(`/users/${id}`, { method: "PUT", body });
}

export async function deleteUser(id: number): Promise<ApiResponse> {
  return apiRequest(`/users/${id}`, { method: "DELETE" });
}

// ─── Admin: Reservations ─────────────────────────────────────
export async function getAdminReservations(params?: {
  page?: number;
  per_page?: number;
  location_id?: number;
  user_id?: number;
  with_details?: number;
}): Promise<ApiResponse<{ reservations: Reservation[]; pagination: any }>> {
  return apiRequest("/reservations", { params: params as any });
}

export async function adminUpdateReservation(id: number, body: any): Promise<ApiResponse<Reservation>> {
  return apiRequest(`/reservations/${id}`, { method: "PUT", body });
}

// ─── Admin: Locations ────────────────────────────────────────
export async function createLocation(body: any): Promise<ApiResponse<Location>> {
  return apiRequest("/locations", { method: "POST", body });
}

export async function updateLocation(id: number, body: any): Promise<ApiResponse<Location>> {
  return apiRequest(`/locations/${id}`, { method: "PUT", body });
}

export async function deleteLocation(id: number): Promise<ApiResponse> {
  return apiRequest(`/locations/${id}`, { method: "DELETE" });
}

// ─── Admin: Services ─────────────────────────────────────────
export async function createService(body: any): Promise<ApiResponse<Service>> {
  return apiRequest("/services", { method: "POST", body });
}

export async function updateService(id: number, body: any): Promise<ApiResponse<Service>> {
  return apiRequest(`/services/${id}`, { method: "PUT", body });
}

export async function deleteService(id: number): Promise<ApiResponse> {
  return apiRequest(`/services/${id}`, { method: "DELETE" });
}

// ─── Admin: Workflows ────────────────────────────────────────
export interface Workflow {
  id: number;
  category: string | null;
  name: string;
  description: string | null;
  previous_workflow_id: number | null;
  is_default: number;
  is_end_state: number;
  is_active: number;
}

export async function getWorkflows(): Promise<Workflow[]> {
  const res = await apiRequest<Workflow[]>("/workflows");
  return res.data || [];
}

// ─── Admin: Parameters ───────────────────────────────────────
export interface Parameter {
  name: string;
  value: string;
  type: "PLAIN_TEXT" | "SECURED" | "READ_ONLY";
  priority: number;
}

export async function getParameters(): Promise<Parameter[]> {
  const res = await apiRequest<Parameter[]>("/parameters");
  return res.data || [];
}
