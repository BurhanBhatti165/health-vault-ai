import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { appointmentAPI } from "@/api/appointments";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Calendar, FileText, Download, Eye, Trash2, Edit2, Save, X, Upload } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

const AppointmentDetail = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const { user: profile } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null);
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    console.log("🔍 [AppointmentDetail] Component mounted, appointmentId:", appointmentId);
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    console.log("📡 [AppointmentDetail] Loading appointment...");
    try {
      setLoading(true);
      const response = await appointmentAPI.getAppointment(appointmentId);
      console.log("✅ [AppointmentDetail] Appointment loaded:", response.data.appointment);
      setAppointment(response.data.appointment);
      setNotes(response.data.appointment.notes || "");
    } catch (error) {
      console.error("❌ [AppointmentDetail] Error loading appointment:", error);
      console.error("❌ [AppointmentDetail] Error details:", error.response?.data);
      toast.error("Failed to load appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    console.log("💾 [AppointmentDetail] Saving notes:", notes);
    try {
      const response = await appointmentAPI.updateAppointment(appointmentId, { notes });
      console.log("✅ [AppointmentDetail] Notes saved:", response.data.appointment);
      setAppointment(response.data.appointment);
      setEditingNotes(false);
      toast.success("Notes updated successfully");
    } catch (error) {
      console.error("❌ [AppointmentDetail] Error updating notes:", error);
      console.error("❌ [AppointmentDetail] Error details:", error.response?.data);
      toast.error("Failed to update notes");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("📤 [AppointmentDetail] Uploading file:", file.name, `(${file.size} bytes)`);
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await appointmentAPI.uploadDocument(appointmentId, formData);
      console.log("✅ [AppointmentDetail] File uploaded:", response.data.appointment);
      setAppointment(response.data.appointment);
      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("❌ [AppointmentDetail] Error uploading document:", error);
      console.error("❌ [AppointmentDetail] Error details:", error.response?.data);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveDocument = async (documentId) => {
    if (!confirm("Are you sure you want to remove this document?")) return;

    console.log("🗑️ [AppointmentDetail] Removing document:", documentId);
    try {
      const response = await appointmentAPI.removeDocument(appointmentId, documentId);
      console.log("✅ [AppointmentDetail] Document removed:", response.data.appointment);
      setAppointment(response.data.appointment);
      toast.success("Document removed successfully");
    } catch (error) {
      console.error("❌ [AppointmentDetail] Error removing document:", error);
      console.error("❌ [AppointmentDetail] Error details:", error.response?.data);
      toast.error("Failed to remove document");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    
    console.log("🗑️ [AppointmentDetail] Deleting appointment:", appointmentId);
    try {
      await appointmentAPI.deleteAppointment(appointmentId);
      console.log("✅ [AppointmentDetail] Appointment deleted");
      toast.success("Appointment deleted successfully");
      navigate("/dashboard");
    } catch (error) {
      console.error("❌ [AppointmentDetail] Error deleting appointment:", error);
      console.error("❌ [AppointmentDetail] Error details:", error.response?.data);
      toast.error("Failed to delete appointment");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Appointment Not Found</CardTitle>
            <CardDescription>Unable to find this appointment.</CardDescription>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isPatient = profile?.role === "Patient";

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {isPatient && (
              <Button variant="destructive" onClick={handleDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Appointment Date Card */}
        <Card className="mb-6 shadow-card">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-gradient-primary">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </CardTitle>
                <CardDescription className="text-base">
                  {new Date(appointment.appointmentDate).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Doctor/Patient Info */}
        <Card className="mb-6 shadow-card">
          <CardHeader>
            <div className="flex items-start gap-4">
              <UserAvatar 
                user={isPatient ? appointment.doctorId : appointment.patientId} 
                size="xl" 
              />
              <div className="flex-1">
                {isPatient ? (
                  <>
                    <CardTitle className="text-xl mb-2">{appointment.doctorId?.name}</CardTitle>
                    <CardDescription className="space-y-1">
                      {appointment.doctorId?.specialty && (
                        <div className="text-primary font-medium">{appointment.doctorId.specialty}</div>
                      )}
                      {appointment.doctorId?.hospital && <div>{appointment.doctorId.hospital}</div>}
                      <div>{appointment.doctorId?.email}</div>
                    </CardDescription>
                  </>
                ) : (
                  <>
                    <CardTitle className="text-xl mb-2">{appointment.patientId?.name}</CardTitle>
                    <CardDescription>
                      <div>{appointment.patientId?.email}</div>
                    </CardDescription>
                  </>
                )}
              </div>
            </div>
            {((isPatient && appointment.doctorId?.bio) || (!isPatient && appointment.patientId?.bio)) && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="text-sm text-muted-foreground mb-1">About</div>
                <p className="text-sm">
                  {isPatient ? appointment.doctorId.bio : appointment.patientId.bio}
                </p>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Notes */}
        <Card className="mb-6 shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notes</CardTitle>
              {isPatient && !editingNotes && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingNotes(true)}
                  className="gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingNotes ? (
              <div className="space-y-3">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this appointment..."
                  rows={4}
                  className="w-full"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveNotes} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNotes(appointment.notes || "");
                      setEditingNotes(false);
                    }}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                {appointment.notes || "No notes added yet."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="mb-6 shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Medical Documents</CardTitle>
                  <CardDescription>
                    {appointment.documents?.length || 0} document{appointment.documents?.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
              {isPatient && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload Document"}
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {appointment.documents && appointment.documents.length > 0 ? (
              <div className="space-y-3">
                {appointment.documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{doc.fileName}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.cloudStorageURL, '_blank')}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = doc.cloudStorageURL;
                          link.download = doc.fileName;
                          link.click();
                        }}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {isPatient && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveDocument(doc._id)}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No documents uploaded yet</p>
                {isPatient && (
                  <p className="text-sm mt-1">Click "Upload Document" to add files</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* OCR Text from Documents */}
        {appointment.documents && appointment.documents.some(doc => doc.ocrText) && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Extracted Text (OCR)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointment.documents.map((doc) => (
                doc.ocrText && (
                  <div key={doc._id}>
                    <div className="text-sm font-medium mb-2 text-muted-foreground">
                      From: {doc.fileName}
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-mono">
                        {doc.ocrText}
                      </pre>
                    </div>
                  </div>
                )
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AppointmentDetail;
