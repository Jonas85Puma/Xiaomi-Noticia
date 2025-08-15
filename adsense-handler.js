// Script para manejar la visibilidad de contenedores AdSense
// Este script se asegura de que los contenedores solo se muestren cuando hay anuncios reales

(function() {
    'use strict';
    
    // Función para verificar si un anuncio está cargado
    function checkAdStatus(adElement) {
        const adStatus = adElement.getAttribute('data-ad-status');
        const parentContainer = adElement.closest('.adsense-container, .ads-left, .ads-right, .adsense-left, .adsense-right');
        
        if (adStatus === 'filled' && parentContainer) {
            parentContainer.classList.add('has-ads');
        } else if (adStatus === 'unfilled' && parentContainer) {
            parentContainer.classList.remove('has-ads');
            // Ocultar completamente si no hay anuncio
            parentContainer.style.display = 'none';
        }
    }
    
    // Función para observar cambios en los anuncios
    function observeAds() {
        const adElements = document.querySelectorAll('.adsbygoogle');
        
        adElements.forEach(function(adElement) {
            // Verificar estado inicial
            checkAdStatus(adElement);
            
            // Crear observer para cambios en atributos
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'data-ad-status') {
                        checkAdStatus(adElement);
                    }
                });
            });
            
            // Observar cambios en el atributo data-ad-status
            observer.observe(adElement, {
                attributes: true,
                attributeFilter: ['data-ad-status']
            });
        });
    }
    
    // Función para verificar si AdSense está disponible
    function checkAdSenseAvailability() {
        // Verificar si el script de AdSense está cargado
        if (typeof window.adsbygoogle !== 'undefined') {
            console.log('✅ AdSense script cargado correctamente');
            return true;
        } else {
            console.warn('⚠️ AdSense script no detectado');
            return false;
        }
    }
    
    // Función para ocultar contenedores vacíos después de un tiempo
    function hideEmptyContainers() {
        setTimeout(function() {
            const containers = document.querySelectorAll('.adsense-container, .ads-left, .ads-right, .adsense-left, .adsense-right');
            
            containers.forEach(function(container) {
                const adElement = container.querySelector('.adsbygoogle');
                
                if (adElement) {
                    const adStatus = adElement.getAttribute('data-ad-status');
                    const hasContent = adElement.innerHTML.trim() !== '';
                    
                    // Si no hay estado de anuncio o está vacío, ocultar
                    if (!adStatus || adStatus === 'unfilled' || !hasContent) {
                        container.style.display = 'none';
                        console.log('🚫 Contenedor de anuncio oculto (sin contenido)');
                    } else if (adStatus === 'filled') {
                        container.classList.add('has-ads');
                        container.style.display = '';
                        console.log('✅ Contenedor de anuncio mostrado (con contenido)');
                    }
                } else {
                    // Si no hay elemento de anuncio, ocultar contenedor
                    container.style.display = 'none';
                }
            });
        }, 3000); // Esperar 3 segundos para que AdSense cargue
    }
    
    // Función para validar configuración de AdSense
    function validateAdSenseConfig() {
        const adElements = document.querySelectorAll('.adsbygoogle');
        let isValid = true;
        
        adElements.forEach(function(adElement, index) {
            const clientId = adElement.getAttribute('data-ad-client');
            const slotId = adElement.getAttribute('data-ad-slot');
            
            if (!clientId || clientId === 'ca-pub-2706305242875973') {
                console.warn(`⚠️ Anuncio ${index + 1}: data-ad-client no configurado o usando valor de ejemplo`);
                isValid = false;
            }
            
            if (!slotId || slotId === 'XXXXXXXXXX') {
                console.warn(`⚠️ Anuncio ${index + 1}: data-ad-slot no configurado o usando valor de ejemplo`);
                isValid = false;
            }
        });
        
        if (isValid) {
            console.log('✅ Configuración de AdSense válida');
        } else {
            console.log('❌ Configuración de AdSense incompleta - Actualizar data-ad-client y data-ad-slot');
        }
        
        return isValid;
    }
    
    // Función principal de inicialización
    function initAdSenseHandler() {
        console.log('🚀 Inicializando manejador de AdSense...');
        
        // Verificar disponibilidad de AdSense
        checkAdSenseAvailability();
        
        // Validar configuración
        validateAdSenseConfig();
        
        // Observar cambios en anuncios
        observeAds();
        
        // Ocultar contenedores vacíos después de un tiempo
        hideEmptyContainers();
        
        console.log('✅ Manejador de AdSense inicializado');
    }
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdSenseHandler);
    } else {
        initAdSenseHandler();
    }
    
    // También inicializar cuando la ventana esté completamente cargada
    window.addEventListener('load', function() {
        // Verificación adicional después de que todo esté cargado
        setTimeout(hideEmptyContainers, 1000);
    });
    
})();

// Función global para verificar estado de AdSense (útil para debugging)
window.checkAdSenseStatus = function() {
    console.log('=== ESTADO DE ADSENSE ===');
    
    const containers = document.querySelectorAll('.adsense-container, .ads-left, .ads-right, .adsense-left, .adsense-right');
    
    containers.forEach(function(container, index) {
        const adElement = container.querySelector('.adsbygoogle');
        const isVisible = container.style.display !== 'none';
        const hasAdsClass = container.classList.contains('has-ads');
        
        console.log(`Contenedor ${index + 1}:`, {
            visible: isVisible,
            hasAdsClass: hasAdsClass,
            adStatus: adElement ? adElement.getAttribute('data-ad-status') : 'No ad element',
            innerHTML: adElement ? (adElement.innerHTML.length > 0) : false
        });
    });
    
    console.log('========================');
};
