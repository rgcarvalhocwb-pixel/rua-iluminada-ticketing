-- Create table for terminal commands (for turnstiles and other hardware)
CREATE TABLE public.terminal_commands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  terminal_id TEXT NOT NULL,
  command_type TEXT NOT NULL,
  command_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.terminal_commands ENABLE ROW LEVEL SECURITY;

-- Create policies for terminal commands
CREATE POLICY "Admins can manage terminal commands" 
ON public.terminal_commands 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Terminal users can view their commands" 
ON public.terminal_commands 
FOR SELECT 
USING (is_terminal_user(auth.uid()));

-- Create table for terminal updates
CREATE TABLE public.terminal_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  terminal_id TEXT NOT NULL,
  version TEXT NOT NULL,
  update_url TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.terminal_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for terminal updates
CREATE POLICY "Admins can manage terminal updates" 
ON public.terminal_updates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Terminal users can view their updates" 
ON public.terminal_updates 
FOR SELECT 
USING (is_terminal_user(auth.uid()));

-- Create table for terminal heartbeats
CREATE TABLE public.terminal_heartbeats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  terminal_id TEXT NOT NULL,
  status TEXT NOT NULL,
  version TEXT,
  location TEXT,
  hardware_status JSONB,
  metrics JSONB,
  system_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.terminal_heartbeats ENABLE ROW LEVEL SECURITY;

-- Create policies for terminal heartbeats
CREATE POLICY "Admins can manage terminal heartbeats" 
ON public.terminal_heartbeats 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Terminal users can insert their heartbeats" 
ON public.terminal_heartbeats 
FOR INSERT 
WITH CHECK (is_terminal_user(auth.uid()));

-- Create table for system alerts
CREATE TABLE public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  terminal_id TEXT,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for system alerts
CREATE POLICY "Admins can manage system alerts" 
ON public.system_alerts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_terminal_commands_updated_at
BEFORE UPDATE ON public.terminal_commands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_terminal_updates_updated_at
BEFORE UPDATE ON public.terminal_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_terminal_heartbeats_updated_at
BEFORE UPDATE ON public.terminal_heartbeats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_alerts_updated_at
BEFORE UPDATE ON public.system_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();