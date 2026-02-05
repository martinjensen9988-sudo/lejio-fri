-- Create SQL login and user for martin_lejio_user
-- This script should be executed by the Azure AD admin

-- Step 1: Create login in master database
USE master
GO

IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = 'martin_lejio_user')
BEGIN
    CREATE LOGIN martin_lejio_user WITH PASSWORD = 'Temp123456789!';
    PRINT '✅ Login created: martin_lejio_user'
END
ELSE
BEGIN
    PRINT '⚠️  Login already exists: martin_lejio_user'
END
GO

-- Step 2: Use lejio_fri database and create user
USE lejio_fri
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'martin_lejio_user')
BEGIN
    CREATE USER martin_lejio_user FOR LOGIN martin_lejio_user;
    PRINT '✅ User created: martin_lejio_user in lejio_fri'
END
ELSE
BEGIN
    PRINT '⚠️  User already exists in lejio_fri'
END
GO

-- Step 3: Grant roles
ALTER ROLE db_datareader ADD MEMBER martin_lejio_user;
ALTER ROLE db_datawriter ADD MEMBER martin_lejio_user;
PRINT '✅ Roles assigned: db_datareader, db_datawriter'
GO

-- Verify
SELECT 'martin_lejio_user' AS Username, @@SERVERNAME AS Server, DB_NAME() AS [Database], 'Ready' AS Status
GO
