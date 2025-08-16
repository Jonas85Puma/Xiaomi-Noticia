// Script moderno para manejar la visibilidad de contenedores AdSense
// Este script se asegura de que los contenedores solo se muestren cuando hay anuncios reales

(() => {
    'use strict';
    
    // Función para verificar si un anuncio está cargado
    const checkAdStatus = (adElement) => {
        const adStatus = adElement.getAttribute('data-ad-status');
        const parentContainer = adElement.closest('.adsense-container, .ads-left, .ads-right, .adsense-left, .adsense-right');
        
        if (adStatus === 'filled' && parentContainer) {
            parentContainer.classList.add('has-ads');
        } else if (adStatus === 'unfilled' && parentContainer) {
            parentContainer.classList.remove('has-ads');
            // Ocultar completamente si no hay anuncio
            parentContainer.style.display = 'none';
        }
    };
    
    // Función para observar cambios en los anuncios
    const observeAds = () => {
        const adElements = document.querySelectorAll('.adsbygoogle');
        
        // Debounce para optimizar el rendimiento del MutationObserver
        const debounceMap = new Map();
        
        const debouncedCheckAdStatus = (adElement) => {
            const elementId = adElement.id || adElement.className || 'unknown';
            
            // Cancelar timeout anterior si existe
            if (debounceMap.has(elementId)) {
                clearTimeout(debounceMap.get(elementId));
            }
            
            // Programar nueva verificación con debounce
            const timeoutId = setTimeout(() => {
                requestAnimationFrame(() => {
                    checkAdStatus(adElement);
                    debounceMap.delete(elementId);
                });
            }, 100); // 100ms de debounce
            
            debounceMap.set(elementId, timeoutId);
        };

        adElements.forEach((adElement) => {
            // Verificar estado inicial
            requestAnimationFrame(() => checkAdStatus(adElement));
            
            // Crear observer para cambios en atributos con debouncing
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'data-ad-status') {
                        debouncedCheckAdStatus(adElement);
                    }
                });
            });
            
            // Observar cambios en el atributo data-ad-status
            observer.observe(adElement, {
                attributes: true,
                attributeFilter: ['data-ad-status']
            });
        });
    };
    
    // Función para verificar si AdSense está disponible
    const checkAdSenseAvailability = () => {
        // Verificar si el script de AdSense está cargado
        if (typeof window.adsbygoogle !== 'undefined') {
            console.log('✅ AdSense script cargado correctamente');
            return true;
        } else {
            console.warn('⚠️ AdSense script no detectado');
            return false;
        }
    };
    
    // Función para ocultar contenedores vacíos después de un tiempo (optimizada)
    const hideEmptyContainers = () => {
        setTimeout(() => {
            const containers = document.querySelectorAll('.adsense-container, .ads-left, .ads-right, .adsense-left, .adsense-right');
            const containersArray = Array.from(containers);
            
            // Procesar contenedores en chunks para evitar bloquear el hilo principal
            const processContainersInChunks = (containerList, startIndex = 0, chunkSize = 3) => {
                const endIndex = Math.min(startIndex + chunkSize, containerList.length);
                
                // Procesar chunk actual
                for (let i = startIndex; i < endIndex; i++) {
                    const container = containerList[i];
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
                }
                
                // Si hay más contenedores, programar el siguiente chunk
                if (endIndex < containerList.length) {
                    requestAnimationFrame(() => {
                        processContainersInChunks(containerList, endIndex, chunkSize);
                    });
                }
            };
            
            // Iniciar procesamiento en chunks
            if (containersArray.length > 0) {
                requestAnimationFrame(() => {
                    processContainersInChunks(containersArray);
                });
            }
        }, 3000); // Esperar 3 segundos para que AdSense cargue
    };
    
    // Función para validar configuración de AdSense (optimizada)
    const validateAdSenseConfig = () => {
        const adElements = document.querySelectorAll('.adsbygoogle');
        const adElementsArray = Array.from(adElements);
        let isValid = true;
        
        // Validar elementos .adsbygoogle en chunks para evitar bloquear el hilo principal
        const validateElementsInChunks = (elementList, startIndex = 0, chunkSize = 5) => {
            return new Promise((resolve) => {
                const endIndex = Math.min(startIndex + chunkSize, elementList.length);
                
                // Procesar chunk actual
                for (let i = startIndex; i < endIndex; i++) {
                    const adElement = elementList[i];
                    const clientId = adElement.getAttribute('data-ad-client');
                    const slotId = adElement.getAttribute('data-ad-slot');
                    
                    if (!clientId || clientId === 'ca-pub-XXXXXXXXXX') {
                        console.warn(`⚠️ Anuncio manual ${i + 1}: data-ad-client no configurado o usando valor de ejemplo`);
                        isValid = false;
                    }
                    
                    if (!slotId || slotId === 'XXXXXXXXXX') {
                        console.warn(`⚠️ Anuncio manual ${i + 1}: data-ad-slot no configurado o usando valor de ejemplo`);
                        isValid = false;
                    }
                }
                
                // Si hay más elementos, programar el siguiente chunk
                if (endIndex < elementList.length) {
                    requestAnimationFrame(() => {
                        validateElementsInChunks(elementList, endIndex, chunkSize).then(resolve);
                    });
                } else {
                    resolve();
                }
            });
        };
        
        // Iniciar validación asíncrona
        if (adElementsArray.length > 0) {
            validateElementsInChunks(adElementsArray).then(() => {
                // Continuar con validación de Auto Ads después de validar elementos
                validateAutoAds();
            });
        } else {
            validateAutoAds();
        }
        
        const validateAutoAds = () => {
            // Verificar que Auto Ads esté configurado correctamente
            const autoAdsScript = document.querySelector('script[src*="adsbygoogle.js"]');
            if (autoAdsScript) {
                console.log('✅ Auto Ads configurado correctamente - Google mostrará anuncios automáticamente');
            } else {
                console.warn('⚠️ Script de Auto Ads no encontrado');
                isValid = false;
            }
            
            if (isValid) {
                console.log('✅ Configuración de AdSense válida');
            } else {
                console.log('❌ Configuración de AdSense incompleta - Actualizar data-ad-client y data-ad-slot');
            }
            
            return isValid;
        };
    };
    
    // Función principal de inicialización
    const initAdSenseHandler = () => {
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
    };
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdSenseHandler);
    } else {
        initAdSenseHandler();
    }
    
    // También inicializar cuando la ventana esté completamente cargada
    window.addEventListener('load', () => {
        // Verificación adicional después de que todo esté cargado
        setTimeout(hideEmptyContainers, 1000);
    });
    
})();

// Función global para verificar estado de AdSense (útil para debugging)
window.checkAdSenseStatus = () => {
    console.log('=== ESTADO DE ADSENSE ===');
    
    const containers = document.querySelectorAll('.adsense-container, .ads-left, .ads-right, .adsense-left, .adsense-right');
    
    containers.forEach((container, index) => {
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
