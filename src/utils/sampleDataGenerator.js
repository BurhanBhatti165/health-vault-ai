const doctorNames = [
  { name: "Dr. Sarah Johnson", specialization: "Cardiology" },
  { name: "Dr. Michael Chen", specialization: "Dermatology" },
  { name: "Dr. Emily Rodriguez", specialization: "Pediatrics" },
  { name: "Dr. James Williams", specialization: "Orthopedics" },
  { name: "Dr. Lisa Anderson", specialization: "Neurology" },
  { name: "Dr. Robert Taylor", specialization: "General Practice" },
  { name: "Dr. Jennifer Martinez", specialization: "Ophthalmology" },
  { name: "Dr. David Kim", specialization: "Psychiatry" },
];

const documentTypes = [
  { name: "Blood Test Results.pdf", type: "application/pdf" },
  { name: "X-Ray Report.pdf", type: "application/pdf" },
  { name: "Prescription.pdf", type: "application/pdf" },
  { name: "MRI Scan.pdf", type: "application/pdf" },
  { name: "Lab Results.pdf", type: "application/pdf" },
  { name: "Medical Certificate.pdf", type: "application/pdf" },
  { name: "Vaccination Record.pdf", type: "application/pdf" },
];

const appointmentNotes = [
  "Annual checkup",
  "Follow-up visit",
  "Initial consultation",
  "Routine examination",
  "Specialist referral",
  "Test results review",
  "Treatment plan discussion",
  null,
];

export const generateSampleData = () => {
  const userId = JSON.parse(localStorage.getItem("user") || '{}').id || "demo-user-id";
  
  // Generate doctor folders
  const doctorFolders = doctorNames.map((doc, index) => ({
    id: `doc-sample-${index + 1}`,
    doctor_name: doc.name,
    doctor_email: doc.name.toLowerCase().replace(/\s+/g, '.').replace('dr.', '') + '@hospital.com',
    specialization: doc.specialization,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  // Generate appointments (2-4 per doctor)
  const appointments = [];
  doctorFolders.forEach((doctor) => {
    const numAppointments = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < numAppointments; i++) {
      const appointmentDate = new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000);
      appointments.push({
        id: `apt-sample-${doctor.id}-${i + 1}`,
        doctor_folder_id: doctor.id,
        patient_id: doctor.patient_id || userId,
        appointment_date: appointmentDate.toISOString().split('T')[0],
        notes: appointmentNotes[Math.floor(Math.random() * appointmentNotes.length)],
        created_at: appointmentDate.toISOString(),
      });
    }
  });

  // Generate documents (1-3 per appointment)
  const documents = [];
  appointments.forEach((appointment) => {
    const numDocs = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numDocs; i++) {
      const doc = documentTypes[Math.floor(Math.random() * documentTypes.length)];
      const createdDate = new Date(appointment.created_at);
      documents.push({
        id: `doc-sample-${appointment.id}-${i + 1}`,
        appointment_folder_id: appointment.id,
        file_name: doc.name,
        file_path: `${userId}/${appointment.id}/${doc.name}`,
        file_type: doc.type,
        file_size: Math.floor(Math.random() * 5000000) + 100000,
        processing_status: "uploaded",
        created_at: createdDate.toISOString(),
      });
    }
  });

  // Save to localStorage
  localStorage.setItem("doctorFolders", JSON.stringify(doctorFolders));
  localStorage.setItem("appointments", JSON.stringify(appointments));
  localStorage.setItem("documents", JSON.stringify(documents));

  return {
    doctorFolders,
    appointments,
    documents,
  };
};

export const clearAllData = () => {
  localStorage.removeItem("doctorFolders");
  localStorage.removeItem("appointments");
  localStorage.removeItem("documents");
};
