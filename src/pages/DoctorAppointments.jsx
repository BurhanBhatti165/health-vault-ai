import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, FileText, User } from "lucide-react";

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const { groupedCards } = useSelector((state) => state.medical);
  
  const [doctorCard, setDoctorCard] = useState(null);

  useEffect(() => {
    // Find the doctor card from grouped data
    const card = groupedCards.find(c => c.doctor?._id === doctorId);
    setDoctorCard(card);
  }, [doctorId, groupedCards]);

  if (!doctorCard) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Doctor Not Found</CardTitle>
            <CardDescription>Unable to find appointments with this doctor.</CardDescription>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { doctor, appointments = [] } = doctorCard;

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

      <main className="container mx-auto px-4 py-8">
        {/* Doctor Info Card */}
        <Card className="mb-8 shadow-card">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-gradient-primary">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{doctor.name}</CardTitle>
                <CardDescription className="space-y-1">
                  {doctor.specialty && (
                    <div className="text-primary font-medium text-base">{doctor.specialty}</div>
                  )}
                  {doctor.hospital && <div>{doctor.hospital}</div>}
                  <div>{doctor.email}</div>
                  {doctor.phone && <div>{doctor.phone}</div>}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{appointments.length}</div>
                <div className="text-sm text-muted-foreground">Appointment{appointments.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Appointments List */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">All Appointments</h2>
        </div>

        {appointments.length === 0 ? (
          <Card className="shadow-card">
            <CardHeader className="text-center">
              <CardTitle>No Appointments</CardTitle>
              <CardDescription>You don't have any appointments with this doctor yet.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card 
                key={appointment._id}
                className="shadow-card hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/appointment/${appointment._id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(appointment.appointmentDate).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    {appointment.documents && appointment.documents.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{appointment.documents.length} document{appointment.documents.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                  {appointment.notes && (
                    <CardContent className="pt-4 px-0">
                      <div className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {appointment.notes}
                      </div>
                    </CardContent>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorAppointments;
