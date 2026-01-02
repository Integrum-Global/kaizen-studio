# Authentication

**Date**: 2025-12-11
**Status**: Planning

---

## Overview

This document defines the authentication implementation for Kaizen Studio frontend, integrating with the backend JWT + SSO system.

### Backend Auth Features (Already Implemented)
- JWT access/refresh tokens
- OAuth2 password flow for login
- SSO with Azure AD, Okta, Google Workspace
- RBAC + ABAC permission system
- Session management

---

## Auth Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Authentication Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User → Login Page → POST /auth/login → JWT Tokens              │
│                                                                 │
│  ┌─────────────┐                                               │
│  │ Auth Store  │ ← Store tokens, user, permissions             │
│  └─────────────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                               │
│  │ API Client  │ ← Attach Bearer token to all requests         │
│  └─────────────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  401 Received? → Try Refresh → Success? → Retry Request        │
│                       │                                         │
│                       └─→ Failed? → Redirect to Login          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Login Implementation

### Login Page

```typescript
// pages/auth/LoginPage.tsx
import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useLogin } from '@/features/auth/hooks/useAuth'
import { SSOButtons } from '@/features/auth/components/SSOButtons'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()

  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard'

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login.mutateAsync(data)
      navigate(from, { replace: true })
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Kaizen Studio</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@company.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {login.error && (
              <div className="text-sm text-destructive">
                {login.error.message || 'Invalid email or password'}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </Form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <SSOButtons />

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
```

### Auth Hooks

```typescript
// features/auth/hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService, LoginCredentials, RegisterData } from '@/services/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { queryKeys } from '@/lib/queryKeys'
import { toast } from '@/components/ui/toast'

// Login mutation
export function useLogin() {
  const { login } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const tokens = await authService.login(credentials)
      const user = await authService.getCurrentUser()
      return { tokens, user }
    },
    onSuccess: ({ tokens, user }) => {
      login(user, { access: tokens.access_token, refresh: tokens.refresh_token })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.current })
      toast.success('Welcome back!')
    },
    onError: () => {
      toast.error('Invalid email or password')
    },
  })
}

// Register mutation
export function useRegister() {
  const { login } = useAuthStore()

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: ({ user, tokens }) => {
      login(user, { access: tokens.access_token, refresh: tokens.refresh_token })
      toast.success('Account created successfully!')
    },
    onError: () => {
      toast.error('Registration failed. Email may already be in use.')
    },
  })
}

// Logout
export function useLogout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      logout()
      queryClient.clear()
      navigate('/login')
    },
  })
}

// Get current user
export function useCurrentUser() {
  const { isAuthenticated, accessToken } = useAuthStore()

  return useQuery({
    queryKey: queryKeys.user.current,
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated && !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Check if user has permission
export function useHasPermission(permission: string): boolean {
  const { hasPermission } = useAuthStore()
  return hasPermission(permission)
}

// Permission gate hook
export function usePermissionGate(
  requiredPermission: string,
  options?: { redirectTo?: string }
) {
  const navigate = useNavigate()
  const hasPermission = useHasPermission(requiredPermission)

  if (!hasPermission && options?.redirectTo) {
    navigate(options.redirectTo)
  }

  return hasPermission
}
```

---

## SSO Implementation

### SSO Buttons

```typescript
// features/auth/components/SSOButtons.tsx
import { Button } from '@/components/ui/button'
import { authService } from '@/services/api/auth'

const SSO_PROVIDERS = [
  {
    id: 'azure',
    name: 'Microsoft',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 21 21">
        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
      </svg>
    ),
  },
  {
    id: 'google',
    name: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
  },
  {
    id: 'okta',
    name: 'Okta',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#007DC1" />
        <circle cx="12" cy="12" r="4" fill="white" />
      </svg>
    ),
  },
]

export function SSOButtons() {
  const handleSSO = async (provider: string) => {
    try {
      const { authorization_url } = await authService.ssoInitiate(provider)
      // Store current location for redirect after callback
      sessionStorage.setItem('sso_redirect', window.location.pathname)
      // Redirect to SSO provider
      window.location.href = authorization_url
    } catch (error) {
      console.error('SSO initiation failed:', error)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {SSO_PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          onClick={() => handleSSO(provider.id)}
          className="flex items-center justify-center gap-2"
        >
          {provider.icon}
          <span className="sr-only">{provider.name}</span>
        </Button>
      ))}
    </div>
  )
}
```

### SSO Callback Page

```typescript
// pages/auth/SSOCallbackPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { authService } from '@/services/api/auth'
import { useAuthStore } from '@/stores/authStore'

export function SSOCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const provider = searchParams.get('provider') || 'azure'

      if (!code || !state) {
        setError('Invalid callback parameters')
        return
      }

      try {
        const tokens = await authService.ssoCallback(provider, code, state)
        const user = await authService.getCurrentUser()

        login(user, {
          access: tokens.access_token,
          refresh: tokens.refresh_token,
        })

        // Redirect to saved location or dashboard
        const redirect = sessionStorage.getItem('sso_redirect') || '/dashboard'
        sessionStorage.removeItem('sso_redirect')
        navigate(redirect, { replace: true })
      } catch (error) {
        setError('SSO authentication failed')
      }
    }

    handleCallback()
  }, [searchParams, navigate, login])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">{error}</h2>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 text-primary hover:underline"
          >
            Return to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
```

---

## Protected Routes

### Auth Provider

```typescript
// app/providers/AuthProvider.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/api/auth'
import { LoadingScreen } from '@/components/shared/LoadingScreen'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { accessToken, setUser, setPermissions, logout } = useAuthStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      if (accessToken) {
        try {
          // Validate token and get user
          const user = await authService.getCurrentUser()
          setUser(user)

          // Load permissions
          // TODO: Add permissions endpoint
          // const permissions = await authService.getPermissions()
          // setPermissions(permissions)
        } catch (error) {
          // Token invalid, clear auth state
          logout()
        }
      }
      setIsInitialized(true)
    }

    initAuth()
  }, [accessToken, setUser, setPermissions, logout])

  if (!isInitialized) {
    return <LoadingScreen />
  }

  return <>{children}</>
}
```

### Permission Gate Component

```typescript
// components/shared/PermissionGate.tsx
import { useAuthStore } from '@/stores/authStore'

interface PermissionGateProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission } = useAuthStore()

  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Usage example:
// <PermissionGate permission="agents:create">
//   <Button>Create Agent</Button>
// </PermissionGate>
```

### Protected Route Component

```typescript
// components/layout/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
}

export function ProtectedRoute({
  children,
  requiredPermission,
}: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
```

---

## Token Refresh Logic

The token refresh is handled in the API client interceptor (see 05-api-integration.md).

Key behaviors:
1. On 401 response, attempt to refresh token
2. Queue all subsequent requests while refreshing
3. On successful refresh, retry all queued requests
4. On failed refresh, logout and redirect to login
5. Use broadcast channel to sync logout across tabs

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [04-state-management.md](04-state-management.md) | Auth store |
| [05-api-integration.md](05-api-integration.md) | API client interceptors |
