import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Activity, ArrowLeft, Upload, FileText, Loader2 } from "lucide-react";
import { DocumentCard } from "@/components/DocumentCard";
import { DocumentUploadDialog } from "@/components/DocumentUploadDialog";

interface AppointmentFolder {
  id: string;
  appointment_date: string;
  notes: string | null;
  doctor_folder_id: string;
}

interface DoctorFolder {
  id: string;
  doctor_name: string;
}

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  processing_status: string;
  created_at: string;
}

const AppointmentFolder = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentFolder | null>(null);
  const [doctorFolder, setDoctorFolder] = useState<DoctorFolder | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      await fetchAppointmentDetails();
      await fetchDocuments();
      setLoading(false);
    };

    initialize();
  }, [appointmentId, navigate]);

  const fetchAppointmentDetails = async () => {
    if (!appointmentId) return;

    const { data, error } = await supabase
      .from("appointment_folders")
      .select(`
        *,
        doctor_folders:doctor_folder_id (
          id,
          doctor_name
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (error) {
      console.error("Error fetching appointment:", error);
      toast.error("Failed to load appointment");
      navigate("/dashboard");
      return;
    }

    setAppointment(data);
    setDoctorFolder(data.doctor_folders as any);
  };

  const fetchDocuments = async () => {
    if (!appointmentId) return;

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("appointment_folder_id", appointmentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
      return;
    }

    setDocuments(data || []);
  };

  const handleUploadDocument = async (file: File) => {
    if (!appointmentId || !userId) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${appointmentId}/${fileName}`;

    try {
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("medical-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase
        .from("documents")
        .insert({
          appointment_folder_id: appointmentId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          processing_status: "uploaded",
        });

      if (dbError) throw dbError;

      toast.success("Document uploaded successfully");
      await fetchDocuments();
      setUploadDialogOpen(false);
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    }
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

  if (!appointment || !doctorFolder) return null;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/doctor/${appointment.doctor_folder_id}`)}
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
                <h1 className="text-xl font-bold text-foreground">
                  {doctorFolder.doctor_name} - {new Date(appointment.appointment_date).toLocaleDateString()}
                </h1>
                {appointment.notes && (
                  <p className="text-xs text-muted-foreground">{appointment.notes}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-bold text-foreground">Documents</h2>
            <Button
              onClick={() => setUploadDialogOpen(true)}
              className="gap-2 shadow-hover hover:shadow-card transition-all"
            >
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </div>
          <p className="text-muted-foreground">
            Medical records, prescriptions, and lab results for this appointment
          </p>
        </div>

        {documents.length === 0 ? (
          <Card className="shadow-card border-border/50">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-primary w-fit">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">No Documents Yet</CardTitle>
              <CardDescription className="text-base">
                Upload medical documents, prescriptions, or lab results for this appointment
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <Button
                onClick={() => setUploadDialogOpen(true)}
                size="lg"
                className="gap-2"
              >
                <Upload className="h-5 w-5" />
                Upload First Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                userId={userId!}
              />
            ))}
          </div>
        )}
      </main>

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUploadDocument}
      />
    </div>
  );
};

export default AppointmentFolder;
