import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { setGroupedCards, setLoading as setReduxLoading } from "@/store/slices/medicalSlice";
import { appointmentAPI } from "@/api/appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Activity, Plus, Search, LogOut, Calendar, FileText, Settings } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

const Dashboard_API = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: profile, isAuthenticated } = useSelector((state) => state.auth);
  const { groupedCards, loading } = useSelector((state) => state.medical);
  
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.log("🔍 [Dashboard] Component mounted");
    if (!isAuthenticated) {
      console.log("⚠️ [Dashboard] Not authenticated, redirecting to auth...");
      navigate("/auth");
      return;
    }
    
    loadGroupedAppointments();
  }, [navigate, isAuthenticated]);

  const loadGroupedAppointments = async () => {
    console.log("📡 [Dashboard] Loading grouped appointments...");
    try {
      dispatch(setReduxLoading(true));
      const response = await appointmentAPI.getGroupedAppointments();
      console.log("✅ [Dashboard] Grouped appointments loaded:", response.data.cards);
      dispatch(setGroupedCards(response.data.cards || []));
    } catch (error) {
      console.error("❌ [Dashboard] Error loading appointments:", error);
      console.error("❌ [Dashboard] Error details:", error.response?.data);
      toast.error("Failed to load appointments");
    } finally {
      dispatch(setReduxLoading(false));
    }
  };

  const handleSignOut = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const isDoctor = profile?.role === "Doctor";

  // Filter cards based on search
  const filteredCards = groupedCards.filter(card => {
    const searchLower = searchQuery.toLowerCase();
    if (isDoctor) {
      // Doctor searching patients
      const patient = card.patient;
      return (
        patient.name?.toLowerCase().includes(searchLower) ||
        patient.email?.toLowerCase().includes(searchLower)
      );
    } else {
      // Patient searching doctors
      const doctor = card.doctor;
      return (
        doctor.name?.toLowerCase().includes(searchLower) ||
        doctor.specialty?.toLowerCase().includes(searchLower) ||
        doctor.hospital?.toLowerCase().includes(searchLower)
      );
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex items-center gap-2 text-primary">
          <Activity className="h-6 w-6 animate-pulse" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar user={profile} size="md" />
              <div>
                <h1 className="text-xl font-bold text-foreground">HealthVault AI</h1>
                <p className="text-xs text-muted-foreground">
                  Welcome back, {profile?.name || profile?.email} ({isDoctor ? "Doctor" : "Patient"})
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")} className="gap-2">
                <Settings className="h-4 w-4" />
                Profile
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-full overflow-hidden">
        {/* Appointments Section */}
        <div className="w-full max-w-full">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-foreground">
                  {isDoctor ? "My Patients" : "My Appointments"}
                </h2>
                {!isDoctor && (
                  <Button
                    onClick={() => navigate("/appointments/new")}
                    className="gap-2 shadow-hover hover:shadow-card transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    New Appointment
                  </Button>
                )}
              </div>
              
              {groupedCards.length > 0 && (
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={isDoctor ? "Search patients..." : "Search doctors..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
            </div>

            {filteredCards.length === 0 && searchQuery ? (
              <Card className="shadow-card border-border/50">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-4 p-4 rounded-full bg-muted w-fit">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-2xl">No Results Found</CardTitle>
                  <CardDescription className="text-base">
                    No {isDoctor ? "patients" : "doctors"} match your search.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : groupedCards.length === 0 ? (
              <Card className="shadow-card border-border/50">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-primary w-fit">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">
                    {isDoctor ? "No Patients Yet" : "No Appointments Yet"}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {isDoctor 
                      ? "Your patients will appear here once they create appointments with you."
                      : "Create your first appointment to get started."}
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid gap-6 w-full">
                {filteredCards.map((card, index) => {
                  const person = isDoctor ? card.patient : card.doctor;
                  const appointments = card.appointments || [];
                  
                  return (
                <Card 
                  key={index} 
                  className="shadow-card border-border/50 hover:shadow-lg transition-all cursor-pointer overflow-hidden w-full"
                  onClick={() => {
                    // Navigate to detail view with person ID
                    if (isDoctor) {
                      navigate(`/patient/${person._id}`);
                    } else {
                      navigate(`/doctor/${person._id}`);
                    }
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <UserAvatar user={person} size="lg" className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl mb-2">{person.name}</CardTitle>
                          <CardDescription className="space-y-1">
                            <div>{person.email}</div>
                            {!isDoctor && person.specialty && (
                              <div className="text-primary font-medium">{person.specialty}</div>
                            )}
                            {!isDoctor && person.hospital && (
                              <div>{person.hospital}</div>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Show appointment preview */}
                    {appointments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="text-sm text-muted-foreground mb-2">Recent Appointments:</div>
                        <div className="space-y-2">
                          {appointments.slice(0, 3).map((apt) => (
                            <div 
                              key={apt._id} 
                              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/appointment/${apt._id}`);
                              }}
                            >
                              <FileText className="h-4 w-4 text-primary" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {new Date(apt.appointmentDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {apt.documents?.length > 0 && (
                                    <span>{apt.documents.length} document{apt.documents.length !== 1 ? 's' : ''}</span>
                                  )}
                                  {apt.notes && apt.documents?.length > 0 && <span> • </span>}
                                  {apt.notes && <span className="truncate">{apt.notes}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                          {appointments.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{appointments.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard_API;
