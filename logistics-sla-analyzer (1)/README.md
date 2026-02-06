
# 📊 Torre de Control Logístico

## 🛠 Instalación Local
Si quieres ejecutarlo en tu PC:
1. Instala [Node.js](https://nodejs.org/).
2. Abre una terminal en la carpeta del proyecto.
3. Ejecuta `npm install` para instalar las dependencias.
4. Ejecuta `npm run dev` para ver la app en `localhost:3000`.

## 🚀 Despliegue en Vercel
1. Crea un repositorio en GitHub.
2. Sube todos los archivos de esta carpeta.
3. En Vercel, importa el repositorio.
4. **Configuración de Build:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

## 📂 Estructura de archivos
- `index.html`: Estructura base.
- `index.tsx`: Entrada de React.
- `App.tsx`: Lógica principal de la interfaz.
- `types.ts`: Definiciones de datos.
- `utils/businessLogic.ts`: El "cerebro" que calcula los SLA.
- `components/`: Todos los módulos visuales.
