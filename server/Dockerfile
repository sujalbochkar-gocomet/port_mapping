# ----------- Build Stage -----------
    FROM node:18 AS build

    # Set working directory
    WORKDIR /app
    
    # Copy package files and install dependencies
    COPY package*.json tsconfig.json ./
    RUN npm install
    
    # Copy the rest of the app
    COPY . .
    
    # Compile TypeScript to JavaScript
    RUN npm run build   # This assumes you have a build script like "tsc"
    
    # ----------- Final Stage -----------
    FROM node:18
    
    # Install Ruby dependencies
    RUN apt-get update && apt-get install -y \
        ruby \
        ruby-dev \
        build-essential \
        && rm -rf /var/lib/apt/lists/*
    
    # Set working directory
    WORKDIR /app
    
    # Copy only the compiled JS and necessary files from build
    COPY --from=build /app/dist ./dist
    COPY --from=build /app/package*.json ./
    RUN npm install --omit=dev
    
    # Copy Ruby files and install dependencies
    COPY --from=build /app/port_mapper/ruby_fuzzy ./port_mapper/ruby_fuzzy
    WORKDIR /app/port_mapper/ruby_fuzzy
    RUN gem install bundler && bundle install
    
    # Back to app directory
    WORKDIR /app
    
    # Expose port
    EXPOSE 3000
    
    # Run compiled JS with Node
    CMD ["node", "dist/script.js"]
    