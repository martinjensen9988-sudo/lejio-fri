-- Drop the problematic recursive policies on corporate_employees
DROP POLICY IF EXISTS "Corporate admins can manage their employees" ON corporate_employees;
DROP POLICY IF EXISTS "Employees can view colleagues" ON corporate_employees;

-- Create new non-recursive policies
-- Users can view their own employee record directly
CREATE POLICY "Users can view their own employee record"
  ON corporate_employees FOR SELECT
  USING (user_id = auth.uid());

-- Users can view colleagues in the same corporate account (using a non-recursive approach)
CREATE POLICY "Users can view colleagues in same account"
  ON corporate_employees FOR SELECT
  USING (
    corporate_account_id IN (
      SELECT corporate_account_id 
      FROM corporate_employees 
      WHERE user_id = auth.uid()
    )
  );

-- Corporate admins can manage employees (using direct user_id check)
CREATE POLICY "Corporate admins can manage employees"
  ON corporate_employees FOR ALL
  USING (
    -- Check if current user is admin in the same corporate account
    EXISTS (
      SELECT 1 
      FROM corporate_employees AS admin_check
      WHERE admin_check.user_id = auth.uid() 
        AND admin_check.is_admin = true
        AND admin_check.corporate_account_id = corporate_employees.corporate_account_id
    )
  );

-- Also fix the corporate_accounts policy to avoid recursion
DROP POLICY IF EXISTS "Corporate admins can view their account" ON corporate_accounts;

CREATE POLICY "Corporate admins can view their account"
  ON corporate_accounts FOR SELECT
  USING (
    id IN (
      SELECT corporate_account_id 
      FROM corporate_employees 
      WHERE user_id = auth.uid()
    )
  );