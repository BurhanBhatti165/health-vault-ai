import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Activity, Plus, Search, LogOut, FolderPlus, Trash2, User } from "lucide-react";
import { DoctorFolderCard } from "@/components/DoctorFolderCard";
import { PatientCard } from "@/components/PatientCard";
import { CreateDoctorDialog } from "@/components/CreateDoctorDialog";
import { StatisticsDashboard } from "@/components/StatisticsDashboard";
import { generateSampleData, clearAllData } from "@/utils/sampleDataGenerator";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [doctorFolders, setDoctorFolders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/auth");
      return;
    }
    
    const userData = JSON.parse(user);
    setProfile(userData);
    
    // Load all data
    const folders = JSON.parse(localStorage.getItem("doctorFolders") || "[]");
    const allAppointments = JSON.parse(localStorage.getItem("appointments") || "[]");
    const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
    
    setDoctorFolders(folders);
    setAppointments(allAppointments);
    
    // If user is a doctor, get their patients
    if (userData.role === "doctor") {
      // Get all doctor folders where this doctor's email matches
      const doctorFoldersForThisDoctor = folders.filter(f => f.doctor_email === userData.email);
      
      // Get all unique patient IDs from these folders
      const patientIds = new Set();
      doctorFoldersForThisDoctor.forEach(folder => {
        if (folder.patient_id) {
          patientIds.add(folder.patient_id);
        }
      });
      
      // Also check appointments directly
      allAppointments.forEach(apt => {
        const folder = folders.find(f => f.id === apt.doctor_folder_id);
        if (folder && folder.doctor_email === userData.email && apt.patient_id) {
          patientIds.add(apt.patient_id);
        }
        if (folder && folder.doctor_email === userData.email && folder.patient_id) {
          patientIds.add(folder.patient_id);
        }
      });
      
      // Get patient details
      const patientList = Array.from(patientIds).map(patientId => {
        const patientUser = allUsers.find(u => u.id === patientId);
        // Get appointments for this patient with this doctor
        const patientAppointments = allAppointments.filter(apt => {
          const folder = folders.find(f => f.id === apt.doctor_folder_id);
          const matchesPatient = apt.patient_id === patientId || folder?.patient_id === patientId;
          const matchesDoctor = folder?.doctor_email === userData.email;
          return matchesPatient && matchesDoctor;
        });
        return {
          ...(patientUser || { id: patientId, email: `patient-${patientId}`, full_name: `Patient ${patientId}` }),
          id: patientId,
          appointments: patientAppointments
        };
      });
      
      setPatients(patientList);
    }
    
    setLoading(false);
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const handleCreateFolder = (data) => {
    const newFolder = {
      id: "doc-" + Date.now(),
      patient_id: profile.id,
      doctor_name: data.doctor_name,
      doctor_email: data.doctor_email,
      specialization: data.specialization,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updated = [newFolder, ...doctorFolders];
    setDoctorFolders(updated);
    localStorage.setItem("doctorFolders", JSON.stringify(updated));
    
    toast.success("Doctor folder created successfully!");
    setCreateDialogOpen(false);
  };

  const handleGenerateSampleData = () => {
    const data = generateSampleData(profile?.id);
    setDoctorFolders(data.doctorFolders);
    setAppointments(data.appointments);
    toast.success("Sample data generated successfully!");
    // Reload to refresh doctor view if needed
    window.location.reload();
  };

  const handleClearAllData = () => {
    clearAllData();
    setDoctorFolders([]);
    setAppointments([]);
    setPatients([]);
    toast.success("All data cleared successfully!");
  };

  const handleAppointmentClick = (appointment) => {
    navigate(`/appointment/${appointment.id}`);
  };

  // Filter logic based on role
  const isDoctor = profile?.role === "doctor";
  
  // For patients: filter doctor folders
  const filteredFolders = doctorFolders.filter(folder => {
    if (isDoctor) return false; // Doctors don't see doctor folders
    const searchLower = searchQuery.toLowerCase();
    return (
      folder.doctor_name.toLowerCase().includes(searchLower) ||
      folder.specialization?.toLowerCase().includes(searchLower) ||
      folder.doctor_email?.toLowerCase().includes(searchLower)
    );
  });

  // For doctors: filter patients
  const filteredPatients = patients.filter(patient => {
    if (!isDoctor) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      (patient.full_name || "").toLowerCase().includes(searchLower) ||
      (patient.email || "").toLowerCase().includes(searchLower)
    );
  });

  // Get appointments for each doctor folder (for patient view)
  const getAppointmentsForFolder = (folderId) => {
    return appointments.filter(apt => apt.doctor_folder_id === folderId);
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
                  Welcome back, {profile?.full_name || profile?.email} ({isDoctor ? "Doctor" : "Patient"})
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

      <main className="container mx-auto px-4 py-8">
        {!isDoctor && doctorFolders.length > 0 && (
          <div className="mb-8">
            <StatisticsDashboard doctorFolders={doctorFolders} />
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-foreground">
              {isDoctor ? "My Patients" : "My Medical Vault"}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGenerateSampleData}
                className="gap-2"
              >
                <FolderPlus className="h-4 w-4" />
                Generate Sample Data
              </Button>
              <Button
                variant="outline"
                onClick={handleClearAllData}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
              {!isDoctor && (
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="gap-2 shadow-hover hover:shadow-card transition-all"
                >
                  <Plus className="h-4 w-4" />
                  New Doctor Folder
                </Button>
              )}
            </div>
          </div>
          
          {(isDoctor ? patients.length > 0 : doctorFolders.length > 0) && (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={isDoctor ? "Search patients by name or email..." : "Search doctors by name, specialization, or email..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>

        {/* Doctor View: Show Patients */}
        {isDoctor && (
          <>
            {filteredPatients.length === 0 && searchQuery ? (
              <Card className="shadow-card border-border/50">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-4 p-4 rounded-full bg-muted w-fit">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-2xl">No Results Found</CardTitle>
                  <CardDescription className="text-base">
                    No patients match your search. Try a different search term.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : patients.length === 0 ? (
              <Card className="shadow-card border-border/50">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-primary w-fit">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">No Patients Yet</CardTitle>
                  <CardDescription className="text-base">
                    Your patients will appear here once they create appointments with you.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPatients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    appointments={patient.appointments || []}
                    onAppointmentClick={handleAppointmentClick}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Patient View: Show Doctors */}
        {!isDoctor && (
          <>
            {filteredFolders.length === 0 && searchQuery ? (
              <Card className="shadow-card border-border/50">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-4 p-4 rounded-full bg-muted w-fit">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-2xl">No Results Found</CardTitle>
                  <CardDescription className="text-base">
                    No doctors match your search. Try a different search term.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : doctorFolders.length === 0 ? (
              <Card className="shadow-card border-border/50">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-primary w-fit">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Your Vault is Empty</CardTitle>
                  <CardDescription className="text-base">
                    Create your first doctor folder to start organizing your medical records
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredFolders.map((folder) => {
                  const folderAppointments = getAppointmentsForFolder(folder.id);
                  return (
                    <div key={folder.id} className="space-y-4">
                      <DoctorFolderCard
                        folder={folder}
                        onClick={() => navigate(`/doctor/${folder.id}`)}
                        showAppointments={true}
                        appointments={folderAppointments}
                        onAppointmentClick={handleAppointmentClick}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {!isDoctor && (
        <CreateDoctorDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreateFolder}
        />
      )}
    </div>
  );
};

export default Dashboard;
