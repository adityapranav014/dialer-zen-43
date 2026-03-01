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
        <h1 className="mb-4 text-5xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-xl text-foreground/40">Oops! Page not found</p>
        <a href="/" className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors duration-200">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
