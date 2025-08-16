// Sistema de comentarios sin base de datos usando localStorage
class CommentSystem {
    constructor(pageId) {
        this.pageId = pageId;
        this.storageKey = `comments_${pageId}`;
        this.init();
    }

    init = () => {
        this.createCommentSection();
        this.loadComments();
        this.bindEvents();
    }

    createCommentSection = () => {
        const commentSection = document.createElement('section');
        commentSection.id = 'comments-section';
        commentSection.innerHTML = `
            <h2>Comentarios</h2>
            <div class="comment-form">
                <h3>Deja tu comentario</h3>
                <form id="comment-form">
                    <div class="form-group">
                        <label for="comment-name">Nombre:</label>
                        <input type="text" id="comment-name" name="name" required maxlength="50">
                    </div>
                    <div class="form-group">
                        <label for="comment-email">Email (opcional):</label>
                        <input type="email" id="comment-email" name="email" maxlength="100">
                    </div>
                    <div class="form-group">
                        <label for="comment-text">Comentario:</label>
                        <textarea id="comment-text" name="comment" required maxlength="500" rows="4" placeholder="Escribe tu comentario aquí..."></textarea>
                    </div>
                    <button type="submit" class="submit-btn">Enviar Comentario</button>
                </form>
            </div>
            <div class="comments-list">
                <h3>Comentarios (<span id="comment-count">0</span>)</h3>
                <div id="comments-container"></div>
            </div>
        `;

        // Buscar el contenedor main o el lugar correcto para insertar
        const main = document.querySelector('main');
        const footer = document.querySelector('footer');
        
        if (main) {
            // Insertar al final del main
            main.appendChild(commentSection);
        } else {
            // Fallback: insertar antes del footer
            footer.parentNode.insertBefore(commentSection, footer);
        }
    }

    bindEvents = () => {
        const form = document.getElementById('comment-form');
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addComment();
        });
    }

    addComment = () => {
        const name = document.getElementById('comment-name').value.trim();
        const email = document.getElementById('comment-email').value.trim();
        const text = document.getElementById('comment-text').value.trim();

        if (!name || !text) {
            alert('Por favor, completa los campos obligatorios.');
            return;
        }

        // Validación básica
        if (name.length > 50 || text.length > 500) {
            alert('El nombre no puede exceder 50 caracteres y el comentario 500 caracteres.');
            return;
        }

        const comment = {
            id: Date.now(),
            name: this.sanitizeInput(name),
            email: this.sanitizeInput(email),
            text: this.sanitizeInput(text),
            timestamp: new Date().toISOString(),
            approved: true // En un sistema real, esto sería false hasta moderación
        };

        this.saveComment(comment);
        this.displayComment(comment);
        this.clearForm();
        this.updateCommentCount();
    }

    sanitizeInput = (input) => {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    saveComment = (comment) => {
        let comments = this.getComments();
        comments.unshift(comment); // Agregar al inicio
        
        // Limitar a 100 comentarios por página
        if (comments.length > 100) {
            comments = comments.slice(0, 100);
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify(comments));
    }

    getComments = () => {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    loadComments = () => {
        const comments = this.getComments();
        const container = document.getElementById('comments-container');
        container.innerHTML = '';

        if (comments.length === 0) {
            container.innerHTML = '<p class="no-comments">Aún no hay comentarios. ¡Sé el primero en comentar!</p>';
            this.updateCommentCount();
            return;
        }

        // Optimización: cargar comentarios en chunks para evitar bloquear el hilo principal
        const approvedComments = comments.filter(comment => comment.approved);
        this.loadCommentsInChunks(approvedComments, 0);
    }

    // Cargar comentarios en chunks para optimizar el rendimiento
    loadCommentsInChunks = (comments, startIndex, chunkSize = 5) => {
        const endIndex = Math.min(startIndex + chunkSize, comments.length);
        
        // Procesar chunk actual
        for (let i = startIndex; i < endIndex; i++) {
            this.displayComment(comments[i], false);
        }
        
        // Si hay más comentarios, programar el siguiente chunk
        if (endIndex < comments.length) {
            requestAnimationFrame(() => {
                this.loadCommentsInChunks(comments, endIndex, chunkSize);
            });
        } else {
            // Actualizar contador cuando termine de cargar todos
            this.updateCommentCount();
        }
    }

    displayComment = (comment, prepend = true) => {
        const container = document.getElementById('comments-container');
        const noComments = container.querySelector('.no-comments');
        if (noComments) {
            noComments.remove();
        }

        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${comment.name}</span>
                <span class="comment-date">${this.formatDate(comment.timestamp)}</span>
            </div>
            <div class="comment-body">
                <p>${comment.text}</p>
            </div>
        `;

        if (prepend) {
            container.insertBefore(commentElement, container.firstChild);
        } else {
            container.appendChild(commentElement);
        }
    }

    formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    clearForm = () => {
        document.getElementById('comment-form')?.reset();
    }

    updateCommentCount = () => {
        const comments = this.getComments();
        const approvedComments = comments.filter(c => c.approved);
        const countElement = document.getElementById('comment-count');
        if (countElement) countElement.textContent = approvedComments.length;
    }

    // Método para exportar comentarios (para respaldo)
    exportComments = () => {
        const comments = this.getComments();
        const dataStr = JSON.stringify(comments, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `comments_${this.pageId}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Método para importar comentarios
    importComments = (jsonData) => {
        try {
            const comments = JSON.parse(jsonData);
            localStorage.setItem(this.storageKey, JSON.stringify(comments));
            this.loadComments();
            alert('Comentarios importados exitosamente.');
        } catch (error) {
            alert('Error al importar comentarios: ' + error.message);
        }
    }
}

// Inicializar sistema de comentarios cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Obtener ID de página basado en la URL o nombre del archivo
    const pageId = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    window.commentSystem = new CommentSystem(pageId);
});
