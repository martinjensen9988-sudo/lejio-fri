-- QUICK FIX: Check your admin user
-- Run this to see if role exists

-- See all users with admin roles
SELECT u.id, u.email, u.user_type, ur.role
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.user_type = 'admin' OR ur.role IS NOT NULL
ORDER BY u.created_at DESC;

-- If your admin user is missing from user_roles, run this:
-- Replace with your actual user ID from the query above

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM public.users 
WHERE email = 'admin@lejio.dk' AND id NOT IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
);

SELECT 'Done!' as status;
