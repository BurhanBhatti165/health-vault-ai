-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'patient', 'doctor');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role app_role NOT NULL DEFAULT 'patient',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create doctor folders (second tier)
CREATE TABLE public.doctor_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_name TEXT NOT NULL,
  doctor_email TEXT,
  specialization TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create appointment folders (third tier - date-based)
CREATE TABLE public.appointment_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_folder_id UUID REFERENCES public.doctor_folders(id) ON DELETE CASCADE NOT NULL,
  appointment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(doctor_folder_id, appointment_date)
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_folder_id UUID REFERENCES public.appointment_folders(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  ocr_text TEXT,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for doctor_folders
CREATE POLICY "Patients can view their own doctor folders"
  ON public.doctor_folders FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create their own doctor folders"
  ON public.doctor_folders FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own doctor folders"
  ON public.doctor_folders FOR UPDATE
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can delete their own doctor folders"
  ON public.doctor_folders FOR DELETE
  USING (auth.uid() = patient_id);

-- RLS Policies for appointment_folders
CREATE POLICY "Users can view appointment folders for their doctor folders"
  ON public.appointment_folders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_folders
      WHERE doctor_folders.id = appointment_folders.doctor_folder_id
        AND doctor_folders.patient_id = auth.uid()
    )
  );

CREATE POLICY "Users can create appointment folders for their doctor folders"
  ON public.appointment_folders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctor_folders
      WHERE doctor_folders.id = appointment_folders.doctor_folder_id
        AND doctor_folders.patient_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own appointment folders"
  ON public.appointment_folders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_folders
      WHERE doctor_folders.id = appointment_folders.doctor_folder_id
        AND doctor_folders.patient_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own appointment folders"
  ON public.appointment_folders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_folders
      WHERE doctor_folders.id = appointment_folders.doctor_folder_id
        AND doctor_folders.patient_id = auth.uid()
    )
  );

-- RLS Policies for documents
CREATE POLICY "Users can view documents in their appointment folders"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointment_folders af
      JOIN public.doctor_folders df ON df.id = af.doctor_folder_id
      WHERE af.id = documents.appointment_folder_id
        AND df.patient_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents in their appointment folders"
  ON public.documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointment_folders af
      JOIN public.doctor_folders df ON df.id = af.doctor_folder_id
      WHERE af.id = documents.appointment_folder_id
        AND df.patient_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own documents"
  ON public.documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.appointment_folders af
      JOIN public.doctor_folders df ON df.id = af.doctor_folder_id
      WHERE af.id = documents.appointment_folder_id
        AND df.patient_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own documents"
  ON public.documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.appointment_folders af
      JOIN public.doctor_folders df ON df.id = af.doctor_folder_id
      WHERE af.id = documents.appointment_folder_id
        AND df.patient_id = auth.uid()
    )
  );

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctor_folders_updated_at
  BEFORE UPDATE ON public.doctor_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointment_folders_updated_at
  BEFORE UPDATE ON public.appointment_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'patient'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for medical documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-documents', 'medical-documents', false);

-- Storage policies for medical documents
CREATE POLICY "Users can view their own medical documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own medical documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own medical documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'medical-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own medical documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'medical-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );