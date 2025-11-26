import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Activity, Plus, Calendar, FileText, Upload, User, Stethoscope, LogOut, Eye } from "lucide-react";
import { appointmentAPI } from "@/api/appointments";
import { format } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load appointments
      const apptResponse = await appointmentAPI.getAppointments();
      if (apptResponse.success) {
        setAppointments(apptResponse.data.appointments);
      }

      // Load doctors list (only for patients)
      if (user?.role === 'Patient') {
        const docResponse = await appointmentAPI.getDoctors();
        if (docResponse.success) {
          setDoctors(docResponse.data.doctors || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    
    if (!selectedDoctor || !appointmentDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('doctorId', selectedDoctor);
      formData.append('appointmentDate', appointmentDate);
      if (notes) formData.append('notes', notes);
      if (selectedFile) formData.append('file', selectedFile);

      const response = await appointmentAPI.createAppointment(formData);
      
      if (response.success) {
        toast.success('Appointment created successfully!');
        setCreateDialogOpen(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create appointment';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedDoctor('');
    setAppointmentDate('');
    setNotes('');
    setSelectedFile(null);
  };

  const handleViewDocument = (appointment) => {
    if (appointment.cloudStorageURL) {
      window.open(appointment.cloudStorageURL, '_blank');
    } else {
      toast.info('No document attached to this appointment');
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

  const isDoctor = user?.role === 'Doctor';
  const isPatient = user?.role === 'Patient';

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">HealthVault AI</h1>
                <p className="text-xs text-muted-foreground">
                  Welcome back, {user?.name} ({user?.role})
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              {isDoctor ? "Patient Appointments" : "My Appointments"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isDoctor 
                ? "View appointments where you are the assigned doctor" 
                : "Manage your medical appointments and records"}
            </p>
          </div>
          {isPatient && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-hover hover:shadow-card transition-all">
                  <Plus className="h-4 w-4" />
                  New Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Appointment</DialogTitle>
                  <DialogDescription>
                    Schedule an appointment with a doctor and optionally upload medical documents
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAppointment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="doctor">Select Doctor *</Label>
                    <Select value={selectedDoctor} onValueChange={setSelectedDoctor} required>
                      <SelectTrigger id="doctor">
                        <SelectValue placeholder="Choose a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor._id} value={doctor._id}>
                            {doctor.name} - {doctor.specialty || 'General'} 
                            {doctor.hospital && ` (${doctor.hospital})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date">Appointment Date *</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes or symptoms..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">Upload Medical Document (Optional)</Label>
                    <Input
                      id="file"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting} className="flex-1">
                      {submitting ? "Creating..." : "Create Appointment"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {appointments.length === 0 ? (
          <Card className="shadow-card border-border/50">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-primary w-fit">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">No Appointments Yet</CardTitle>
              <CardDescription className="text-base">
                {isDoctor 
                  ? "Appointments from patients will appear here" 
                  : "Create your first appointment to get started"}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <Card key={appointment._id} className="shadow-card border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {isDoctor ? <User className="h-5 w-5 text-primary" /> : <Stethoscope className="h-5 w-5 text-primary" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {isDoctor 
                              ? `Patient: ${appointment.patientId?.name || 'Unknown'}` 
                              : `Dr. ${appointment.doctorId?.name || 'Unknown'}`}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {isDoctor 
                              ? appointment.patientId?.email 
                              : `${appointment.doctorId?.specialty || 'General'} ${appointment.doctorId?.hospital ? `• ${appointment.doctorId.hospital}` : ''}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(appointment.appointmentDate), 'PPP p')}</span>
                      </div>

                      {appointment.notes && (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                          {appointment.notes}
                        </p>
                      )}

                      {appointment.fileName && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="font-medium">{appointment.fileName}</span>
                          {appointment.cloudStorageURL && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDocument(appointment)}
                              className="gap-1 h-7"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </Button>
                          )}
                        </div>
                      )}

                      {appointment.ocrText && (
                        <details className="text-sm">
                          <summary className="cursor-pointer font-medium text-primary hover:underline">
                            View Extracted Text (OCR)
                          </summary>
                          <p className="mt-2 p-3 bg-muted/50 rounded-md whitespace-pre-wrap text-muted-foreground">
                            {appointment.ocrText}
                          </p>
                        </details>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
