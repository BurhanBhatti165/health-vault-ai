import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { doctor_name: string; doctor_email?: string; specialization?: string }) => void;
}

export const CreateDoctorDialog = ({ open, onOpenChange, onSubmit }: CreateDoctorDialogProps) => {
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [specialization, setSpecialization] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      doctor_name: doctorName,
      doctor_email: doctorEmail || undefined,
      specialization: specialization || undefined,
    });
    setDoctorName("");
    setDoctorEmail("");
    setSpecialization("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Doctor Folder</DialogTitle>
          <DialogDescription>
            Add a new doctor to organize your medical records
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doctor-name">Doctor Name *</Label>
            <Input
              id="doctor-name"
              placeholder="Dr. John Smith"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doctor-email">Doctor Email (Optional)</Label>
            <Input
              id="doctor-email"
              type="email"
              placeholder="doctor@hospital.com"
              value={doctorEmail}
              onChange={(e) => setDoctorEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization (Optional)</Label>
            <Input
              id="specialization"
              placeholder="Cardiology, Neurology, etc."
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Folder</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
