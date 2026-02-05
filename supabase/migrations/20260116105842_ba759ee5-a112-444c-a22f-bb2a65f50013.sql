-- Create a function to get all users with admin roles for management
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  role app_role,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ur.user_id,
    p.email,
    p.full_name,
    ur.role,
    ur.created_at
  FROM public.user_roles ur
  LEFT JOIN public.profiles p ON p.id = ur.user_id
  ORDER BY ur.created_at DESC
$$;

-- Create function to assign role (only super_admin can do this)
CREATE OR REPLACE FUNCTION public.assign_role(_target_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is super_admin
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Only super admins can assign roles';
  END IF;
  
  -- Prevent assigning super_admin role (must be done directly in database)
  IF _role = 'super_admin' THEN
    RAISE EXCEPTION 'Cannot assign super_admin role through this function';
  END IF;
  
  -- Insert or update role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Create function to remove role (only super_admin can do this)
CREATE OR REPLACE FUNCTION public.remove_role(_target_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is super_admin
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Only super admins can remove roles';
  END IF;
  
  -- Prevent removing super_admin role
  IF _role = 'super_admin' THEN
    RAISE EXCEPTION 'Cannot remove super_admin role through this function';
  END IF;
  
  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id AND role = _role;
  
  RETURN true;
END;
$$;

-- Function to check if user has any admin role (support, admin, or super_admin)
CREATE OR REPLACE FUNCTION public.has_any_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('support', 'admin', 'super_admin')
  )
$$;