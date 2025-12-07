import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { loginSuccess } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Save, User as UserIcon } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { authAPI } from "@/api/auth";

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: profile, isAuthenticated } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    specialty: "",
    hospital: "",
    phone: "",
    bio: ""
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    // Load current user data
    setFormData({
      name: profile?.name || "",
      email: profile?.email || "",
      specialty: profile?.specialty || "",
      hospital: profile?.hospital || "",
      phone: profile?.phone || "",
      bio: profile?.bio || ""
    });
    
    if (profile?.profileImage) {
      setImagePreview(profile.profileImage);
    }
  }, [isAuthenticated, profile, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      
      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(profile?.profileImage || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData for multipart/form-data
      const updateFormData = new FormData();
      updateFormData.append('name', formData.name);
      updateFormData.append('email', formData.email);
      
      if (profile?.role === 'Doctor') {
        if (formData.specialty) updateFormData.append('specialty', formData.specialty);
        if (formData.hospital) updateFormData.append('hospital', formData.hospital);
        if (formData.phone) updateFormData.append('phone', formData.phone);
      }
      
      if (formData.bio) updateFormData.append('bio', formData.bio);

      // Add profile image if changed
      if (profileImage) {
        updateFormData.append('profileImage', profileImage);
      }

      const response = await authAPI.updateProfile(updateFormData);
      
      if (response.success) {
        const { user } = response.data;
        
        // Update Redux and localStorage
        localStorage.setItem('user', JSON.stringify(user));
        dispatch(loginSuccess(user));
        
        toast.success("Profile updated successfully!");
        navigate("/dashboard");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update profile";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isDoctor = profile?.role === "Doctor";

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
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Manage Profile</CardTitle>
                <CardDescription>
                  Update your personal information and profile picture
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-6">
                  <UserAvatar user={{ ...profile, profileImage: imagePreview }} size="xl" />
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('profile-image-input').click()}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {imagePreview ? "Change Photo" : "Upload Photo"}
                      </Button>
                      {imagePreview && profileImage && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemoveImage}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <input
                      id="profile-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      Max size: 5MB. Formats: JPG, PNG, GIF, WebP
                    </p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {/* Doctor-specific fields */}
              {isDoctor && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input
                      id="specialty"
                      type="text"
                      placeholder="e.g., Cardiology"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hospital">Hospital/Clinic</Label>
                    <Input
                      id="hospital"
                      type="text"
                      placeholder="e.g., City Hospital"
                      value={formData.hospital}
                      onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g., +1234567890"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">
                  {isDoctor ? "Professional Bio" : "About Me"}
                </Label>
                <Textarea
                  id="bio"
                  placeholder={
                    isDoctor
                      ? "Tell patients about your experience and expertise..."
                      : "Tell us a bit about yourself..."
                  }
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  This will be visible to {isDoctor ? "patients" : "doctors"}
                </p>
              </div>

              {/* Role Display */}
              <div className="space-y-2">
                <Label>Account Type</Label>
                <div className="p-3 rounded-lg bg-muted/30 text-sm">
                  {profile?.role} Account
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
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

export default Profile;
