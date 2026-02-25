import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex h-[100dvh] w-screen items-center justify-center bg-[#f4f4f4]">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-semibold text-[#1f1f1f]">404</h1>
        <p className="mb-4 text-xl text-[#1f1f1f]/40">Oops! Page not found</p>
        <a href="/" className="text-[#1f1f1f]/60 underline hover:text-[#1f1f1f]">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
