import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Activity, LogOut, Plus, FolderPlus, FileText, Calendar, Search, Sparkles, Trash2 } from "lucide-react";
import { DoctorFolderCard } from "@/components/DoctorFolderCard";
import { CreateDoctorDialog } from "@/components/CreateDoctorDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateSampleData, clearAllData } from "@/utils/sampleDataGenerator";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [doctorFolders, setDoctorFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/auth");
      return;
    }
    setProfile(JSON.parse(user));
    const saved = localStorage.getItem("doctorFolders");
    setDoctorFolders(saved ? JSON.parse(saved) : []);
    setLoading(false);
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.clear();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const handleCreateFolder = (doctorData) => {
    const newFolder = {
      id: "doc-" + Date.now(),
      doctor_name: doctorData.doctor_name,
      doctor_email: doctorData.doctor_email || null,
      specialization: doctorData.specialization || null,
      created_at: new Date().toISOString()
    };
    const updated = [newFolder, ...doctorFolders];
    setDoctorFolders(updated);
    localStorage.setItem("doctorFolders", JSON.stringify(updated));
    toast.success("Doctor folder created successfully");
    setCreateDialogOpen(false);
  };

  const handleGenerateSampleData = () => {
    const { doctorFolders: newDoctors } = generateSampleData();
    setDoctorFolders(newDoctors);
    toast.success(`Generated ${newDoctors.length} sample doctors with appointments and documents`);
  };

  const handleClearAllData = () => {
    clearAllData();
    setDoctorFolders([]);
    toast.success("All data cleared");
  };

  const filteredFolders = doctorFolders.filter(folder => {
    const searchLower = searchQuery.toLowerCase();
    return (
      folder.doctor_name.toLowerCase().includes(searchLower) ||
      (folder.specialization && folder.specialization.toLowerCase().includes(searchLower)) ||
      (folder.doctor_email && folder.doctor_email.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex items-center gap-2 text-primary">
          <Activity className="h-6 w-6 animate-pulse" />
          <p className="text-lg">Loading your vault...</p>
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
                <p className="text-xs text-muted-foreground">Welcome, {profile?.full_name || profile?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-foreground">Your Medical Vault</h2>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateSampleData}
                variant="outline"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate Sample Data
              </Button>
              {doctorFolders.length > 0 && (
                <Button
                  onClick={handleClearAllData}
                  variant="outline"
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              )}
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="gap-2 shadow-hover hover:shadow-card transition-all"
              >
                <FolderPlus className="h-4 w-4" />
                Add Doctor
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground mb-4">
            Organize your medical records by doctor and appointment date
          </p>
          {doctorFolders.length > 0 && (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search doctors by name or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>

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
                <FileText className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Start Building Your Health Vault</CardTitle>
              <CardDescription className="text-base">
                Create your first doctor folder to organize medical records by physician
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <Button
                onClick={() => setCreateDialogOpen(true)}
                size="lg"
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Create Your First Doctor Folder
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFolders.map((folder) => (
              <DoctorFolderCard
                key={folder.id}
                folder={folder}
                onClick={() => navigate(`/doctor/${folder.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateDoctorDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateFolder}
      />
    </div>
  );
};

export default Dashboard;
