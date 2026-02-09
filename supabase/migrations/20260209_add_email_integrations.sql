-- Email Integrations Table
-- Stores multiple email accounts that lessors can use for communication

CREATE TABLE IF NOT EXISTS lessor_email_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lessor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic info
  type VARCHAR(50) NOT NULL, -- 'gmail', 'outlook', 'custom_smtp'
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  
  -- Status
  is_default BOOLEAN DEFAULT FALSE,
  is_connected BOOLEAN DEFAULT TRUE,
  connection_status VARCHAR(50) DEFAULT 'connected', -- 'connected', 'disconnected', 'expired'
  
  -- Timestamps
  last_tested_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Encrypted credentials (stored securely)
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT unique_default_email UNIQUE (lessor_id, id) WHERE is_default = TRUE,
  CONSTRAINT valid_type CHECK (type IN ('gmail', 'outlook', 'custom_smtp'))
);

-- Indexes
CREATE INDEX idx_lessor_email_integrations_lessor_id ON lessor_email_integrations(lessor_id);
CREATE INDEX idx_lessor_email_integrations_default ON lessor_email_integrations(lessor_id, is_default) WHERE is_default = TRUE;
CREATE INDEX idx_lessor_email_integrations_type ON lessor_email_integrations(type);

-- Email Activity Log
-- Track which email was used to send messages
CREATE TABLE IF NOT EXISTS email_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lessor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES lessor_email_integrations(id) ON DELETE SET NULL,
  
  -- Email details
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  email_type VARCHAR(100), -- 'booking_confirmation', 'payment_reminder', etc.
  
  -- Status
  status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'failed', 'bounced', 'opened', 'clicked'
  error_message TEXT,
  
  -- Metrics
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  
  CONSTRAINT valid_status CHECK (status IN ('sent', 'failed', 'bounced', 'opened', 'clicked'))
);

-- Indexes
CREATE INDEX idx_email_activity_lessor_id ON email_activity_log(lessor_id);
CREATE INDEX idx_email_activity_integration_id ON email_activity_log(integration_id);
CREATE INDEX idx_email_activity_status ON email_activity_log(status);
CREATE INDEX idx_email_activity_sent_at ON email_activity_log(sent_at);

-- RLS Policies
ALTER TABLE lessor_email_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_activity_log ENABLE ROW LEVEL SECURITY;

-- Users can see their own integrations
CREATE POLICY "Users can view their own email integrations"
  ON lessor_email_integrations FOR SELECT
  USING (auth.uid()::uuid = lessor_id);

-- Users can insert their own integrations
CREATE POLICY "Users can insert their own email integrations"
  ON lessor_email_integrations FOR INSERT
  WITH CHECK (auth.uid()::uuid = lessor_id);

-- Users can update their own integrations
CREATE POLICY "Users can update their own email integrations"
  ON lessor_email_integrations FOR UPDATE
  USING (auth.uid()::uuid = lessor_id);

-- Users can delete their own integrations
CREATE POLICY "Users can delete their own email integrations"
  ON lessor_email_integrations FOR DELETE
  USING (auth.uid()::uuid = lessor_id);

-- Email activity log policies
CREATE POLICY "Users can view their own email activity"
  ON email_activity_log FOR SELECT
  USING (auth.uid()::uuid = lessor_id);

CREATE POLICY "Users can insert their own email activity"
  ON email_activity_log FOR INSERT
  WITH CHECK (auth.uid()::uuid = lessor_id);

-- Trigger to update 'updated_at'
CREATE OR REPLACE FUNCTION update_email_integrations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lessor_email_integrations_timestamp
  BEFORE UPDATE ON lessor_email_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_email_integrations_timestamp();
