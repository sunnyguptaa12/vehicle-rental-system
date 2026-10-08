FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /workspace
COPY backend/pom.xml ./backend/pom.xml
COPY backend/src ./backend/src
RUN mvn -B -f backend/pom.xml -DskipTests package dependency:copy-dependencies -DincludeScope=runtime -DoutputDirectory=target/dependency

FROM eclipse-temurin:17-jre

WORKDIR /app
COPY --from=build /workspace/backend/target/vehicle-rental-backend-1.0.0.jar app.jar
COPY --from=build /workspace/backend/target/dependency ./dependency
EXPOSE 10000
ENTRYPOINT ["java", "-cp", "app.jar:dependency/*", "com.vehiclerental.Main"]
