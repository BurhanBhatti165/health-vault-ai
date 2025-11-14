import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar } from "lucide-react";
import { AppointmentCard } from "@/components/AppointmentCard";
import { useState } from "react";

export const PatientCard = ({ patient, appointments, onAppointmentClick }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-border/50 shadow-card">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{patient.full_name || patient.email}</CardTitle>
              {patient.email && (
                <CardDescription className="text-xs mt-1">
                  {patient.email}
                </CardDescription>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'}
          </Badge>
        </div>
      </CardHeader>
      {expanded && appointments.length > 0 && (
        <CardContent className="pt-0">
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Calendar className="h-4 w-4" />
              <span>Appointments</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onClick={() => onAppointmentClick(appointment)}
                />
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

