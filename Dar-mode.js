// Modo oscuro moderno con ES6+
const initDarkMode = () => {
    const toggleButton = document.getElementById('toggle-dark-mode');
    
    if (!toggleButton) return;
    
    // Cargar preferencia guardada
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    // Event listener con arrow function
    toggleButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        // Guardar preferencia
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
};

// Verificar si el DOM ya está cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDarkMode);
} else {
    initDarkMode();
}



