import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Activity, ArrowLeft, Plus, Calendar, Search } from "lucide-react";
import { AppointmentCard } from "@/components/AppointmentCard";
import { CreateAppointmentDialog } from "@/components/CreateAppointmentDialog";
import { DateRangePicker } from "@/components/DateRangePicker";

const DoctorFolder = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctorFolder, setDoctorFolder] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/auth");
      return;
    }
    
    const folders = JSON.parse(localStorage.getItem("doctorFolders") || "[]");
    const folder = folders.find(f => f.id === doctorId);
    
    if (!folder) {
      navigate("/dashboard");
      return;
    }
    
    setDoctorFolder(folder);
    
    const allAppointments = JSON.parse(localStorage.getItem("appointments") || "[]");
    const doctorAppointments = allAppointments.filter(a => a.doctor_folder_id === doctorId);
    setAppointments(doctorAppointments);
    
    setLoading(false);
  }, [doctorId, navigate]);

  const handleCreateAppointment = (data) => {
    const newAppointment = {
      id: "apt-" + Date.now(),
      doctor_folder_id: doctorId,
      appointment_date: data.appointment_date,
      notes: data.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const allAppointments = JSON.parse(localStorage.getItem("appointments") || "[]");
    const updated = [newAppointment, ...allAppointments];
    localStorage.setItem("appointments", JSON.stringify(updated));
    
    setAppointments([newAppointment, ...appointments]);
    toast.success("Appointment folder created successfully!");
    setCreateDialogOpen(false);
  };

  const filteredAppointments = appointments.filter(appointment => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = appointment.notes?.toLowerCase().includes(searchLower) ||
      new Date(appointment.appointment_date).toLocaleDateString().toLowerCase().includes(searchLower);
    
    if (!dateRange.from || !dateRange.to) return matchesSearch;
    
    const appointmentDate = new Date(appointment.appointment_date);
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    
    const matchesDateRange = appointmentDate >= fromDate && appointmentDate <= toDate;
    
    return matchesSearch && matchesDateRange;
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

  if (!doctorFolder) return null;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{doctorFolder.doctor_name}</h1>
                {doctorFolder.specialization && (
                  <p className="text-xs text-muted-foreground">{doctorFolder.specialization}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-foreground">Appointments</h2>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="gap-2 shadow-hover hover:shadow-card transition-all"
            >
              <Plus className="h-4 w-4" />
              New Appointment
            </Button>
          </div>
          <p className="text-muted-foreground mb-4">
            Track your appointments and medical visits with {doctorFolder.doctor_name}
          </p>
          
          {appointments.length > 0 && (
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search appointments by date or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>
          )}
        </div>

        {filteredAppointments.length === 0 && (searchQuery || dateRange.from) ? (
          <Card className="shadow-card border-border/50">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 p-4 rounded-full bg-muted w-fit">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">No Results Found</CardTitle>
              <CardDescription className="text-base">
                No appointments match your search or date range. Try adjusting your filters.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : appointments.length === 0 ? (
          <Card className="shadow-card border-border/50">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-primary w-fit">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">No Appointments Yet</CardTitle>
              <CardDescription className="text-base">
                Create your first appointment folder to organize documents by visit date
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <Button
                onClick={() => setCreateDialogOpen(true)}
                size="lg"
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Create First Appointment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onClick={() => navigate(`/appointment/${appointment.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateAppointmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateAppointment}
      />
    </div>
  );
};

export default DoctorFolder;
