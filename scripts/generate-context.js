// scripts/generate-context.js
const fs = require('fs/promises');
const path = require('path');

// --- Configuration ---
// Directorio raíz del proyecto (un nivel arriba de /scripts)
const ROOT_DIR = path.resolve(__dirname, '..'); 
// Nombre del archivo de salida
const OUTPUT_FILE = path.resolve(ROOT_DIR, 'context.txt');
// Ruta de este mismo script para poder excluirlo
const SCRIPT_PATH = __filename;

// Carpetas a ignorar completamente en la búsqueda
const EXCLUDED_DIRS = new Set([
  'node_modules', 
  'dist', 
  '.git', 
  'cdk.out', 
  '.idea',
  'aws',      // Excluimos la carpeta de infraestructura de AWS
  'scripts',  // Excluimos la propia carpeta de scripts
]);

// Archivos específicos a ignorar
const EXCLUDED_FILES = new Set([
  'pnpm-lock.yaml', 
  'package-lock.json', 
  'yarn.lock'
]);

// Extensiones de archivo a ignorar (imágenes, binarios, etc.)
const EXCLUDED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.zip', '.jar'
]);


/**
 * Recorre recursivamente un directorio para encontrar todos los archivos relevantes
 * y leer su contenido.
 * @param {string} dir - El directorio desde el cual comenzar el recorrido.
 * @returns {Promise<Array<{filePath: string, content: string}>>} Una lista de objetos, cada uno con la ruta y el contenido del archivo.
 */
async function getAllFiles(dir) {
    let files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // Se asegura de que el script no se incluya a sí mismo
        if (fullPath === SCRIPT_PATH || fullPath === OUTPUT_FILE) continue;

        if (entry.isDirectory()) {
            if (!EXCLUDED_DIRS.has(entry.name)) {
                const nestedFiles = await getAllFiles(fullPath);
                files = files.concat(nestedFiles);
            }
        } else {
            if (!EXCLUDED_FILES.has(entry.name) && !EXCLUDED_EXTENSIONS.has(path.extname(entry.name))) {
                try {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    files.push({ filePath: fullPath, content });
                } catch (err) {
                    console.warn(`⚠️  No se pudo leer el archivo (¿quizás es un binario?): ${fullPath}. Omitiendo.`);
                }
            }
        }
    }
    return files;
}

/**
 * Función principal que orquesta la generación del archivo de contexto.
 */
async function main() {
    console.log('🚀 Escaneando el proyecto para generar el contexto...');
    try {
        const allFiles = await getAllFiles(ROOT_DIR);
        console.log(`✅ Se encontraron ${allFiles.length} archivos relevantes.`);

        // Ordena los archivos alfabéticamente para una salida consistente
        allFiles.sort((a, b) => a.filePath.localeCompare(b.filePath));

        let finalContent = '';
        let lastDir = null;

        for (const file of allFiles) {
            const relativePath = path.relative(ROOT_DIR, file.filePath);
            const currentDir = path.dirname(relativePath);
            
            // Si el directorio del archivo actual es diferente al anterior,
            // imprime un nuevo encabezado de directorio.
            if (currentDir !== lastDir) {
                const headerDir = currentDir.replace(/\\/g, '/'); // Normaliza para Windows
                finalContent += `\n\n// ===== Directory: ${headerDir} =====\n\n`;
                lastDir = currentDir;
            }
            
            const fileName = path.basename(relativePath);
            finalContent += `// ${fileName}\n${file.content}`;
        }

        await fs.writeFile(OUTPUT_FILE, finalContent.trim());
        
        console.log(`🎉 Archivo de contexto generado exitosamente en: ${OUTPUT_FILE}`);
    } catch (error) {
        console.error('❌ Ocurrió un error al generar el archivo de contexto:', error);
        process.exit(1);
    }
}

main();