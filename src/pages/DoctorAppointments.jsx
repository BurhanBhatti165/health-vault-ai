import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

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
              <UserAvatar user={doctor} size="xl" />
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
            {doctor.bio && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="text-sm text-muted-foreground mb-1">About</div>
                <p className="text-sm">{doctor.bio}</p>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Appointments List */}
        {appointments.length === 0 ? (
          <Card className="shadow-card">
            <CardHeader className="text-center">
              <CardTitle>No Appointments</CardTitle>
              <CardDescription>You don't have any appointments with this doctor yet.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Appointments */}
            {(() => {
              const now = new Date();
              const upcomingAppointments = appointments.filter(appointment => 
                new Date(appointment.appointmentDate) >= now
              ).sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

              return (
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-xl text-green-600 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Upcoming Appointments ({upcomingAppointments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcomingAppointments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No upcoming appointments scheduled
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {upcomingAppointments.map((appointment) => (
                          <Card 
                            key={appointment._id}
                            className="shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 border-l-green-500"
                            onClick={() => navigate(`/appointment/${appointment._id}`)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg bg-green-100">
                                    <Calendar className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-base">
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
                                <div className="mt-3 pt-3 border-t border-border/50">
                                  <div className="text-sm text-muted-foreground">
                                    <strong>Notes:</strong> {appointment.notes}
                                  </div>
                                </div>
                              )}
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Past Appointments */}
            {(() => {
              const now = new Date();
              const pastAppointments = appointments.filter(appointment => 
                new Date(appointment.appointmentDate) < now
              ).sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

              return (
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-xl text-blue-600 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Past Appointments ({pastAppointments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pastAppointments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No past appointments found
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pastAppointments.map((appointment) => (
                          <Card 
                            key={appointment._id}
                            className="shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-500"
                            onClick={() => navigate(`/appointment/${appointment._id}`)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg bg-blue-100">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-base">
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
                                <div className="mt-3 pt-3 border-t border-border/50">
                                  <div className="text-sm text-muted-foreground">
                                    <strong>Notes:</strong> {appointment.notes}
                                  </div>
                                </div>
                              )}
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorAppointments;
