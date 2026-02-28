-- To make any user admin, run the following SQL query, replacing 'your-email@example.com' with the user's email address:

UPDATE public.app_users
SET role = 'admin'
WHERE email = 'your-email@example.com';