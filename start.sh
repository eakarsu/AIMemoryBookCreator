#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${MAGENTA}========================================${NC}"
echo -e "${MAGENTA}   AI Memory Book Creator - Startup${NC}"
echo -e "${MAGENTA}========================================${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Services stopped. Goodbye!${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Kill processes on ports 3000 and 3001
echo -e "${YELLOW}Cleaning up ports...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
echo -e "${GREEN}Ports 3000 and 3001 are free${NC}"

# Check PostgreSQL
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if ! pg_isready -q 2>/dev/null; then
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || {
        echo -e "${RED}Could not start PostgreSQL. Please start it manually.${NC}"
        exit 1
    }
    sleep 2
fi
echo -e "${GREEN}PostgreSQL is running${NC}"

# Create database if not exists
echo -e "${YELLOW}Setting up database...${NC}"
createdb memory_book_db 2>/dev/null || echo -e "${CYAN}Database already exists${NC}"
echo -e "${GREEN}Database ready${NC}"

# Install dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd backend && npm install --silent 2>&1 | tail -1
echo -e "${GREEN}Backend dependencies installed${NC}"

echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd ../frontend && npm install --silent 2>&1 | tail -1
echo -e "${GREEN}Frontend dependencies installed${NC}"

cd ..

# Seed database
echo -e "${YELLOW}Seeding database...${NC}"
cd backend && node seed.js
echo -e "${GREEN}Database seeded${NC}"
cd ..

# Start backend with nodemon for hot reload
echo -e "${BLUE}Starting backend on port 3001...${NC}"
cd backend && npx nodemon server.js &
BACKEND_PID=$!
cd ..

sleep 2

# Start frontend
echo -e "${BLUE}Starting frontend on port 3000...${NC}"
cd frontend && PORT=3000 npm start &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   Application is running!${NC}"
echo -e "${GREEN}   Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}   Backend:  http://localhost:3001${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${CYAN}Press Ctrl+C to stop all services${NC}\n"

# Wait for both processes
wait
