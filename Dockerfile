# Imagen base oficial de Node.js LTS
FROM node:18-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json primero para aprovechar el cache
COPY package*.json ./

# Instalar dependencias con npm ci si existe lockfile, de lo contrario npm install
# En Alpine, bash no viene por defecto; usamos sh
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi

# Copiar el resto del código
COPY . .

# Exponer el puerto que usa la app
EXPOSE 7895

# Comando por defecto
CMD ["node", "app.js"]
