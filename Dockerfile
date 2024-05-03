#build docker file using a puppeteer image
FROM ghcr.io/puppeteer/puppeteer:21.11.0

#Download Puppeteer Chromium and cache it
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Create app directory
WORKDIR /app

# copy package.json and package-lock.json
COPY package.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Expose the port the app runs on
CMD [ "node", "index.js" ]

