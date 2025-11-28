import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { appointmentAPI } from "@/api/appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Upload, X } from "lucide-react";

const CreateAppointment = () => {
  const navigate = useNavigate();
  const { user: profile, isAuthenticated } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    doctorId: "",
    appointmentDate: "",
    notes: ""
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    console.log("🔍 [CreateAppointment] Component mounted");
    console.log("🔍 [CreateAppointment] isAuthenticated:", isAuthenticated);
    console.log("🔍 [CreateAppointment] profile:", profile);
    
    if (!isAuthenticated || profile?.role !== "Patient") {
      console.log("⚠️ [CreateAppointment] Not authenticated or not a patient, redirecting...");
      navigate("/dashboard");
      return;
    }
    loadDoctors();
  }, [isAuthenticated, profile, navigate]);

  const loadDoctors = async () => {
    console.log("📡 [CreateAppointment] Loading doctors...");
    try {
      const response = await appointmentAPI.getDoctors();
      console.log("✅ [CreateAppointment] Doctors loaded:", response.data.doctors);
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error("❌ [CreateAppointment] Error loading doctors:", error);
      console.error("❌ [CreateAppointment] Error details:", error.response?.data);
      toast.error("Failed to load doctors");
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    console.log("📎 [CreateAppointment] Files selected:", files.length);
    files.forEach((file, i) => console.log(`  ${i + 1}. ${file.name} (${file.size} bytes)`));
    setSelectedFiles(prev => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    console.log("🗑️ [CreateAppointment] Removing file at index:", index);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("📝 [CreateAppointment] Form submitted");
    console.log("📝 [CreateAppointment] Form data:", formData);
    console.log("📝 [CreateAppointment] Selected files:", selectedFiles.length);
    
    if (!formData.doctorId || !formData.appointmentDate) {
      console.log("⚠️ [CreateAppointment] Missing required fields");
      toast.error("Please select a doctor and appointment date");
      return;
    }

    try {
      setLoading(true);
      console.log("🚀 [CreateAppointment] Creating appointment...");
      
      // Create appointment with first file (if any)
      const createFormData = new FormData();
      createFormData.append('doctorId', formData.doctorId);
      createFormData.append('appointmentDate', formData.appointmentDate);
      createFormData.append('notes', formData.notes);
      
      if (selectedFiles.length > 0) {
        console.log("📎 [CreateAppointment] Attaching first file:", selectedFiles[0].name);
        createFormData.append('file', selectedFiles[0]);
      }

      const response = await appointmentAPI.createAppointment(createFormData);
      console.log("✅ [CreateAppointment] Appointment created:", response.data.appointment);
      const appointmentId = response.data.appointment._id;

      // Upload remaining files
      if (selectedFiles.length > 1) {
        console.log(`📤 [CreateAppointment] Uploading ${selectedFiles.length - 1} additional files...`);
        for (let i = 1; i < selectedFiles.length; i++) {
          console.log(`📤 [CreateAppointment] Uploading file ${i}/${selectedFiles.length - 1}:`, selectedFiles[i].name);
          const uploadFormData = new FormData();
          uploadFormData.append('file', selectedFiles[i]);
          await appointmentAPI.uploadDocument(appointmentId, uploadFormData);
          console.log(`✅ [CreateAppointment] File ${i} uploaded successfully`);
        }
      }

      console.log("✅ [CreateAppointment] All files uploaded, redirecting...");
      toast.success("Appointment created successfully!");
      navigate(`/appointment/${appointmentId}`);
    } catch (error) {
      console.error("❌ [CreateAppointment] Error creating appointment:", error);
      console.error("❌ [CreateAppointment] Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to create appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-primary">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Create New Appointment</CardTitle>
                <CardDescription>Schedule an appointment with your doctor</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Doctor Selection */}
              <div className="space-y-2">
                <Label htmlFor="doctor">Select Doctor *</Label>
                <Select
                  value={formData.doctorId}
                  onValueChange={(value) => setFormData({ ...formData, doctorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor._id} value={doctor._id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{doctor.name}</span>
                          {doctor.specialty && (
                            <span className="text-xs text-muted-foreground">{doctor.specialty}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Appointment Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Appointment Date & Time *</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this appointment..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Medical Documents (Optional)</Label>
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Documents
                  </Button>

                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                      </div>
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30"
                        >
                          <span className="text-sm truncate flex-1">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="ml-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Creating..." : "Create Appointment"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateAppointment;
