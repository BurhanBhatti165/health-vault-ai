import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user");
    
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero">
      <div className="flex items-center gap-2 text-primary">
        <Activity className="h-6 w-6 animate-pulse" />
        <p className="text-lg">Loading HealthVault AI...</p>
      </div>
    </div>
  );
};

export default Index;
