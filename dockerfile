# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the application files to the working directory
COPY . .

# Expose any ports the app uses
# In this case, the bot doesn't need any ports exposed as it interacts with Telegram servers

# Define the command to run your app
CMD ["npm", "run", "dev"]