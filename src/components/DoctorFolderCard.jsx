import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Calendar } from "lucide-react";

export const DoctorFolderCard = ({ folder, onClick }) => {
  return (
    <Card
      className="cursor-pointer hover:shadow-hover transition-all border-border/50 shadow-card"
      onClick={onClick}
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
    </Card>
  );
};
