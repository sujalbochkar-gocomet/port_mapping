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
COPY package*.json tsconfig.json ./
RUN npm install

# Copy Ruby dependencies and install
COPY port_mapper/ruby_fuzzy/Gemfile* ./port_mapper/ruby_fuzzy/
WORKDIR /app/port_mapper/ruby_fuzzy
RUN gem install bundler && bundle install

# Return to app directory
WORKDIR /app

# Copy the rest of the application
COPY . .

# Install ts-node globally
RUN npm install -g ts-node typescript

# Expose the port your app runs on
EXPOSE 3000

# Command to run the server with TypeScript directly
CMD ["ts-node", "--transpile-only", "src/script.ts"]