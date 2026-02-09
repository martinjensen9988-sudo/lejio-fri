-- Add missing columns to fri_lessors table
-- subscription_tier and ensure other expected columns exist

DO $$ 
BEGIN
    -- Add subscription_tier if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fri_lessors' AND column_name = 'subscription_tier'
    ) THEN
        ALTER TABLE fri_lessors ADD COLUMN subscription_tier VARCHAR(50);
        RAISE NOTICE 'Added subscription_tier column';
    ELSE
        RAISE NOTICE 'subscription_tier column already exists';
    END IF;

    -- Ensure selected_modules exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fri_lessors' AND column_name = 'selected_modules'
    ) THEN
        ALTER TABLE fri_lessors ADD COLUMN selected_modules JSONB NOT NULL DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added selected_modules column';
    ELSE
        RAISE NOTICE 'selected_modules column already exists';
    END IF;

    -- Ensure created_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fri_lessors' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE fri_lessors ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added created_at column';
    ELSE
        RAISE NOTICE 'created_at column already exists';
    END IF;

    -- Ensure updated_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fri_lessors' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE fri_lessors ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;
