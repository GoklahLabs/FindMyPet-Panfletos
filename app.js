/**
 * GATA NEGA - SCRIPT DA CENTRAL DE RECOMPENSAS & DIVULGAÇÃO
 * Gerenciamento de Downloads, Compartilhamento e Cópia de Copy
 */

document.addEventListener('DOMContentLoaded', () => {
  initCopyButtons();
  initDownloadButtons();
  initShareButtons();
  initLightbox();
});

/**
 * 1. Copiar Textos das Caixas de Copy Predefinidas
 */
function initCopyButtons() {
  const copyButtons = document.querySelectorAll('.btn-copy');

  copyButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const targetId = button.getAttribute('data-target');
      const textElement = document.getElementById(targetId);
      
      if (!textElement) return;

      const textToCopy = textElement.innerText || textElement.textContent;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textToCopy.trim());
        } else {
          execFallbackCopy(textToCopy.trim());
        }

        // Feedback no botão
        const originalHtml = button.innerHTML;
        button.classList.add('copied');
        button.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          <span>Copiado!</span>
        `;
        showToast('✅ Copy copiada para a área de transferência!');

        setTimeout(() => {
          button.classList.remove('copied');
          button.innerHTML = originalHtml;
        }, 2200);

      } catch (err) {
        console.error('Erro ao copiar texto: ', err);
        execFallbackCopy(textToCopy.trim());
        showToast('✅ Copy copiada!');
      }
    });
  });
}

function execFallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy');
  } catch (e) {
    console.error('Fallback execCommand copy failed', e);
  }
  document.body.removeChild(textarea);
}

/**
 * 2. Download Direto dos Arquivos (PDF, PNG, JPG)
 */
function initDownloadButtons() {
  const downloadButtons = document.querySelectorAll('.btn-download');

  downloadButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filePath = btn.getAttribute('data-file');
      const fileName = btn.getAttribute('data-name') || filePath.split('/').pop();

      if (!filePath) return;

      // Se for link direto para download
      const link = document.createElement('a');
      link.href = filePath;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`📥 Baixando ${fileName}...`);
    });
  });
}

/**
 * 3. Compartilhar Arquivo Individual ou Link/Texto
 */
function initShareButtons() {
  const shareButtons = document.querySelectorAll('.btn-share-file');

  shareButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const filePath = btn.getAttribute('data-file');
      const fileName = btn.getAttribute('data-name') || 'Cartaz_Nega';
      const fileTitle = btn.getAttribute('data-title') || '🚨 PROCURA-SE: Gata NEGA 🐾';
      const fileType = btn.getAttribute('data-type') || 'image/png';
      const targetCopyId = btn.getAttribute('data-copy-target');
      
      let shareText = '🚨 *PROCURA-SE: GATA NEGA* 🐾\nDesaparecida no Jd. Ipanema (Santo André). Oferecemos recompensa!\nMais informações: https://procura-se-nega.vercel.app/';
      
      if (targetCopyId) {
        const copyEl = document.getElementById(targetCopyId);
        if (copyEl) shareText = (copyEl.innerText || copyEl.textContent).trim();
      }

      showToast('Preparando compartilhamento...');

      // Tenta compartilhar o arquivo nativamente
      try {
        const response = await fetch(filePath + '?t=' + Date.now());
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: fileType });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: fileTitle,
            text: shareText
          });
          return;
        }
      } catch (err) {
        console.log('Compartilhamento direto com arquivo não suportado, tentando texto/link.', err);
      }

      // Fallback para navigator.share de texto/link
      if (navigator.share) {
        try {
          await navigator.share({
            title: fileTitle,
            text: shareText,
            url: 'https://procura-se-nega.vercel.app/'
          });
          return;
        } catch (err) {
          if (err.name !== 'AbortError') {
            fallbackShareDownload(filePath, fileName, shareText);
          }
        }
      } else {
        fallbackShareDownload(filePath, fileName, shareText);
      }
    });
  });
}

function fallbackShareDownload(filePath, fileName, shareText) {
  // Baixa o arquivo e copia o texto da copy
  const link = document.createElement('a');
  link.href = filePath;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  execFallbackCopy(shareText);
  showToast('📥 Arquivo baixado e Copy copiada para colar no WhatsApp!');
}

/**
 * 4. Modal / Lightbox para pré-visualização das imagens
 */
function initLightbox() {
  const triggers = document.querySelectorAll('.preview-trigger');
  const modal = document.getElementById('previewModal');
  const modalImg = document.getElementById('modalImg');
  const modalCaption = document.getElementById('modalCaption');
  const closeBtn = document.getElementById('closeModalBtn');

  if (!modal || !modalImg) return;

  const openModal = (src, caption) => {
    modalImg.src = src;
    modalCaption.textContent = caption || 'Cartaz Gata Nega 🐾';
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  triggers.forEach(el => {
    el.addEventListener('click', () => {
      const src = el.getAttribute('data-full') || el.src;
      const caption = el.getAttribute('data-caption') || 'Panfleto da Nega';
      openModal(src, caption);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-img-wrapper')) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/**
 * 5. Toast Notifications
 */
function showToast(message, duration = 3200) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 260);
  }, duration);
}
