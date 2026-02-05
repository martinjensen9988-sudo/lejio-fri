#!/usr/bin/env python3
"""
Create SQL database user using Azure SDK with current Azure session credentials
"""
import os
import json
import subprocess
import sys
from azure.identity import DefaultAzureCredential, AzureCliCredential
from azure.sql import create_client

# Get access token from current Azure session
print("🔑 Getting Azure credentials from current session...")
try:
    # Try using AzureCliCredential (uses az CLI session)
    credential = AzureCliCredential()
    print("✅ Using AzureCliCredential")
except Exception as e:
    print(f"⚠️  AzureCliCredential failed, trying DefaultAzureCredential: {e}")
    credential = DefaultAzureCredential()
    print("✅ Using DefaultAzureCredential")

# Get token for Azure SQL
print("🔐 Getting token for Azure SQL...")
token = credential.get_token("https://database.windows.net")
access_token = token.token
print("✅ Token received")

# Now use sqlcmd with the access token via environment variable
# For Azure SQL, we need to use SQLCMDPASSWORD with the token
server = "lejio-fri-db"
database = "master"

print(f"🔌 Connecting to {server}.database.windows.net/{database}...")

# Setup environment
env = os.environ.copy()
env["SQLCMDPASSWORD"] = access_token

# Create the login in master database
sql_master = """
IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = 'martin_lejio_user')
BEGIN
    CREATE LOGIN martin_lejio_user WITH PASSWORD = 'Temp123456789!';
    PRINT 'Login created: martin_lejio_user'
END
ELSE
BEGIN
    PRINT 'Login already exists: martin_lejio_user'
END
"""

# Create user in lejio_fri database
sql_db = """
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'martin_lejio_user')
BEGIN
    CREATE USER martin_lejio_user FOR LOGIN martin_lejio_user;
    PRINT 'User created: martin_lejio_user'
END
ELSE
BEGIN
    PRINT 'User already exists: martin_lejio_user'
END

ALTER ROLE db_datareader ADD MEMBER martin_lejio_user;
ALTER ROLE db_datawriter ADD MEMBER martin_lejio_user;
PRINT 'Roles assigned: db_datareader, db_datawriter'
"""

# Execute master queries
print("\n👤 Creating login in master database...")
result = subprocess.run(
    ["sqlcmd", "-S", f"{server}.database.windows.net", "-d", database, "-U", "martin_lejio_user", "-G", "-q", sql_master],
    capture_output=True,
    text=True,
    env=env,
    timeout=30
)

if result.returncode == 0:
    print("✅ Master database query succeeded")
    print(result.stdout)
else:
    print(f"⚠️  Master database query failed")
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)

# Execute lejio_fri database queries
print("\n👤 Creating user in lejio_fri database...")
database = "lejio_fri"
result = subprocess.run(
    ["sqlcmd", "-S", f"{server}.database.windows.net", "-d", database, "-U", "martin_lejio_user", "-G", "-q", sql_db],
    capture_output=True,
    text=True,
    env=env,
    timeout=30
)

if result.returncode == 0:
    print("✅ Database query succeeded")
    print(result.stdout)
else:
    print(f"⚠️  Database query failed")
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)

print("\n✅ SQL User Setup Complete!")
