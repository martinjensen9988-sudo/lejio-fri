-- Create corporate_roles table for role-based access control
CREATE TABLE IF NOT EXISTS corporate_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(corporate_account_id, name)
);

-- Create email_templates table for email campaigns
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  recipient_group VARCHAR(50) DEFAULT 'all_employees',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(corporate_account_id, name)
);

-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create corporate_documents table for document storage metadata
CREATE TABLE IF NOT EXISTS corporate_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(255) NOT NULL,
  file_size INTEGER,
  category VARCHAR(50) DEFAULT 'other',
  visibility VARCHAR(50) DEFAULT 'private',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create api_keys table for API access management
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(100) NOT NULL,
  key_secret_hash VARCHAR(255) NOT NULL,
  scopes JSONB DEFAULT '[]'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(key_prefix)
);

-- Create api_logs table for API request tracking
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  method VARCHAR(10),
  endpoint VARCHAR(255),
  status_code INTEGER,
  response_time_ms INTEGER,
  user_agent TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on all tables
ALTER TABLE corporate_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for corporate_roles
CREATE POLICY "corporate_roles_select" ON corporate_roles
  FOR SELECT USING (
    corporate_account_id IN (
      SELECT corporate_account_id FROM corporate_employees 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "corporate_roles_insert" ON corporate_roles
  FOR INSERT WITH CHECK (
    corporate_account_id IN (
      SELECT corporate_account_id FROM corporate_employees 
      WHERE user_id = auth.uid() AND is_active = true AND is_admin = true
    )
  );

CREATE POLICY "corporate_roles_update" ON corporate_roles
  FOR UPDATE USING (
    corporate_account_id IN (
      SELECT corporate_account_id FROM corporate_employees 
      WHERE user_id = auth.uid() AND is_active = true AND is_admin = true
    )
  );

CREATE POLICY "corporate_roles_delete" ON corporate_roles
  FOR DELETE USING (
    corporate_account_id IN (
      SELECT corporate_account_id FROM corporate_employees 
      WHERE user_id = auth.uid() AND is_active = true AND is_admin = true
    )
  );

-- Create RLS policies for email_templates
CREATE POLICY "email_templates_select" ON email_templates
  FOR SELECT USING (
    corporate_account_id IN (
      SELECT corporate_account_id FROM corporate_employees 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "email_templates_insert" ON email_templates
  FOR INSERT WITH CHECK (
    corporate_account_id IN (
      SELECT corporate_account_id FROM corporate_employees 
      WHERE user_id = auth.uid() AND is_active = true AND is_admin = true
    )
  );

CREATE POLICY "email_templates_update" ON email_templates
  FOR UPDATE USING (
    corporate_account_id IN (
      SELECT corporate_account_id FROM corporate_employees 
      WHERE user_id = auth.uid() AND is_active = true AND is_admin = true
    )
  );

CREATE POLICY "email_templates_delete" ON email_templates
  FOR DELETE USING (
    corporate_account_id IN (
      SELECT corporate_account_id FROM corporate_employees 
      WHERE user_id = auth.uid() AND is_active = true AND is_admin = true
    )
  );

-- Create RLS policies for api_keys
CREATE POLICY "api_keys_select" ON api_keys
  FOR SELECT USING (
    corporate_account_id IN (
      SELECT corporate_account_id FROM corporate_employees 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "api_keys_insert" ON api_keys
  FOR INSERT WITH CHECK (
    corporate_account_id IN (
      SELECT corporate_account_id FROM corporate_employees 
      WHERE user_id = auth.uid() AND is_active = true AND is_admin = true
    )
  );

CREATE POLICY "api_keys_update" ON api_keys
  FOR UPDATE USING (
    corporate_account_id IN (
      SELECT corporate_account_id FROM corporate_employees 
      WHERE user_id = auth.uid() AND is_active = true AND is_admin = true
    )
  );

CREATE POLICY "api_keys_delete" ON api_keys
  FOR DELETE USING (
    corporate_account_id IN (
      SELECT corporate_account_id FROM corporate_employees 
      WHERE user_id = auth.uid() AND is_active = true AND is_admin = true
    )
  );

-- Add indexes for performance
CREATE INDEX idx_corporate_roles_account ON corporate_roles(corporate_account_id);
CREATE INDEX idx_email_templates_account ON email_templates(corporate_account_id);
CREATE INDEX idx_email_logs_account ON email_logs(corporate_account_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_corporate_documents_account ON corporate_documents(corporate_account_id);
CREATE INDEX idx_corporate_documents_category ON corporate_documents(category);
CREATE INDEX idx_api_keys_account ON api_keys(corporate_account_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_logs_key ON api_logs(api_key_id);
CREATE INDEX idx_api_logs_created ON api_logs(created_at);
