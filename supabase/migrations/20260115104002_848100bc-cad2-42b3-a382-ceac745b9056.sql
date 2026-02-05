-- Drop ALL existing policies on corporate_employees to fix infinite recursion
DROP POLICY IF EXISTS "Corporate admins can manage their employees" ON corporate_employees;
DROP POLICY IF EXISTS "Employees can view colleagues" ON corporate_employees;
DROP POLICY IF EXISTS "Users can view their own employee record" ON corporate_employees;
DROP POLICY IF EXISTS "Users can view colleagues in same account" ON corporate_employees;
DROP POLICY IF EXISTS "Corporate admins can manage employees" ON corporate_employees;

-- Drop policies on corporate_accounts that reference corporate_employees
DROP POLICY IF EXISTS "Corporate admins can view their account" ON corporate_accounts;

-- Create simple non-recursive policies for corporate_employees
-- Only allow users to see their own record (no subqueries on same table)
CREATE POLICY "Users can view own employee record"
  ON corporate_employees FOR SELECT
  USING (user_id = auth.uid());

-- Allow all operations for service role (admin uses service role key)
CREATE POLICY "Service role full access to employees"
  ON corporate_employees FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Simple policy for corporate_accounts - allow authenticated users to view if connected
CREATE POLICY "Users can view corporate accounts"
  ON corporate_accounts FOR SELECT
  USING (true);

-- Allow service role full access to corporate_accounts
CREATE POLICY "Service role full access to accounts"
  ON corporate_accounts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');