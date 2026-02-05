-- ============================================
-- STEP 1: DROP ALL EXISTING FRI_* TABLES
-- ============================================
-- Run this FIRST in Azure Portal Query Editor
-- NOTE: Loop drops each table with diagnostics

-- Show which fri_* tables currently exist
PRINT '=== Tables to be dropped ==='
SELECT name FROM sys.tables 
WHERE name LIKE 'fri_%'
ORDER BY name;

-- Drop ALL foreign key constraints on fri_* tables
PRINT '=== Dropping all foreign key constraints ==='
DECLARE @sql NVARCHAR(MAX) = '';

SELECT @sql += 'ALTER TABLE ' + QUOTENAME(OBJECT_NAME(fk.parent_object_id)) + 
               ' DROP CONSTRAINT ' + QUOTENAME(fk.name) + ';' + CHAR(10)
FROM sys.foreign_keys fk
WHERE OBJECT_NAME(fk.parent_object_id) LIKE 'fri_%'
   OR OBJECT_NAME(fk.referenced_object_id) LIKE 'fri_%';

IF LEN(@sql) > 0
BEGIN
  PRINT 'Executing constraint drops...'
  EXEC sp_executesql @sql;
  PRINT 'All FK constraints dropped!'
END
ELSE
BEGIN
  PRINT 'No FK constraints found'
END

-- Loop: Try dropping each table individually to see which ones fail
PRINT '=== Dropping tables one by one ==='
DECLARE @tableName NVARCHAR(MAX);
DECLARE @dropSql NVARCHAR(MAX);
DECLARE table_cursor CURSOR FOR
SELECT name FROM sys.tables WHERE name LIKE 'fri_%' ORDER BY name;

OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @tableName;

WHILE @@FETCH_STATUS = 0
BEGIN
  SET @dropSql = 'DROP TABLE [' + @tableName + '];';
  BEGIN TRY
    EXEC sp_executesql @dropSql;
    PRINT '✅ Dropped: ' + @tableName;
  END TRY
  BEGIN CATCH
    PRINT '❌ Failed ' + @tableName + ': ' + ERROR_MESSAGE();
  END CATCH
  FETCH NEXT FROM table_cursor INTO @tableName;
END;

CLOSE table_cursor;
DEALLOCATE table_cursor;

-- Verify all tables are gone
PRINT '=== Verification ==='
SELECT COUNT(*) as RemainingFriTables
FROM sys.tables 
WHERE name LIKE 'fri_%';

PRINT '=== If RemainingFriTables = 0, SUCCESS! ✅ ==='
