# Multi-stage build: Node builds the React bundle into the gateway's static
# resources, then Maven builds a single runnable jar.
FROM node:24-alpine AS ui
WORKDIR /ui

# product/frontend
COPY product/frontend/package.json product/frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY product/frontend/ ./
# the Vite config writes here; the jar picks it up as classpath:/static
RUN mkdir -p /out && npm run build -- --outDir /out


FROM maven:3.9-eclipse-temurin-25 AS backend
WORKDIR /src

# dependency layer first so source edits do not re-download the world
COPY product/backend/pom.xml ./
RUN mvn -B -q dependency:go-offline || true

COPY product/backend/ ./
COPY --from=ui /out ./api-gateway/src/main/resources/static

RUN mvn -B -q package -DskipTests


FROM eclipse-temurin:25-jre-jammy
WORKDIR /app

# non-root: this container is internet facing
RUN useradd --system --create-home --uid 10001 hangova
USER hangova

COPY --from=backend /src/api-gateway/target/api-gateway.jar /app/api-gateway.jar

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD ["sh", "-c", "curl -fsS http://localhost:8080/actuator/health || exit 1"]

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/api-gateway.jar"]
