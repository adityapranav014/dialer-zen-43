/**
 * AuthCallback — Legacy OAuth callback page.
 * No longer used. Redirects to home.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  return null;
};

export default AuthCallback;

