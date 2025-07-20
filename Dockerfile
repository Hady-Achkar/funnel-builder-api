FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy pnpm files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

COPY . .

# Build the application
RUN pnpm run build

# Generate Prisma client
RUN pnpm exec prisma generate

EXPOSE 3000

CMD ["pnpm", "start"]