import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex h-[100dvh] w-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-semibold text-foreground">404</h1>
        <p className="mb-4 text-xl text-foreground/40">Oops! Page not found</p>
        <a href="/" className="text-foreground/60 underline hover:text-foreground">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
