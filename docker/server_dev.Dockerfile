# Base image with Node.js
FROM node:18

# Install Ruby
RUN apt-get update && apt-get install -y \
    ruby \
    ruby-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy Ruby dependencies and install
COPY port_mapper/ruby_fuzzy/Gemfile* ./port_mapper/ruby_fuzzy/
WORKDIR /app/port_mapper/ruby_fuzzy
RUN gem install bundler && bundle install

# Return to app directory
WORKDIR /app

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose the port your app runs on
EXPOSE 3000

# Command to run the server with increased memory allocation in development mode
CMD ["nodemon", "--max-old-space-size=4096", "--exec", "ts-node", "src/script.ts"]