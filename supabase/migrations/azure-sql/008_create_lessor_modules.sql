-- ============================================================================
-- Lejio Fri - Module Activation
-- Purpose: Persist enabled workshop modules per lessor
-- ============================================================================

IF OBJECT_ID('dbo.fri_lessor_modules', 'U') IS NULL
BEGIN
    CREATE TABLE fri_lessor_modules (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        lessor_id NVARCHAR(36) NOT NULL,
        module_id NVARCHAR(50) NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'inactive', -- active, inactive
        activated_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT uq_lessor_module UNIQUE (lessor_id, module_id)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_lessor_modules_lessor' AND object_id = OBJECT_ID('dbo.fri_lessor_modules'))
BEGIN
    CREATE INDEX idx_fri_lessor_modules_lessor ON fri_lessor_modules(lessor_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_fri_lessor_modules_status' AND object_id = OBJECT_ID('dbo.fri_lessor_modules'))
BEGIN
    CREATE INDEX idx_fri_lessor_modules_status ON fri_lessor_modules(status);
END
GO

PRINT 'Module activation schema created';
