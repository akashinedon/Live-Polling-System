FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build TypeScript
COPY . .
RUN npm run build

# Expose port (Railway injects PORT env var)
EXPOSE 5000

CMD ["npm", "start"]
