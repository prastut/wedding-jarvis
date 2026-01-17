-- Add WhatsApp message ID and delivery status tracking to message_logs
ALTER TABLE message_logs
ADD COLUMN IF NOT EXISTS wamid VARCHAR(100),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent';

-- Index for looking up messages by WhatsApp message ID (for status updates)
CREATE INDEX IF NOT EXISTS idx_message_logs_wamid ON message_logs(wamid) WHERE wamid IS NOT NULL;

-- Status values: 'sent', 'delivered', 'read', 'failed'
COMMENT ON COLUMN message_logs.wamid IS 'WhatsApp message ID returned when sending';
COMMENT ON COLUMN message_logs.status IS 'Delivery status: sent, delivered, read, failed';
