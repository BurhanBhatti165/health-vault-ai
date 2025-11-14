import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText } from "lucide-react";

export const AppointmentCard = ({ appointment, onClick }) => {
  return (
    <Card
      className="cursor-pointer hover:shadow-hover transition-all border-border/50 shadow-card"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {new Date(appointment.appointment_date).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {appointment.notes && (
          <CardDescription className="flex items-start gap-2">
            <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span className="text-xs line-clamp-2">{appointment.notes}</span>
          </CardDescription>
        )}
        <CardDescription className="text-xs">
          Created {new Date(appointment.created_at).toLocaleDateString()}
        </CardDescription>
      </CardContent>
    </Card>
  );
};
