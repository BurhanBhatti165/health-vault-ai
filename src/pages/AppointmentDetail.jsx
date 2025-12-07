import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { appointmentAPI } from "@/api/appointments";
import { chatAPI } from "@/api/chat";
import { langGraphAPI } from "@/api/langgraph";
import { extractionAPI } from "@/api/extraction";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ArrowLeft, Calendar, FileText, Download, Eye, Trash2, Edit2, Save, X, Upload, MessageSquare, Send, Bot, User, Sparkles, ChevronDown, Zap, ScanText } from "lucide-react";
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
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef(null);
  
  // LangGraph state
  const [processingDoc, setProcessingDoc] = useState(null);

  useEffect(() => {
    console.log("🔍 [AppointmentDetail] Component mounted, appointmentId:", appointmentId);
    loadAppointment();
    loadChatMessages();
  }, [appointmentId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

  const loadChatMessages = async () => {
    console.log("💬 [AppointmentDetail] Loading chat messages...");
    try {
      setLoadingChat(true);
      const response = await chatAPI.getChatMessages(appointmentId);
      console.log("✅ [AppointmentDetail] Chat messages loaded:", response.data.messages);
      setChatMessages(response.data.messages || []);
    } catch (error) {
      console.error("❌ [AppointmentDetail] Error loading chat:", error);
      // Don't show error toast for chat loading failure
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingMessage) return;

    const messageText = chatInput.trim();
    setChatInput("");

    console.log("💬 [AppointmentDetail] Sending message:", messageText);
    try {
      setSendingMessage(true);
      const response = await chatAPI.sendMessage(appointmentId, messageText);
      console.log("✅ [AppointmentDetail] Message sent:", response.data);
      
      // Add both user and AI messages to chat
      setChatMessages(prev => [...prev, response.data.userMessage, response.data.aiMessage]);
    } catch (error) {
      console.error("❌ [AppointmentDetail] Error sending message:", error);
      toast.error("Failed to send message");
      setChatInput(messageText); // Restore message on error
    } finally {
      setSendingMessage(false);
    }
  };

  const handleProcessWithLangGraph = async (documentId) => {
    console.log("🔬 [AppointmentDetail] Processing document with LangGraph:", documentId);
    try {
      setProcessingDoc(documentId);
      const response = await langGraphAPI.processDocument(appointmentId, documentId);
      console.log("✅ [AppointmentDetail] LangGraph processing complete:", response);
      
      // Reload appointment to get updated data
      await loadAppointment();
      
      toast.success("Document processed with AI workflow!");
    } catch (error) {
      console.error("❌ [AppointmentDetail] Error processing with LangGraph:", error);
      toast.error("Failed to process document");
    } finally {
      setProcessingDoc(null);
    }
  };

  const handleExtractWithMethod = async (documentId, method) => {
    console.log(`🔍 [AppointmentDetail] Extracting with ${method}:`, documentId);
    try {
      setProcessingDoc(documentId);
      const response = await extractionAPI.extractDocument(appointmentId, documentId, method);
      console.log("✅ [AppointmentDetail] Extraction complete:", response);
      
      // Reload appointment to get updated data
      await loadAppointment();
      
      const methodName = method === 'gemini' ? 'Gemini Vision' : 'OCR.space';
      toast.success(`Document extracted with ${methodName}!`);
    } catch (error) {
      console.error("❌ [AppointmentDetail] Error extracting:", error);
      toast.error("Failed to extract document");
    } finally {
      setProcessingDoc(null);
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={processingDoc === doc._id}
                            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                          >
                            <Sparkles className="h-4 w-4" />
                            {processingDoc === doc._id ? "Processing..." : "AI Extract"}
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                          <DropdownMenuItem
                            onClick={() => handleExtractWithMethod(doc._id, 'gemini')}
                            className="cursor-pointer"
                          >
                            <Zap className="h-4 w-4 mr-2 text-purple-500" />
                            <div className="flex flex-col">
                              <span className="font-medium">Gemini Vision</span>
                              <span className="text-xs text-muted-foreground">Quick structured extraction</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleProcessWithLangGraph(doc._id)}
                            className="cursor-pointer"
                          >
                            <Sparkles className="h-4 w-4 mr-2 text-pink-500" />
                            <div className="flex flex-col">
                              <span className="font-medium">LangGraph Workflow</span>
                              <span className="text-xs text-muted-foreground">Full analysis + patient history</span>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

        {/* Extracted Medical Data */}
        {appointment.documents && appointment.documents.some(doc => doc.ocrText) && (
          <Card className="mb-6 shadow-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-gradient-primary">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Extracted Medical Data</CardTitle>
                  <CardDescription>Structured information from documents</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointment.documents.map((doc) => {
                if (!doc.ocrText) return null;
                
                // Try to parse as JSON for better display
                let parsedData = null;
                try {
                  parsedData = JSON.parse(doc.ocrText);
                } catch (e) {
                  // Not JSON, display as text
                }
                
                return (
                  <div key={doc._id}>
                    <div className="text-sm font-medium mb-3 text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      From: {doc.fileName}
                    </div>
                    
                    {parsedData ? (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-lg space-y-3 border border-purple-200 dark:border-purple-800">
                        {parsedData.document_type && (
                          <div>
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Document Type</span>
                            <p className="text-sm mt-1">{parsedData.document_type}</p>
                          </div>
                        )}
                        
                        {parsedData.diagnosis && parsedData.diagnosis !== "Not specified" && (
                          <div>
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Diagnosis</span>
                            <p className="text-sm mt-1 font-medium">{parsedData.diagnosis}</p>
                          </div>
                        )}
                        
                        {parsedData.medicines && parsedData.medicines.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Medicines</span>
                            <ul className="text-sm mt-1 space-y-1">
                              {parsedData.medicines.map((med, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-purple-500">•</span>
                                  <span>{med}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {parsedData.doctor_name && parsedData.doctor_name !== "Not specified" && (
                          <div>
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Doctor</span>
                            <p className="text-sm mt-1">{parsedData.doctor_name}</p>
                          </div>
                        )}
                        
                        {parsedData.date && parsedData.date !== "Not specified" && (
                          <div>
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Date</span>
                            <p className="text-sm mt-1">{parsedData.date}</p>
                          </div>
                        )}
                        
                        {parsedData.instructions && parsedData.instructions !== "Not specified" && (
                          <div>
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Instructions</span>
                            <p className="text-sm mt-1">{parsedData.instructions}</p>
                          </div>
                        )}
                        
                        {parsedData.additional_findings && parsedData.additional_findings !== "Not specified" && (
                          <div>
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Additional Findings</span>
                            <p className="text-sm mt-1">{parsedData.additional_findings}</p>
                          </div>
                        )}
                        
                        {parsedData.raw_text && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              View raw extraction
                            </summary>
                            <pre className="text-xs mt-2 p-2 bg-muted/50 rounded overflow-x-auto">
                              {parsedData.raw_text}
                            </pre>
                          </details>
                        )}
                      </div>
                    ) : (
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-mono">
                          {doc.ocrText}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* AI Assistant Chat */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-primary">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Medical Assistant</CardTitle>
                <CardDescription>
                  Ask questions about this appointment, documents, or medical information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Chat Messages */}
            <div className="mb-4 h-96 overflow-y-auto border border-border/50 rounded-lg p-4 bg-muted/10">
              {loadingChat ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Loading chat...
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Bot className="h-12 w-12 mb-3 opacity-50" />
                  <p className="font-medium">Start a conversation</p>
                  <p className="text-sm mt-1">Ask me anything about this appointment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={msg._id || index}
                      className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'ai' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {msg.sender === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about this appointment..."
                disabled={sendingMessage}
                className="flex-1"
              />
              <Button type="submit" disabled={sendingMessage || !chatInput.trim()} className="gap-2">
                <Send className="h-4 w-4" />
                {sendingMessage ? "Sending..." : "Send"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AppointmentDetail;
