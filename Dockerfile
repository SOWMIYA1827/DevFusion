FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

COPY Backend/DevFusionAPI.csproj ./Backend/
RUN dotnet restore Backend/DevFusionAPI.csproj

COPY Backend/ ./Backend/
WORKDIR /app/Backend
RUN dotnet publish -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Development

ENTRYPOINT ["dotnet", "DevFusionAPI.dll"]
