# Multi-stage build: Node builds the React bundle into the gateway's static
# resources, then Maven builds all service jars.  An environment variable
# selects which service to run so every Render service shares the same Dockerfile.
#
#   docker build -t hangova-gw .
#   docker build -t hangova-user .
#
# The SERVICE_NAME env var (set per Render service in render.yaml) selects the jar.

# ---- Stage 1: build the React bundle ----------------------------------------
FROM node:24-alpine AS ui
WORKDIR /ui

COPY product/frontend/package.json product/frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY product/frontend/ ./
# the Vite config writes here; the jar picks it up as classpath:/static
RUN mkdir -p /out && npm run build -- --outDir /out


# ---- Stage 2: build the Maven modules ---------------------------------------
FROM maven:3.9-eclipse-temurin-25 AS backend
WORKDIR /src

# dependency layer first so source edits do not re-download the world
COPY product/backend/pom.xml ./
COPY product/backend/api-gateway/pom.xml      api-gateway/pom.xml
COPY product/backend/user-service/pom.xml     user-service/pom.xml
COPY product/backend/trip-service/pom.xml     trip-service/pom.xml
COPY product/backend/booking-service/pom.xml  booking-service/pom.xml
COPY product/backend/info-service/pom.xml     info-service/pom.xml
RUN mvn -B -q dependency:go-offline || true

COPY product/backend/ ./
COPY --from=ui /out ./api-gateway/src/main/resources/static

RUN mvn -B -q package -DskipTests


# ---- Stage 3: runtime -------------------------------------------------------
FROM eclipse-temurin:25-jre-jammy

WORKDIR /app

# non-root: this container is internet facing
RUN useradd --system --create-home --uid 10001 hangova
USER hangova

# copy all service jars; the entrypoint picks the right one
COPY --from=backend /src/api-gateway/target/api-gateway.jar /app/api-gateway.jar
COPY --from=backend /src/user-service/target/user-service.jar /app/user-service.jar
COPY --from=backend /src/trip-service/target/trip-service.jar /app/trip-service.jar
COPY --from=backend /src/booking-service/target/booking-service.jar /app/booking-service.jar
COPY --from=backend /src/info-service/target/info-service.jar /app/info-service.jar

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"
ENV SERVICE_NAME=api-gateway
EXPOSE 8080

# No HEALTHCHECK here on purpose: the temurin JRE image has no curl, so a
# curl-based check would always fail. Render performs its own probe against
# healthCheckPath from render.yaml, which talks HTTP to the running service.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/${SERVICE_NAME}.jar"]
