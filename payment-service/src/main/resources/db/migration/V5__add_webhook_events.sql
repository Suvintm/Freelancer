-- V5: Add Webhook Event Tracking & Deduplication
-- Author: SuviX Platform Team

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    provider VARCHAR(20) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    
    payload JSONB NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    
    signature_header VARCHAR(255),
    signature_valid BOOLEAN NOT NULL DEFAULT false,
    
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'ignored')),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    processed_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider, event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at);

-- Unique index to prevent duplicate webhook processing
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_unique 
ON webhook_events(provider, event_id) 
WHERE status IN ('completed', 'processing');
