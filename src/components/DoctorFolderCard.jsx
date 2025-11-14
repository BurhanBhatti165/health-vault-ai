import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Calendar } from "lucide-react";
import { AppointmentCard } from "@/components/AppointmentCard";
import { useState } from "react";

export const DoctorFolderCard = ({ folder, onClick, showAppointments = false, appointments = [], onAppointmentClick }) => {
  const [expanded, setExpanded] = useState(false);

  const handleCardClick = (e) => {
    // Don't expand if clicking on appointment cards
    if (e.target.closest('.appointment-card')) return;
    if (showAppointments && appointments.length > 0) {
      setExpanded(!expanded);
    } else {
      onClick?.();
    }
  };

  return (
    <Card
      className={`${showAppointments && appointments.length > 0 ? 'cursor-pointer' : 'cursor-pointer'} hover:shadow-hover transition-all border-border/50 shadow-card`}
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{folder.doctor_name}</CardTitle>
              {folder.specialization && (
                <Badge variant="secondary" className="mt-1">
                  {folder.specialization}
                </Badge>
              )}
            </div>
          </div>
          {showAppointments && appointments.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {folder.doctor_email && (
          <CardDescription className="flex items-center gap-2">
            <span className="text-xs">{folder.doctor_email}</span>
          </CardDescription>
        )}
        <CardDescription className="flex items-center gap-2 text-xs">
          <Calendar className="h-3 w-3" />
          Created {new Date(folder.created_at).toLocaleDateString()}
        </CardDescription>
      </CardContent>
      {showAppointments && expanded && appointments.length > 0 && (
        <CardContent className="pt-0">
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Calendar className="h-4 w-4" />
              <span>Appointments</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="appointment-card" onClick={(e) => {
                  e.stopPropagation();
                  onAppointmentClick?.(appointment);
                }}>
                  <AppointmentCard
                    appointment={appointment}
                    onClick={() => onAppointmentClick?.(appointment)}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
