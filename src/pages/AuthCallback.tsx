import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PhoneCall } from "lucide-react";

const AuthCallback = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");

    if (error) {
      toast.error(errorDesc || "Sign-in failed. Please try again.");
      navigate("/", { replace: true });
      return;
    }

    if (!loading) {
      if (user) {
        navigate("/dashboard", { replace: true });
      } else {
        // No session yet — wait a moment for Supabase to process the token
        const timeout = setTimeout(() => {
          navigate("/", { replace: true });
        }, 5000);
        return () => clearTimeout(timeout);
      }
    }
  }, [user, loading, navigate, searchParams]);

  return (
    <div className="flex h-[100dvh] w-screen items-center justify-center bg-[#f4f4f4]">
      <div className="text-center">
        <div className="h-12 w-12 rounded-xl bg-[#1f1f1f] flex items-center justify-center mb-5 mx-auto">
          <PhoneCall className="h-6 w-6 text-white" />
        </div>
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#1f1f1f] border-t-transparent mx-auto" />
        <p className="text-[#1f1f1f]/40 text-sm font-medium">Signing you in…</p>
      </div>
    </div>
  );
};

export default AuthCallback;

