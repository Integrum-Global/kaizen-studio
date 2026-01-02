import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../api";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
} from "../types";
import { AxiosError } from "axios";
import queryKeys from "@/lib/queryKeys";

/**
 * Hook to get all users with optional filters
 */
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => usersApi.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get a single user by ID
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get current user profile
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.current(),
    queryFn: () => usersApi.getCurrentUser(),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserRequest) => usersApi.create(input),
    onSuccess: (newUser: any) => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      // Set the new user in cache
      queryClient.setQueryData(queryKeys.users.detail(newUser.id), newUser);
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Create user error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserRequest }) =>
      usersApi.update(id, input),
    onSuccess: (updatedUser: any) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      // Update detail cache
      queryClient.setQueryData(
        queryKeys.users.detail(updatedUser.id),
        updatedUser
      );
      // If updating current user, invalidate auth.current
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.current() });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Update user error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(id) });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Delete user error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}
