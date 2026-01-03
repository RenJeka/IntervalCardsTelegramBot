FROM alpine
RUN apk update && apk upgrade
RUN apk add nodejs

# Set the working directory in the container
WORKDIR /app

# Copy the application files to the working directory
COPY dist ./

# # Install app dependencies
# RUN npm install --production

# Expose any ports the app uses
# In this case, the bot doesn't need any ports exposed as it interacts with Telegram servers

# Set the environment to production (you can change this to "development" if needed)
ENV NODE_ENV=production

# Define the command to run your app
# CMD ["npm", "run", "dev"]
CMD ["node", "index.js"]

# Debug container mode
# CMD ["watch", "-n", "5", "df", "-h"]

