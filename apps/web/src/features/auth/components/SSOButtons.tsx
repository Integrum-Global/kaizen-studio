import { Button } from "../../../components/ui/button";
import { Separator } from "../../../components/ui/separator";
import { useSSOInitiate } from "../hooks/useAuth";

/**
 * SSO provider icons as SVG components
 */
const MicrosoftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
    <path d="M0 0h11v11H0z" fill="#f25022" />
    <path d="M12 0h11v11H12z" fill="#00a4ef" />
    <path d="M0 12h11v11H0z" fill="#7fba00" />
    <path d="M12 12h11v11H12z" fill="#ffb900" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const OktaIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#007DC1" />
    <circle cx="12" cy="12" r="5" fill="white" />
  </svg>
);

interface SSOButtonsProps {
  onError?: (error: string) => void;
}

/**
 * SSO Buttons Component
 * Displays buttons for SSO authentication providers
 */
export function SSOButtons({ onError }: SSOButtonsProps) {
  const ssoInitiate = useSSOInitiate();

  const handleSSOClick = (provider: string) => {
    // Save current location for redirect after SSO (but not auth pages)
    const currentPath = window.location.pathname;
    const authPaths = ["/login", "/register", "/auth/callback"];
    const returnUrl = authPaths.some((p) => currentPath.startsWith(p))
      ? "/dashboard"
      : currentPath;
    localStorage.setItem("sso_return_url", returnUrl);

    ssoInitiate.mutate(provider, {
      onError: (error: any) => {
        const errorMessage =
          error.response?.data?.detail || `Failed to initiate ${provider} SSO`;
        if (onError) {
          onError(errorMessage);
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSSOClick("microsoft")}
          disabled={ssoInitiate.isPending}
          className="w-full"
        >
          <MicrosoftIcon />
          <span className="ml-2">Microsoft</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleSSOClick("google")}
          disabled={ssoInitiate.isPending}
          className="w-full"
        >
          <GoogleIcon />
          <span className="ml-2">Google</span>
          <span className="ml-auto text-xs text-muted-foreground">
            Coming soon
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleSSOClick("okta")}
          disabled={ssoInitiate.isPending}
          className="w-full"
        >
          <OktaIcon />
          <span className="ml-2">Okta</span>
          <span className="ml-auto text-xs text-muted-foreground">
            Coming soon
          </span>
        </Button>
      </div>
    </div>
  );
}
