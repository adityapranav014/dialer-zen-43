import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const AuthCallback = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      // If the provider sends back an error, send user to auth page.
      navigate("/", { replace: true });
      return;
    }

    if (!loading) {
      if (user) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, loading, navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground text-sm">Finishing sign-in with Google…</p>
      </div>
    </div>
  );
};

export default AuthCallback;

