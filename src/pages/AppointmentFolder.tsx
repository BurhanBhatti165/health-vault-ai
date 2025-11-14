import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Activity, ArrowLeft, Upload, FileText, Loader2 } from "lucide-react";
import { DocumentCard } from "@/components/DocumentCard";
import { DocumentUploadDialog } from "@/components/DocumentUploadDialog";

const AppointmentFolder = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [doctorFolder, setDoctorFolder] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/auth");
      return;
    }
    const userData = JSON.parse(user);
    setUserId(userData.id);
    
    const appointments = JSON.parse(localStorage.getItem("appointments") || "[]");
    const currentAppointment = appointments.find(a => a.id === appointmentId);
    
    if (!currentAppointment) {
      navigate("/dashboard");
      return;
    }
    
    setAppointment(currentAppointment);
    
    const folders = JSON.parse(localStorage.getItem("doctorFolders") || "[]");
    const doctor = folders.find(f => f.id === currentAppointment.doctor_folder_id);
    setDoctorFolder(doctor);
    
    const allDocs = JSON.parse(localStorage.getItem("documents") || "[]");
    const appointmentDocs = allDocs.filter(d => d.appointment_folder_id === appointmentId);
    setDocuments(appointmentDocs);
    
    setLoading(false);
  }, [appointmentId, navigate]);

  const handleUploadDocument = async (file) => {
    if (!appointmentId || !userId) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${appointmentId}/${fileName}`;

    const newDoc = {
      id: "doc-" + Date.now(),
      appointment_folder_id: appointmentId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      processing_status: "uploaded",
      created_at: new Date().toISOString()
    };

    const allDocs = JSON.parse(localStorage.getItem("documents") || "[]");
    const updated = [newDoc, ...allDocs];
    localStorage.setItem("documents", JSON.stringify(updated));
    
    setDocuments([newDoc, ...documents]);
    toast.success("Document uploaded successfully");
    setUploadDialogOpen(false);
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
