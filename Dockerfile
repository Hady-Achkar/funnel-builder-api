FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy pnpm files
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies including dev dependencies for build
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Generate Prisma client
RUN pnpm exec prisma generate

# Build the application
RUN pnpm run build

# Remove dev dependencies to reduce image size
RUN pnpm prune --prod

EXPOSE 3000

# Run migrations and start the application
CMD ["sh", "-c", "pnpm exec prisma generate && pnpm exec prisma migrate deploy && pnpm start"]