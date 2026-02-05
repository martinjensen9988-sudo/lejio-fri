-- Create SQL login at server level (master database)
USE master;

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'martin_lejio_user')
BEGIN
    CREATE LOGIN martin_lejio_user WITH PASSWORD = 'TestPassword123!';
    PRINT 'Login martin_lejio_user created in master database';
END
ELSE
BEGIN
    PRINT 'Login martin_lejio_user already exists';
END

GO

-- Create database user and grant permissions (lejio_fri database)
USE lejio_fri;

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'martin_lejio_user' AND type = 'U')
BEGIN
    CREATE USER martin_lejio_user FOR LOGIN martin_lejio_user;
    ALTER ROLE db_datareader ADD MEMBER martin_lejio_user;
    ALTER ROLE db_datawriter ADD MEMBER martin_lejio_user;
    PRINT 'Database user martin_lejio_user created with read/write permissions in lejio_fri';
END
ELSE
BEGIN
    PRINT 'Database user martin_lejio_user already exists in lejio_fri';
END

GO

PRINT '';
PRINT '✅ SQL User Setup Complete!';
PRINT 'Username: martin_lejio_user';
PRINT 'Password: TestPassword123!';
PRINT 'Server: lejio-fri-db.database.windows.net';
PRINT 'Database: lejio_fri';
