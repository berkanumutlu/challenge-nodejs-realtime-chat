# Use Node 20-alpine as base image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/api

# Install tsx globally
RUN npm install tsx -g

# Copy application files
COPY src ./

# Install dependencies
RUN npm install

# Expose the port the app runs on
EXPOSE 3000

# Start the application in development mode
CMD ["npm", "run", "start:dev"]