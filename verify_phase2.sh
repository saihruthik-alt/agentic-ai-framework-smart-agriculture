#!/bin/bash

# Configuration
CORE_PORT=8080
echo "=== PHASE 2 AUTOMATED INTEGRATION TESTS ==="

# Clean port
kill -9 $(lsof -t -i:${CORE_PORT}) 2>/dev/null || true

# Start Spring Boot Core in H2 mode
echo "Starting Spring Boot Core Service..."
cd backend-core
JAVA_HOME=/opt/homebrew/opt/openjdk@21 mvn spring-boot:run -Dspring-boot.run.profiles=h2 > spring_boot_test.log 2>&1 &
CORE_PID=$!
cd ..

# Wait for startup
echo "Waiting 9 seconds for server to initialize..."
sleep 9

# 1. Test registration
echo "Testing User Registration..."
REG_RESPONSE=$(curl -s -X POST http://localhost:${CORE_PORT}/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"verifyfarmer","email":"verify@farmer.com","password":"testpassword123","role":"FARMER"}')

echo "Registration Response: ${REG_RESPONSE}"
TOKEN=$(echo $REG_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
  echo "ERROR: Failed to extract JWT token from registration response!"
  kill -9 $CORE_PID 2>/dev/null || true
  exit 1
fi
echo "SUCCESS: Token extracted: ${TOKEN:0:15}..."

# 2. Test login using Username
echo "Testing User Login via Username..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:${CORE_PORT}/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"verifyfarmer","password":"testpassword123"}')

echo "Username Login Response: ${LOGIN_RESPONSE}"
LOGIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$LOGIN_TOKEN" ]; then
  echo "ERROR: Failed to login via username!"
  kill -9 $CORE_PID 2>/dev/null || true
  exit 1
fi
echo "SUCCESS: Username Login JWT validated."

# 2b. Test login using Email
echo "Testing User Login via Email..."
LOGIN_EMAIL_RESPONSE=$(curl -s -X POST http://localhost:${CORE_PORT}/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"verify@farmer.com","password":"testpassword123"}')

echo "Email Login Response: ${LOGIN_EMAIL_RESPONSE}"
LOGIN_EMAIL_TOKEN=$(echo $LOGIN_EMAIL_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$LOGIN_EMAIL_TOKEN" ]; then
  echo "ERROR: Failed to login via email!"
  kill -9 $CORE_PID 2>/dev/null || true
  exit 1
fi
echo "SUCCESS: Email Login JWT validated."

# 3. Test creating a farm profile (Secured endpoint using JWT)
echo "Testing Secured Create Farm API..."
FARM_RESPONSE=$(curl -s -X POST http://localhost:${CORE_PORT}/api/v1/farms \
  -H "Authorization: Bearer $LOGIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Green Valley Alpha","latitude":12.9716,"longitude":77.5946,"soil_type":"Clay","totalAreaHectares":15.5}')

echo "Farm Creation Response: ${FARM_RESPONSE}"

# Check for farm name in response
if [[ $FARM_RESPONSE == *"Green Valley Alpha"* ]]; then
  echo "SUCCESS: Secured Farm profile created successfully!"
else
  echo "ERROR: Farm creation failed or returned unexpected payload!"
  kill -9 $CORE_PID 2>/dev/null || true
  exit 1
fi

# Clean up processes
echo "Stopping background service..."
kill -9 $CORE_PID 2>/dev/null || true
kill -9 $(lsof -t -i:${CORE_PORT}) 2>/dev/null || true

echo "=== PHASE 2 INTEGRATION VERIFICATION COMPLETE ==="
exit 0
