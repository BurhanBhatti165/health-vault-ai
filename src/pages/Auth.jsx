import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess, signupSuccess, setLoading } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Activity, Upload, X } from "lucide-react";
import { authAPI } from "@/api/auth";

const Auth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, isAuthenticated } = useSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Patient");
  const [specialty, setSpecialty] = useState("");
  const [hospital, setHospital] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));

    try {
      const response = await authAPI.login({ email, password });
      
      if (response.success) {
        const { token, user } = response.data;
        
        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        dispatch(loginSuccess(user));
        toast.success("Signed in successfully!");
        navigate("/dashboard");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Login failed. Please try again.";
      toast.error(message);
      dispatch(setLoading(false));
    }
  };

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

  const handleSignup = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));

    try {
      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append('name', fullName);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('role', role);

      // Add doctor-specific fields if role is Doctor
      if (role === 'Doctor') {
        if (specialty) formData.append('specialty', specialty);
        if (hospital) formData.append('hospital', hospital);
        if (phone) formData.append('phone', phone);
      }

      // Add profile image if selected
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      const response = await authAPI.register(formData);
      
      if (response.success) {
        const { token, user } = response.data;
        
        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        dispatch(signupSuccess(user));
        toast.success("Account created successfully!");
        navigate("/dashboard");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed. Please try again.";
      toast.error(message);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card border-border/50">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl">HealthVault AI</CardTitle>
          </div>
          <CardDescription>
            Secure medical records management powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                {/* Profile Image Upload */}
                <div className="space-y-2">
                  <Label>Profile Picture (Optional)</Label>
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setProfileImage(null);
                            setImagePreview(null);
                          }}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        id="profile-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Max size: 5MB. Formats: JPG, PNG, GIF, WebP
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">I am a</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="signup-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Patient">Patient</SelectItem>
                      <SelectItem value="Doctor">Doctor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {role === "Doctor" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="signup-specialty">Specialty</Label>
                      <Input
                        id="signup-specialty"
                        type="text"
                        placeholder="e.g., Cardiology"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-hospital">Hospital/Clinic</Label>
                      <Input
                        id="signup-hospital"
                        type="text"
                        placeholder="e.g., City Hospital"
                        value={hospital}
                        onChange={(e) => setHospital(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Phone</Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="e.g., +1234567890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
