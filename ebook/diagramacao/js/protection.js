// PROTEÇÃO ANTI-CÓPIA ULTRA - RESET PRIMAL
(function() {
    'use strict';
    
    // Aplicar imediatamente ao carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyProtection);
    } else {
        applyProtection();
    }
    
    function applyProtection() {
        // CSS inline para garantir
        document.documentElement.style.userSelect = 'none';
        document.documentElement.style.webkitUserSelect = 'none';
        document.documentElement.style.mozUserSelect = 'none';
        document.documentElement.style.msUserSelect = 'none';
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        
        // Todas as tags
        const allElements = document.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
            allElements[i].style.userSelect = 'none';
            allElements[i].style.webkitUserSelect = 'none';
            allElements[i].onselectstart = function() { return false; };
            allElements[i].oncontextmenu = function() { return false; };
            allElements[i].oncopy = function() { return false; };
        }
    }
    
    // Prevenir TODAS as teclas de atalho
    window.addEventListener('keydown', function(e) {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        }
        
        // Ctrl ou Cmd
        if (e.ctrlKey || e.metaKey) {
            // Ctrl+Shift+I, J, C
            if (e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            }
            
            // Ctrl+U, S, C, A, X, P
            if ([85, 83, 67, 65, 88, 80].includes(e.keyCode)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            }
        }
    }, true);
    
    // Prevenir clique direito SEMPRE
    window.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
    }, true);
    
    // Prevenir seleção SEMPRE
    window.addEventListener('selectstart', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
    }, true);
    
    // Prevenir copiar
    window.addEventListener('copy', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.clipboardData.setData('text/plain', '');
        return false;
    }, true);
    
    // Prevenir recortar
    window.addEventListener('cut', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
    }, true);
    
    // Prevenir arrastar
    window.addEventListener('drag', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
    }, true);
    
    // Limpar clipboard
    setInterval(function() {
        if (navigator.clipboard) {
            navigator.clipboard.writeText('').catch(function(){});
        }
    }, 500);
    
    // Bloquear document.execCommand
    if (document.execCommand) {
        document.execCommand = function() { return false; };
    }
    
    // Override document.oncopy
    document.oncopy = function() { return false; };
    document.oncut = function() { return false; };
    document.onselectstart = function() { return false; };
    document.oncontextmenu = function() { return false; };
    
    // Aplicar em todos os elementos existentes e novos
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    node.onselectstart = function() { return false; };
                    node.oncopy = function() { return false; };
                    node.oncontextmenu = function() { return false; };
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    console.log('%c🔥 RESET PRIMAL', 'font-size: 24px; color: #00ff88; font-weight: bold;');
    console.log('%c⚠️ Conteúdo protegido', 'font-size: 14px; color: #ff4d4d;');
    
})();

// Executar imediatamente também
document.documentElement.style.userSelect = 'none';
document.documentElement.style.webkitUserSelect = 'none';
document.body.style.userSelect = 'none';
document.oncopy = function() { return false; };
document.onselectstart = function() { return false; };
