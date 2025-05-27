import apiClient from "@/lib/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys for consistent caching
export const queryKeys = {
  movies: ["movies"] as const,
  movie: (id: number) => ["movies", id] as const,
  theaters: ["theaters"] as const,
  shows: (params?: any) => ["shows", params] as const,
  show: (id: number) => ["shows", id] as const,
  bookings: ["bookings"] as const,
  booking: (id: number) => ["bookings", id] as const,
  dashboard: ["dashboard"] as const,
  salesData: (params?: any) => ["salesData", params] as const,
  employees: ["employees"] as const,
  notifications: ["notifications"] as const,
  coupons: ["coupons"] as const,
  promotions: ["promotions"] as const,
  movieReviews: (movieId: number) => ["movieReviews", movieId] as const,
  currentUser: ["currentUser"] as const,
};

// Auth hooks
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => apiClient.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};

// Movie hooks
export const useMovies = () => {
  return useQuery({
    queryKey: queryKeys.movies,
    queryFn: () => apiClient.getMovies(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useMovie = (id: number) => {
  return useQuery({
    queryKey: queryKeys.movie(id),
    queryFn: () => apiClient.getMovie(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

export const useTheaters = () => {
  return useQuery({
    queryKey: queryKeys.theaters,
    queryFn: () => apiClient.getTheaters(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useShows = (params?: { movie?: number; theater?: number; date?: string }) => {
  return useQuery({
    queryKey: queryKeys.shows(params),
    queryFn: () => apiClient.getShows(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useShow = (id: number) => {
  return useQuery({
    queryKey: queryKeys.show(id),
    queryFn: () => apiClient.getShow(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Booking hooks
export const useBookings = () => {
  return useQuery({
    queryKey: queryKeys.bookings,
    queryFn: () => apiClient.getBookings(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useBooking = (id: number) => {
  return useQuery({
    queryKey: queryKeys.booking(id),
    queryFn: () => apiClient.getBooking(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { show: number; seats: number[]; coupon_code?: string }) => apiClient.createBooking(data),
    onSuccess: () => {
      // Invalidate and refetch bookings
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.cancelBooking(id),
    onSuccess: () => {
      // Invalidate and refetch bookings
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
};

// Dashboard hooks - Updated for real backend integration
export const useDashboardData = () => {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => apiClient.getDashboardData(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ["adminDashboard"],
    queryFn: () => apiClient.getAdminDashboard(),
    staleTime: 2 * 60 * 1000,
  });
};

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ["dashboardMetrics"],
    queryFn: () => apiClient.getDashboardMetrics(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useGenerateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      report_type: "sales" | "movies" | "employees";
      title: string;
      start_date?: string;
      end_date?: string;
      include_charts?: boolean;
      sections?: string[];
    }) => apiClient.generateReport(data),
    onSuccess: () => {
      // Invalidate reports or relevant queries
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};

// Employee hooks
export const useEmployees = () => {
  return useQuery({
    queryKey: queryKeys.employees,
    queryFn: () => apiClient.getEmployees(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiClient.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiClient.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees });
    },
  });
};

// Coupon hooks
export const useCoupons = () => {
  return useQuery({
    queryKey: queryKeys.coupons,
    queryFn: () => apiClient.getCoupons(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: (code: string) => apiClient.validateCoupon(code),
  });
};

// Promotion hooks
export const usePromotions = () => {
  return useQuery({
    queryKey: queryKeys.promotions,
    queryFn: () => apiClient.getPromotions(),
    staleTime: 10 * 60 * 1000,
  });
};

// Notification hooks
export const useNotifications = () => {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => apiClient.getNotifications(),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
};

// Review hooks
export const useMovieReviews = (movieId: number) => {
  return useQuery({
    queryKey: queryKeys.movieReviews(movieId),
    queryFn: () => apiClient.getMovieReviews(movieId),
    enabled: !!movieId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddMovieReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ movieId, data }: { movieId: number; data: { rating: number; comment: string } }) =>
      apiClient.addMovieReview(movieId, data),
    onSuccess: (_, { movieId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.movieReviews(movieId) });
    },
  });
};

// VIP Reservation hooks
export const useCreateVipReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { show_id: string; user_email: string; seat_numbers: string[]; notes?: string }) =>
      apiClient.createVipReservation(data),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
      queryClient.invalidateQueries({ queryKey: queryKeys.shows() });
    },
  });
};
