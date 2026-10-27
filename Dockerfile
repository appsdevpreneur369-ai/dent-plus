# Dent Plus Multi Speciality Dental & Family Clinic public website (DPC) — same pattern as the AISHWARYA/SPDC sites and clinicflow-frontend:
# multi-stage, node:20-alpine, Next.js standalone output, non-root user, port 3000.

# ── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm install (not ci), same as clinicflow-frontend: the lockfile is written by a newer local npm.
RUN npm install --no-audit --no-fund

# ── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public, build-time settings (inlined into the client bundle). No secrets here.
ARG NEXT_PUBLIC_SITE_ENV=production
ARG NEXT_PUBLIC_SITE_URL=
ARG NEXT_PUBLIC_SHOW_PLACEHOLDER_BADGES=false
ARG NEXT_PUBLIC_NOINDEX=false
# ClinicFlow247 API for the booking popup. Empty = content/booking.json (empty → enquiry/WhatsApp fallback).
ARG NEXT_PUBLIC_CLINICFLOW_API_URL=
ARG NEXT_PUBLIC_CLINICFLOW_CLINIC_SLUG=
ARG NEXT_PUBLIC_CLINICFLOW_CLINIC_ID=
# Staging only: shows "use code …" on the OTP step while SMS is in dry-run. Never set for production.
ARG NEXT_PUBLIC_BOOKING_OTP_HINT=
# ClinicFlow247 portal (sign-in/register links + redirects). Empty = content/portal.json (production portal).
ARG NEXT_PUBLIC_PORTAL_BASE_URL=
ENV NEXT_PUBLIC_PORTAL_BASE_URL=$NEXT_PUBLIC_PORTAL_BASE_URL
ENV NEXT_PUBLIC_SITE_ENV=$NEXT_PUBLIC_SITE_ENV
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SHOW_PLACEHOLDER_BADGES=$NEXT_PUBLIC_SHOW_PLACEHOLDER_BADGES
ENV NEXT_PUBLIC_NOINDEX=$NEXT_PUBLIC_NOINDEX
ENV NEXT_PUBLIC_CLINICFLOW_API_URL=$NEXT_PUBLIC_CLINICFLOW_API_URL
ENV NEXT_PUBLIC_CLINICFLOW_CLINIC_SLUG=$NEXT_PUBLIC_CLINICFLOW_CLINIC_SLUG
ENV NEXT_PUBLIC_CLINICFLOW_CLINIC_ID=$NEXT_PUBLIC_CLINICFLOW_CLINIC_ID
ENV NEXT_PUBLIC_BOOKING_OTP_HINT=$NEXT_PUBLIC_BOOKING_OTP_HINT
ENV NEXT_TELEMETRY_DISABLED=1

# `prebuild` generates the WebP image variants (scripts/build-image-variants.mjs), then `next build`.
RUN npm run build

# ── Stage 3: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user
RUN addgroup -S dpc && adduser -S dpc -G dpc

# Standalone server + static assets + public files (incl. generated image variants) + content (Markdown loader).
COPY --from=builder --chown=dpc:dpc /app/.next/standalone ./
COPY --from=builder --chown=dpc:dpc /app/.next/static ./.next/static
COPY --from=builder --chown=dpc:dpc /app/public ./public
COPY --from=builder --chown=dpc:dpc /app/content ./content

USER dpc

EXPOSE 3000

CMD ["node", "server.js"]
