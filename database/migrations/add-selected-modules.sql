-- Add selected_modules column to fri_lessors table
-- This column stores the list of enabled modules for each lessor

DO $$ 
BEGIN
    -- Check if column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'fri_lessors' 
        AND column_name = 'selected_modules'
    ) THEN
        ALTER TABLE fri_lessors 
        ADD COLUMN selected_modules JSONB NOT NULL DEFAULT '[]'::jsonb;
        
        RAISE NOTICE 'Added selected_modules column to fri_lessors';
    ELSE
        RAISE NOTICE 'Column selected_modules already exists';
    END IF;
END $$;
