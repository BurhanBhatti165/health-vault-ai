import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Activity, ArrowLeft, Calendar, Plus, FileText } from "lucide-react";
import { AppointmentCard } from "@/components/AppointmentCard";
import { CreateAppointmentDialog } from "@/components/CreateAppointmentDialog";

interface DoctorFolder {
  id: string;
  doctor_name: string;
  doctor_email: string | null;
  specialization: string | null;
}

interface AppointmentFolder {
  id: string;
  appointment_date: string;
  notes: string | null;
  created_at: string;
}

const DoctorFolder = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [folder, setFolder] = useState<DoctorFolder | null>(null);
  const [appointments, setAppointments] = useState<AppointmentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      await fetchFolderDetails();
      await fetchAppointments();
      setLoading(false);
    };

    initialize();
  }, [doctorId, navigate]);

  const fetchFolderDetails = async () => {
    if (!doctorId) return;

    const { data, error } = await supabase
      .from("doctor_folders")
      .select("*")
      .eq("id", doctorId)
      .single();

    if (error) {
      console.error("Error fetching folder:", error);
      toast.error("Failed to load doctor folder");
      navigate("/dashboard");
      return;
    }

    setFolder(data);
  };

  const fetchAppointments = async () => {
    if (!doctorId) return;

    const { data, error } = await supabase
      .from("appointment_folders")
      .select("*")
      .eq("doctor_folder_id", doctorId)
      .order("appointment_date", { ascending: false });

    if (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
      return;
    }

    setAppointments(data || []);
  };

  const handleCreateAppointment = async (data: { appointment_date: string; notes?: string }) => {
    if (!doctorId) return;

    const { error } = await supabase
      .from("appointment_folders")
      .insert({
        doctor_folder_id: doctorId,
        ...data,
      });

    if (error) {
      console.error("Error creating appointment:", error);
      toast.error("Failed to create appointment folder");
      return;
    }

    toast.success("Appointment folder created successfully");
    await fetchAppointments();
    setCreateDialogOpen(false);
  };

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

  if (!folder) return null;

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
                <h1 className="text-xl font-bold text-foreground">{folder.doctor_name}</h1>
                <p className="text-xs text-muted-foreground">
                  {folder.specialization || "General Practice"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-bold text-foreground">Appointments</h2>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="gap-2 shadow-hover hover:shadow-card transition-all"
            >
              <Plus className="h-4 w-4" />
              New Appointment
            </Button>
          </div>
          <p className="text-muted-foreground">
            Track your visits and medical documents by appointment date
          </p>
        </div>

        {appointments.length === 0 ? (
          <Card className="shadow-card border-border/50">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-primary w-fit">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">No Appointments Yet</CardTitle>
              <CardDescription className="text-base">
                Create an appointment folder to start organizing medical records by date
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
            {appointments.map((appointment) => (
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
