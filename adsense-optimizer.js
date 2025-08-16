// Optimizador de AdSense para mejorar rendimiento móvil
// Implementa carga lazy y condicional de anuncios

(() => {
    'use strict';
    
    // Configuración de optimización
    const config = {
        mobileBreakpoint: 768,
        intersectionThreshold: 0.1,
        rootMargin: '50px',
        maxAdsPerPage: 3, // Limitar anuncios en móvil
        delayBeforeLoad: 1000 // Retrasar carga inicial
    };
    
    // Detectar dispositivo y conexión
    const deviceInfo = {
        isMobile: window.innerWidth <= config.mobileBreakpoint,
        isSlowConnection: navigator.connection && 
            (navigator.connection.effectiveType === 'slow-2g' || 
             navigator.connection.effectiveType === '2g' ||
             navigator.connection.saveData),
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
    
    // Determinar si cargar anuncios
    const shouldOptimizeAds = deviceInfo.isMobile || deviceInfo.isSlowConnection;
    
    // Intersection Observer para carga lazy
    let adObserver;
    let loadedAdsCount = 0;
    
    const createAdObserver = () => {
        if (!window.IntersectionObserver) return null;
        
        return new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && loadedAdsCount < config.maxAdsPerPage) {
                    loadAd(entry.target);
                    adObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: config.intersectionThreshold,
            rootMargin: config.rootMargin
        });
    };
    
    // Función para cargar un anuncio específico
    const loadAd = async (adContainer) => {
        if (!shouldOptimizeAds || loadedAdsCount >= config.maxAdsPerPage) {
            adContainer.style.display = 'none';
            return;
        }
        
        try {
            // Marcar como cargando
            adContainer.classList.add('ad-loading');
            
            // Cargar script de AdSense si no está cargado
            if (!window.adsbygoogle) {
                await loadAdSenseScript();
            }
            
            // Buscar elemento de anuncio dentro del contenedor
            const adElement = adContainer.querySelector('.adsbygoogle');
            if (adElement && !adElement.dataset.adsbygoogleStatus) {
                // Inicializar anuncio
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                loadedAdsCount++;
                
                // Timeout para verificar si se cargó
                setTimeout(() => {
                    if (!adElement.innerHTML.trim()) {
                        adContainer.style.display = 'none';
                        adContainer.classList.add('ad-failed');
                    } else {
                        adContainer.classList.add('ad-loaded');
                    }
                    adContainer.classList.remove('ad-loading');
                }, 3000);
            }
        } catch (error) {
            console.warn('Error cargando anuncio:', error);
            adContainer.style.display = 'none';
            adContainer.classList.add('ad-failed');
        }
    };
    
    // Función para cargar script de AdSense
    const loadAdSenseScript = () => {
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[src*="adsbygoogle.js"]')) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2706305242875973';
            script.async = true;
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = reject;
            
            document.head.appendChild(script);
        });
    };
    
    // Optimizar anuncios existentes
    const optimizeExistingAds = () => {
        const adContainers = document.querySelectorAll(
            '.adsense-container, .ads-left, .ads-right, .adsense-left, .adsense-right, aside[class*="adsense"]'
        );
        
        if (shouldOptimizeAds && adContainers.length > config.maxAdsPerPage) {
            // Ocultar anuncios excedentes en móvil
            Array.from(adContainers).slice(config.maxAdsPerPage).forEach(container => {
                container.style.display = 'none';
                container.classList.add('ad-hidden-mobile');
            });
        }
        
        // Configurar observer para anuncios visibles
        if (adObserver) {
            Array.from(adContainers).slice(0, config.maxAdsPerPage).forEach(container => {
                adObserver.observe(container);
            });
        }
    };
    
    // Función de inicialización
    const initAdOptimizer = () => {
        console.log('🚀 Inicializando optimizador de AdSense...');
        
        // Crear observer si es compatible
        adObserver = createAdObserver();
        
        if (shouldOptimizeAds) {
            console.log('⚡ Modo optimización móvil activado');
            
            // Retrasar inicialización para mejorar rendimiento
            setTimeout(() => {
                optimizeExistingAds();
            }, config.delayBeforeLoad);
        } else {
            // Cargar normalmente en desktop
            optimizeExistingAds();
        }
        
        console.log('✅ Optimizador de AdSense inicializado');
    };
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdOptimizer);
    } else {
        initAdOptimizer();
    }
    
    // Exponer función para verificación manual
    window.adOptimizerStatus = () => {
        return {
            shouldOptimize: shouldOptimizeAds,
            loadedAds: loadedAdsCount,
            maxAds: config.maxAdsPerPage,
            deviceInfo
        };
    };
    
})();