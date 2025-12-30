# Use Node.js LTS
FROM node:18-alpine
# Create app directory
WORKDIR /usr/src/app
# Copy package files
COPY package*.json ./
COPY web-interface/package*.json ./web-interface/
# Install dependencies
RUN npm install
RUN cd web-interface && npm install
# Copy source files
COPY . .
# Expose the port the app runs on
EXPOSE 3000
# Command to run the application
CMD [ "node", "web-interface/server.js" ]