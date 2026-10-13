# Étape 1 : build de l'application React
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=https://nexo-finance-api.duckdns.org
ARG VITE_USER_URL=https://nexo-finance.duckdns.org
ENV VITE_API_URL=$VITE_API_URL VITE_USER_URL=$VITE_USER_URL
RUN npm run build

# Étape 2 : servir les fichiers statiques avec nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
