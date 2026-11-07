# ========================================================
# STAGE 1: Base Alpine Ramping & Hemat Sumber Daya (Node 22 LTS)
# ========================================================
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ========================================================
# STAGE 2: Instalasi Dependensi Bersih (Dependencies)
# ========================================================
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# ========================================================
# STAGE 3: Build Aplikasi Next.js (Builder)
# ========================================================
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# ========================================================
# STAGE 4: Image Produksi Akhir yang Di-Hardening (Runner)
# ========================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# HARDENING 1: Buat grup dan pengguna non-root (UID 1001)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Salin aset publik dan build dengan kepemilikan non-root
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Tetapkan hak akses direktori kerja
RUN chown -R nextjs:nodejs /app

# HARDENING 2: Jalankan container sebagai user biasa (Non-Root)
USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
