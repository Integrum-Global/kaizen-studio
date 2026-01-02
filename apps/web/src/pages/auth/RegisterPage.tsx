import { useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { useRegister } from "../../features/auth/hooks/useAuth";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "../../components/ui/card";
import { SSOButtons } from "../../features/auth/components/SSOButtons";
import { useToast } from "../../hooks/use-toast";

// Registration form validation schema
const registerSchema = z
  .object({
    name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    organization_name: z
      .string()
      .min(2, "Organization name must be at least 2 characters"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// Password requirements for validation display
const passwordRequirements = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "uppercase", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p: string) => /\d/.test(p) },
];

export function RegisterPage() {
  const { toast } = useToast();
  const registerMutation = useRegister();
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    control,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
      password: "",
    },
  });

  // Watch password for real-time validation feedback
  const password = useWatch({ control, name: "password" }) || "";

  // Calculate password strength
  const passwordValidation = useMemo(() => {
    return passwordRequirements.map((req) => ({
      ...req,
      valid: req.test(password),
    }));
  }, [password]);

  const onSubmit = async (data: RegisterFormData) => {
    // Remove confirmPassword before sending to API
    const { confirmPassword, acceptTerms, ...registrationData } = data;

    registerMutation.mutate(registrationData, {
      onSuccess: () => {
        toast({
          title: "Registration successful",
          description: "Welcome to Kaizen Studio!",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Registration failed",
          description:
            error.response?.data?.detail || "Unable to create account",
          variant: "destructive",
        });
      },
    });
  };

  const handleSSOError = (error: string) => {
    toast({
      title: "SSO Error",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <h1 className="text-2xl font-bold text-center">
            Create Account
          </h1>
          <CardDescription className="text-center">
            Sign up to get started with Kaizen Studio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                autoFocus
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization_name">Organization Name</Label>
              <Input
                id="organization_name"
                type="text"
                placeholder="Acme Inc."
                autoComplete="organization"
                {...register("organization_name")}
                className={errors.organization_name ? "border-red-500" : ""}
              />
              {errors.organization_name && (
                <p className="text-sm text-red-500">
                  {errors.organization_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  {...register("password")}
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  data-testid="password-toggle"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {/* Password requirements display */}
              {password.length > 0 && (
                <div className="space-y-1 mt-2" data-testid="password-requirements">
                  {passwordValidation.map((req) => (
                    <div
                      key={req.id}
                      className={`flex items-center gap-2 text-xs ${
                        req.valid ? "text-green-600" : "text-muted-foreground"
                      }`}
                    >
                      {req.valid ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      <span>{req.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  data-testid="confirm-password-toggle"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="acceptTerms"
                checked={acceptTerms}
                onCheckedChange={(checked) => {
                  setAcceptTerms(checked as boolean);
                  setValue("acceptTerms", checked as boolean);
                }}
              />
              <Label
                htmlFor="acceptTerms"
                className="text-sm font-normal cursor-pointer"
              >
                I accept the{" "}
                <a href="/terms" className="text-primary hover:underline">
                  terms and conditions
                </a>
              </Label>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-red-500">
                {errors.acceptTerms.message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || registerMutation.isPending}
            >
              {isSubmitting || registerMutation.isPending
                ? "Creating account..."
                : "Create Account"}
            </Button>
          </form>

          <SSOButtons onError={handleSSOError} />

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Already have an account?{" "}
            </span>
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
