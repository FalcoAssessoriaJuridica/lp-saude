/**
 * ============================================================================
 * 🎨 FALCO VISUAL STUDIO - MOTOR UNIVERSAL DE DESIGN & EDIÇÃO VISUAL
 * ============================================================================
 * @author Falco Assessoria Jurídica / Roberto Falco
 * @version 2.6.0 (Zero-Overlap Header & Floating Dock Edition)
 * 
 * Correções & Recursos:
 * 1. 🛡️ ZERO SOBREPOSIÇÃO: O cabeçalho / navbar da página desce automaticamente (top: 54px) quando a barra está no topo, permitindo selecionar o logo e menu com 100% de clareza.
 * 2. ↕️ ACESSO FLEXÍVEL: Botão para mover a Barra do Studio entre o TOPO e o RODAPÉ (Bottom Dock), liberando 100% da parte superior quando desejado.
 * 3. 🎯 Bounding Box Interativo com Alças nos 4 cantos para redimensionamento livre por arrasto do mouse.
 * 4. ✋ Move Tool (Arrastar e Mover livremente qualquer elemento).
 * 5. 🕹️ Mini-Toolbar flutuante sobre o elemento com Escala (+15% / -15%), Posição e Troca de Fotos.
 * 6. 💾 Persistência limpa em LocalStorage + Baixar HTML Limpo + Copiar Código.
 * ============================================================================
 */

(function () {
    if (window.FalcoVisualStudioLoaded) return;
    window.FalcoVisualStudioLoaded = true;

    const STORAGE_KEY = 'falco_studio_saved_' + (window.location.pathname || 'root').replace(/[^a-zA-Z0-9]/g, '_');

    let isEditMode = true;
    let barPosition = 'top'; // 'top' ou 'bottom'
    let activeElement = null;
    let isInspectorCollapsed = false;

    // Estados de Drag & Resize
    let isDragging = false;
    let isResizing = false;
    let currentHandle = null;
    let startX = 0, startY = 0;
    let startWidth = 0, startHeight = 0;
    let startMarginLeft = 0, startMarginTop = 0;

    function injectGoogleFonts() {
        const fontId = 'falco-studio-fonts';
        if (!document.getElementById(fontId)) {
            const link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=Montserrat:wght@500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Poppins:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap';
            document.head.appendChild(link);
        }
    }

    function injectStyles() {
        const styleId = 'falco-studio-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            :root {
                --fvs-gold-primary: #c9a961;
                --fvs-gold-light: #dfc079;
                --fvs-gold-dark: #967637;
                --fvs-bg-dark: #09090c;
                --fvs-panel-bg: rgba(12, 12, 16, 0.96);
                --fvs-border: rgba(201, 169, 97, 0.35);
                --fvs-text-light: #f4f4f5;
                --fvs-text-muted: #a1a1aa;
            }

            /* ── DESLOCAMENTO INTELIGENTE DO CABEÇALHO PARA NUNCA TRUNCAR ── */
            body.falco-studio-active.fvs-dock-top {
                padding-top: 54px !important;
            }

            body.falco-studio-active.fvs-dock-top header,
            body.falco-studio-active.fvs-dock-top .navbar,
            body.falco-studio-active.fvs-dock-top [class*="navbar"],
            body.falco-studio-active.fvs-dock-top header.fixed,
            body.falco-studio-active.fvs-dock-top .fixed.top-0,
            body.falco-studio-active.fvs-dock-top [class*="fixed"][class*="top-0"] {
                top: 54px !important;
                transition: top 0.2s ease !important;
            }

            body.falco-studio-active.fvs-dock-bottom {
                padding-top: 0 !important;
                padding-bottom: 54px !important;
            }

            body.falco-studio-active.fvs-dock-bottom header,
            body.falco-studio-active.fvs-dock-bottom .navbar,
            body.falco-studio-active.fvs-dock-bottom [class*="navbar"],
            body.falco-studio-active.fvs-dock-bottom header.fixed,
            body.falco-studio-active.fvs-dock-bottom .fixed.top-0,
            body.falco-studio-active.fvs-dock-bottom [class*="fixed"][class*="top-0"] {
                top: 0px !important;
                transition: top 0.2s ease !important;
            }

            /* Contornos de Seleção */
            .falco-studio-active [data-fvs-editable="true"],
            .falco-studio-active h1, 
            .falco-studio-active h2, 
            .falco-studio-active h3, 
            .falco-studio-active h4, 
            .falco-studio-active p, 
            .falco-studio-active span, 
            .falco-studio-active a, 
            .falco-studio-active button, 
            .falco-studio-active img,
            .falco-studio-active [class*="card"],
            .falco-studio-active [class*="hero"],
            .falco-studio-active [class*="badge"],
            .falco-studio-active [class*="logo"] {
                cursor: pointer !important;
            }

            .falco-studio-active [data-fvs-editable="true"]:hover,
            .falco-studio-active h1:hover, 
            .falco-studio-active h2:hover, 
            .falco-studio-active h3:hover, 
            .falco-studio-active h4:hover, 
            .falco-studio-active p:hover, 
            .falco-studio-active a:hover, 
            .falco-studio-active button:hover, 
            .falco-studio-active img:hover {
                outline: 1.5px dashed rgba(223, 192, 121, 0.6) !important;
                outline-offset: 2px !important;
            }

            .falco-studio-active .fvs-selected-element {
                outline: 2px solid var(--fvs-gold-light) !important;
                outline-offset: 2px !important;
            }

            /* ── GIZMO DE TRANSFORMAÇÃO INTERATIVO ── */
            #falco-transform-gizmo {
                position: absolute;
                pointer-events: none;
                z-index: 2147483630;
                border: 2px solid var(--fvs-gold-light);
                box-shadow: 0 0 15px rgba(223, 192, 121, 0.4);
                display: none;
                transition: border-color 0.15s;
            }

            #falco-transform-gizmo.active {
                display: block;
            }

            .fvs-handle {
                position: absolute;
                width: 12px;
                height: 12px;
                background: var(--fvs-gold-light);
                border: 2px solid #060608;
                border-radius: 50%;
                pointer-events: auto;
                cursor: pointer;
                transition: transform 0.15s, background-color 0.15s;
                box-shadow: 0 2px 6px rgba(0,0,0,0.8);
            }

            .fvs-handle:hover {
                transform: scale(1.4);
                background: #ffffff;
            }

            .fvs-handle-nw { top: -6px; left: -6px; cursor: nwse-resize; }
            .fvs-handle-ne { top: -6px; right: -6px; cursor: nesw-resize; }
            .fvs-handle-sw { bottom: -6px; left: -6px; cursor: nesw-resize; }
            .fvs-handle-se { bottom: -6px; right: -6px; cursor: nwse-resize; }
            .fvs-handle-n  { top: -6px; left: 50%; margin-left: -6px; cursor: ns-resize; }
            .fvs-handle-s  { bottom: -6px; left: 50%; margin-left: -6px; cursor: ns-resize; }
            .fvs-handle-e  { right: -6px; top: 50%; margin-top: -6px; cursor: ew-resize; }
            .fvs-handle-w  { left: -6px; top: 50%; margin-top: -6px; cursor: ew-resize; }

            /* Mini Barra de Ações Rápidas */
            #falco-gizmo-toolbar {
                position: absolute;
                top: -46px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(10, 10, 14, 0.98);
                border: 1px solid var(--fvs-gold-primary);
                border-radius: 9999px;
                padding: 4px 8px;
                display: flex;
                align-items: center;
                gap: 6px;
                pointer-events: auto;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.85);
                font-family: 'Inter', -apple-system, sans-serif;
                white-space: nowrap;
            }

            .fvs-gizmo-btn {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                color: #ffffff;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 700;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 4px;
                transition: all 0.15s ease;
            }

            .fvs-gizmo-btn:hover {
                background: var(--fvs-gold-primary);
                color: #060608;
                transform: scale(1.05);
            }

            .fvs-gizmo-move-handle {
                cursor: grab !important;
                background: linear-gradient(135deg, var(--fvs-gold-primary), var(--fvs-gold-dark));
                color: #060608;
                font-weight: 800;
            }

            .fvs-gizmo-move-handle:active {
                cursor: grabbing !important;
            }

            /* ── BARRA FIXA DO STUDIO (TOPO OU RODAPÉ) ── */
            #falco-top-studio-bar {
                position: fixed;
                left: 0;
                right: 0;
                height: 52px;
                z-index: 2147483640;
                background: var(--fvs-panel-bg);
                backdrop-filter: blur(24px);
                -webkit-backdrop-filter: blur(24px);
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.85);
                font-family: 'Inter', -apple-system, sans-serif;
                font-size: 12px;
                user-select: none;
                transition: all 0.2s ease;
            }

            #falco-top-studio-bar.fvs-dock-top {
                top: 0;
                bottom: auto;
                border-bottom: 2px solid var(--fvs-gold-primary);
                border-top: none;
            }

            #falco-top-studio-bar.fvs-dock-bottom {
                top: auto;
                bottom: 0;
                border-top: 2px solid var(--fvs-gold-primary);
                border-bottom: none;
            }

            .fvs-bar-left {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .fvs-brand-badge {
                background: linear-gradient(135deg, var(--fvs-gold-primary), var(--fvs-gold-dark));
                color: #060608;
                font-weight: 800;
                font-size: 11px;
                letter-spacing: 0.08em;
                padding: 4px 8px;
                border-radius: 6px;
                text-transform: uppercase;
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .fvs-chip-active {
                background: rgba(201, 169, 97, 0.15);
                border: 1px solid var(--fvs-border);
                color: var(--fvs-gold-light);
                padding: 4px 10px;
                border-radius: 9999px;
                font-size: 11px;
                font-weight: 700;
                max-width: 260px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .fvs-bar-center {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .fvs-bar-right {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .fvs-btn {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.16);
                color: #ffffff;
                padding: 5px 10px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 5px;
                transition: all 0.2s ease;
                white-space: nowrap;
            }

            .fvs-btn:hover {
                background: rgba(201, 169, 97, 0.25);
                border-color: var(--fvs-gold-primary);
                color: var(--fvs-gold-light);
            }

            .fvs-btn.active {
                background: var(--fvs-gold-primary);
                color: #060608;
                font-weight: 800;
                border-color: var(--fvs-gold-light);
            }

            .fvs-btn-gold-action {
                background: linear-gradient(135deg, var(--fvs-gold-primary), var(--fvs-gold-light));
                color: #060608;
                font-weight: 800;
                border: none;
                box-shadow: 0 0 12px rgba(201, 169, 97, 0.4);
            }

            .fvs-btn-gold-action:hover {
                transform: scale(1.03);
                background: linear-gradient(135deg, var(--fvs-gold-light), #fff);
            }

            /* ── PAINEL INSPECTOR FLUTUANTE ── */
            #falco-floating-inspector {
                position: fixed;
                top: 64px;
                right: 18px;
                width: 320px;
                max-height: calc(100vh - 80px);
                z-index: 2147483645;
                background: var(--fvs-panel-bg);
                backdrop-filter: blur(24px);
                -webkit-backdrop-filter: blur(24px);
                border: 1.5px solid var(--fvs-border);
                border-radius: 14px;
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.9), 0 0 30px rgba(201, 169, 97, 0.15);
                font-family: 'Inter', -apple-system, sans-serif;
                font-size: 12px;
                color: var(--fvs-text-light);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: fvsSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            }

            @keyframes fvsSlideIn {
                from { opacity: 0; transform: translateY(-10px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }

            .fvs-inspector-header {
                padding: 10px 14px;
                background: rgba(255, 255, 255, 0.04);
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: grab;
            }

            .fvs-inspector-title {
                font-weight: 700;
                font-size: 11px;
                letter-spacing: 0.06em;
                color: var(--fvs-gold-light);
                text-transform: uppercase;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .fvs-inspector-tabs {
                display: flex;
                background: rgba(0, 0, 0, 0.4);
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }

            .fvs-tab-btn {
                flex: 1;
                padding: 8px 4px;
                text-align: center;
                background: transparent;
                border: none;
                border-bottom: 2px solid transparent;
                color: var(--fvs-text-muted);
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            .fvs-tab-btn.active {
                color: var(--fvs-gold-light);
                border-bottom-color: var(--fvs-gold-primary);
                background: rgba(201, 169, 97, 0.1);
            }

            .fvs-inspector-body {
                padding: 14px;
                overflow-y: auto;
                max-height: calc(100vh - 180px);
            }

            .fvs-field {
                margin-bottom: 12px;
            }

            .fvs-field-label {
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 10px;
                font-weight: 700;
                color: var(--fvs-text-muted);
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 5px;
            }

            .fvs-field-val {
                color: var(--fvs-gold-light);
                font-weight: 700;
            }

            .fvs-input, .fvs-select {
                width: 100%;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.15);
                color: #fff;
                padding: 6px 8px;
                border-radius: 6px;
                font-size: 12px;
                outline: none;
                box-sizing: border-box;
            }

            .fvs-input:focus, .fvs-select:focus {
                border-color: var(--fvs-gold-primary);
                box-shadow: 0 0 8px rgba(201, 169, 97, 0.3);
            }

            .fvs-range-row {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .fvs-range-row input[type="range"] {
                flex: 1;
                accent-color: var(--fvs-gold-primary);
                cursor: pointer;
            }

            .fvs-color-row {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .fvs-color-picker {
                width: 32px;
                height: 30px;
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                cursor: pointer;
                background: transparent;
                padding: 0;
            }

            .fvs-swatches {
                display: flex;
                gap: 4px;
                margin-top: 5px;
            }

            .fvs-swatch-dot {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                border: 1px solid rgba(255, 255, 255, 0.3);
                cursor: pointer;
                transition: transform 0.15s;
            }

            .fvs-swatch-dot:hover {
                transform: scale(1.3);
            }

            .fvs-btn-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 6px;
                margin-top: 6px;
            }

            .fvs-preset-btn {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: #fff;
                padding: 6px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                text-align: center;
                transition: all 0.2s;
            }

            .fvs-preset-btn:hover {
                border-color: var(--fvs-gold-primary);
                background: rgba(201, 169, 97, 0.2);
                color: var(--fvs-gold-light);
            }

            /* Botão Flutuante Launcher */
            #falco-studio-launcher-btn {
                position: fixed;
                bottom: 24px;
                left: 24px;
                z-index: 2147483640;
                background: rgba(14, 14, 20, 0.95);
                border: 1.5px solid var(--fvs-gold-primary);
                color: var(--fvs-gold-light);
                padding: 10px 18px;
                border-radius: 9999px;
                font-family: 'Inter', -apple-system, sans-serif;
                font-weight: 700;
                font-size: 12px;
                cursor: pointer;
                box-shadow: 0 10px 30px rgba(0,0,0,0.85), 0 0 20px rgba(201, 169, 97, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            }

            #falco-studio-launcher-btn:hover {
                transform: scale(1.06) translateY(-2px);
                background: var(--fvs-gold-primary);
                color: #060608;
            }

            .fvs-hidden {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    function injectStudioUI() {
        if (document.getElementById('falco-top-studio-bar')) return;

        // Barra Superior / Inferior
        const topBar = document.createElement('div');
        topBar.id = 'falco-top-studio-bar';
        topBar.className = 'fvs-dock-top';
        topBar.innerHTML = `
            <div class="fvs-bar-left">
                <span class="fvs-brand-badge">✨ STUDIO FALCO</span>
                <span id="fvs-selected-tag" class="fvs-chip-active">Clique em qualquer item para editar</span>
            </div>
            
            <div class="fvs-bar-center">
                <button type="button" class="fvs-btn active" id="fvs-btn-mode-toggle" onclick="window.FalcoStudio.toggleMode()">
                    <span>✏️ Modo Edição</span>
                </button>
                <button type="button" class="fvs-btn" id="fvs-btn-dock-toggle" onclick="window.FalcoStudio.toggleDockPosition()" title="Mover Barra para o Topo ou Rodapé">
                    <span id="fvs-dock-label">⬇ Barra em Baixo</span>
                </button>
                <button type="button" class="fvs-btn" onclick="window.FalcoStudio.quickScale(1.1)" title="Aumentar Tamanho (+10%)">🔍 +10%</button>
                <button type="button" class="fvs-btn" onclick="window.FalcoStudio.quickScale(0.9)" title="Diminuir Tamanho (-10%)">🔍 -10%</button>
                <button type="button" class="fvs-btn" onclick="window.FalcoStudio.moveElement(0, -10)" title="Subir (10px)">⬆ Subir</button>
                <button type="button" class="fvs-btn" onclick="window.FalcoStudio.moveElement(0, 10)" title="Descer (10px)">⬇ Descer</button>
                <button type="button" class="fvs-btn" onclick="window.FalcoStudio.moveElement(-10, 0)" title="Mover Esquerda">⬅</button>
                <button type="button" class="fvs-btn" onclick="window.FalcoStudio.moveElement(10, 0)" title="Mover Direita">➡</button>
                <button type="button" class="fvs-btn" onclick="window.FalcoStudio.toggleInspector()" id="fvs-btn-toggle-inspector" title="Abrir/Fechar Painel Completo">
                    <span>🎛️ Painel</span>
                </button>
            </div>

            <div class="fvs-bar-right">
                <button type="button" class="fvs-btn fvs-btn-gold-action" onclick="window.FalcoStudio.saveEdits()" title="Salvar no Navegador">
                    <span>💾 Salvar</span>
                </button>
                <button type="button" class="fvs-btn" onclick="window.FalcoStudio.downloadHtml()" title="Baixar Arquivo HTML Pronto">
                    <span>📥 Baixar HTML</span>
                </button>
                <button type="button" class="fvs-btn" onclick="window.FalcoStudio.copyCleanHtml()" title="Copiar Código HTML">
                    <span>📋 Copiar</span>
                </button>
                <button type="button" class="fvs-btn" onclick="window.FalcoStudio.resetOriginal()" title="Restaurar Versão Original">
                    <span>🔄 Restaurar</span>
                </button>
            </div>
        `;
        document.body.appendChild(topBar);

        // ── GIZMO DE TRANSFORMAÇÃO FLUTUANTE ──
        const gizmo = document.createElement('div');
        gizmo.id = 'falco-transform-gizmo';
        gizmo.innerHTML = `
            <div id="falco-gizmo-toolbar">
                <button type="button" class="fvs-gizmo-btn fvs-gizmo-move-handle" title="Clique e segure para arrastar e reposicionar" onmousedown="window.FalcoStudio.startMoveDrag(event)">
                    <span>✋ Arrastar</span>
                </button>
                <button type="button" class="fvs-gizmo-btn" onclick="window.FalcoStudio.quickScale(1.15)" title="Aumentar +15%">➕ +15%</button>
                <button type="button" class="fvs-gizmo-btn" onclick="window.FalcoStudio.quickScale(0.85)" title="Diminuir -15%">➖ -15%</button>
                <button type="button" class="fvs-gizmo-btn" id="fvs-gizmo-upload-btn" onclick="document.getElementById('fvs-file-input').click()" style="display:none;" title="Trocar Imagem do Mac">
                    <span>📁 Trocar Foto</span>
                </button>
            </div>

            <div class="fvs-handle fvs-handle-nw" onmousedown="window.FalcoStudio.startResize(event, 'nw')"></div>
            <div class="fvs-handle fvs-handle-ne" onmousedown="window.FalcoStudio.startResize(event, 'ne')"></div>
            <div class="fvs-handle fvs-handle-sw" onmousedown="window.FalcoStudio.startResize(event, 'sw')"></div>
            <div class="fvs-handle fvs-handle-se" onmousedown="window.FalcoStudio.startResize(event, 'se')"></div>
            <div class="fvs-handle fvs-handle-n" onmousedown="window.FalcoStudio.startResize(event, 'n')"></div>
            <div class="fvs-handle fvs-handle-s" onmousedown="window.FalcoStudio.startResize(event, 's')"></div>
            <div class="fvs-handle fvs-handle-e" onmousedown="window.FalcoStudio.startResize(event, 'e')"></div>
            <div class="fvs-handle fvs-handle-w" onmousedown="window.FalcoStudio.startResize(event, 'w')"></div>
        `;
        document.body.appendChild(gizmo);

        // Inspetor Flutuante
        const inspector = document.createElement('div');
        inspector.id = 'falco-floating-inspector';
        inspector.innerHTML = `
            <div class="fvs-inspector-header">
                <div class="fvs-inspector-title">
                    <span>🎛️ INSPETOR VISUAL</span>
                    <span id="fvs-target-type-badge" style="color: #ffffff; opacity: 0.8; font-weight: normal;">(Geral)</span>
                </div>
                <button type="button" onclick="window.FalcoStudio.toggleInspector()" style="background:none; border:none; color:#aaa; font-size:16px; cursor:pointer;">✕</button>
            </div>

            <div class="fvs-inspector-tabs">
                <button type="button" class="fvs-tab-btn active" onclick="window.FalcoStudio.switchTab('style', this)">🎨 Estilo</button>
                <button type="button" class="fvs-tab-btn" onclick="window.FalcoStudio.switchTab('typography', this)">🔤 Texto</button>
                <button type="button" class="fvs-tab-btn" onclick="window.FalcoStudio.switchTab('media', this)">🖼️ Imagem</button>
                <button type="button" class="fvs-tab-btn" onclick="window.FalcoStudio.switchTab('spacing', this)">📐 Posição</button>
            </div>

            <div class="fvs-inspector-body">
                <!-- ABA 1: ESTILO -->
                <div id="fvs-tab-style" class="fvs-tab-content">
                    <div class="fvs-field">
                        <div class="fvs-field-label">Presets de Botão & Card</div>
                        <div class="fvs-btn-grid">
                            <button type="button" class="fvs-preset-btn" onclick="window.FalcoStudio.applyPreset('gold-solid')">🌟 Ouro Nobre</button>
                            <button type="button" class="fvs-preset-btn" onclick="window.FalcoStudio.applyPreset('gold-outline')">🛡️ Outline Ouro</button>
                            <button type="button" class="fvs-preset-btn" onclick="window.FalcoStudio.applyPreset('whatsapp-pulse')">🟢 Verde WhatsApp</button>
                            <button type="button" class="fvs-preset-btn" onclick="window.FalcoStudio.applyPreset('glass')">⬛ Glassmorphism</button>
                        </div>
                    </div>

                    <div class="fvs-field">
                        <div class="fvs-field-label">Cor de Fundo (Background)</div>
                        <div class="fvs-color-row">
                            <input type="color" id="fvs-input-bg-color" class="fvs-color-picker" onchange="window.FalcoStudio.setBgColor(this.value)">
                            <input type="text" id="fvs-input-bg-hex" class="fvs-input" placeholder="#060608 ou rgba(...)" oninput="window.FalcoStudio.setBgColor(this.value)">
                        </div>
                        <div class="fvs-swatches">
                            <div class="fvs-swatch-dot" style="background:#060608;" title="Ônix Puro" onclick="window.FalcoStudio.setBgColor('#060608')"></div>
                            <div class="fvs-swatch-dot" style="background:#121216;" title="Card Dark" onclick="window.FalcoStudio.setBgColor('#121216')"></div>
                            <div class="fvs-swatch-dot" style="background:#c9a961;" title="Ouro Nobre" onclick="window.FalcoStudio.setBgColor('#c9a961')"></div>
                            <div class="fvs-swatch-dot" style="background:#22c55e;" title="Verde WhatsApp" onclick="window.FalcoStudio.setBgColor('#22c55e')"></div>
                            <div class="fvs-swatch-dot" style="background:transparent; border: 1px dashed #fff;" title="Transparente" onclick="window.FalcoStudio.setBgColor('transparent')"></div>
                        </div>
                    </div>

                    <div class="fvs-field">
                        <div class="fvs-field-label">
                            <span>Arredondamento (Radius)</span>
                            <span id="fvs-radius-val" class="fvs-field-val">8px</span>
                        </div>
                        <div class="fvs-range-row">
                            <input type="range" id="fvs-input-radius" min="0" max="100" value="8" oninput="window.FalcoStudio.setRadius(this.value)">
                        </div>
                    </div>

                    <div class="fvs-field">
                        <div class="fvs-field-label">Borda (Border)</div>
                        <div class="fvs-color-row">
                            <input type="color" id="fvs-input-border-color" class="fvs-color-picker" onchange="window.FalcoStudio.setBorderColor(this.value)">
                            <select id="fvs-input-border-width" class="fvs-select" onchange="window.FalcoStudio.setBorderWidth(this.value)">
                                <option value="0px">Sem Borda</option>
                                <option value="1px">1px Fina</option>
                                <option value="2px" selected>2px Média</option>
                                <option value="3px">3px Destaque</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- ABA 2: TIPOGRAFIA -->
                <div id="fvs-tab-typography" class="fvs-tab-content" style="display:none;">
                    <div class="fvs-field">
                        <div class="fvs-field-label">Família da Fonte</div>
                        <select id="fvs-font-family-select" class="fvs-select" onchange="window.FalcoStudio.setFontFamily(this.value)">
                            <option value="'Outfit', sans-serif">Outfit (Moderna / Tech)</option>
                            <option value="'Cormorant Garamond', serif">Cormorant Garamond (Serifada / Clássica)</option>
                            <option value="'Inter', sans-serif">Inter (Sans Limpa)</option>
                            <option value="'Playfair Display', serif">Playfair Display (Luxo / Editorial)</option>
                            <option value="'Montserrat', sans-serif">Montserrat (Imponente)</option>
                            <option value="'Poppins', sans-serif">Poppins (Geométrica)</option>
                            <option value="'JetBrains Mono', monospace">JetBrains Mono (Código)</option>
                        </select>
                    </div>

                    <div class="fvs-field">
                        <div class="fvs-field-label">
                            <span>Tamanho da Fonte</span>
                            <span id="fvs-fontsize-val" class="fvs-field-val">16px</span>
                        </div>
                        <div class="fvs-range-row">
                            <input type="range" id="fvs-input-fontsize" min="10" max="96" value="16" oninput="window.FalcoStudio.setFontSize(this.value)">
                        </div>
                    </div>

                    <div class="fvs-field">
                        <div class="fvs-field-label">Cor do Texto</div>
                        <div class="fvs-color-row">
                            <input type="color" id="fvs-input-text-color" class="fvs-color-picker" onchange="window.FalcoStudio.setTextColor(this.value)">
                            <input type="text" id="fvs-input-text-hex" class="fvs-input" placeholder="#ffffff" oninput="window.FalcoStudio.setTextColor(this.value)">
                        </div>
                        <div class="fvs-swatches">
                            <div class="fvs-swatch-dot" style="background:#c9a961;" title="Ouro Nobre" onclick="window.FalcoStudio.setTextColor('#c9a961')"></div>
                            <div class="fvs-swatch-dot" style="background:#dfc079;" title="Ouro Claro" onclick="window.FalcoStudio.setTextColor('#dfc079')"></div>
                            <div class="fvs-swatch-dot" style="background:#ffffff;" title="Branco Puro" onclick="window.FalcoStudio.setTextColor('#ffffff')"></div>
                            <div class="fvs-swatch-dot" style="background:#a1a1aa;" title="Cinza Metálico" onclick="window.FalcoStudio.setTextColor('#a1a1aa')"></div>
                            <div class="fvs-swatch-dot" style="background:#22c55e;" title="Verde" onclick="window.FalcoStudio.setTextColor('#22c55e')"></div>
                        </div>
                    </div>

                    <div class="fvs-field">
                        <div class="fvs-field-label">Alinhamento & Estilo</div>
                        <div class="fvs-btn-grid" style="grid-template-columns: repeat(4, 1fr);">
                            <button type="button" class="fvs-preset-btn" onclick="window.FalcoStudio.setTextAlign('left')">⬅</button>
                            <button type="button" class="fvs-preset-btn" onclick="window.FalcoStudio.setTextAlign('center')">⬛</button>
                            <button type="button" class="fvs-preset-btn" onclick="window.FalcoStudio.setTextAlign('right')">➡</button>
                            <button type="button" class="fvs-preset-btn" onclick="window.FalcoStudio.setTextAlign('justify')">☰</button>
                        </div>
                    </div>

                    <div class="fvs-field">
                        <div class="fvs-field-label">Link ou WhatsApp (se for botão/link)</div>
                        <input type="text" id="fvs-input-link" class="fvs-input" placeholder="https://wa.me/55..." oninput="window.FalcoStudio.setLink(this.value)">
                    </div>
                </div>

                <!-- ABA 3: IMAGEM -->
                <div id="fvs-tab-media" class="fvs-tab-content" style="display:none;">
                    <div class="fvs-field">
                        <div class="fvs-field-label">📁 Trocar Foto (Upload Local do Mac)</div>
                        <input type="file" id="fvs-file-input" accept="image/*" class="fvs-input" style="padding: 4px;" onchange="window.FalcoStudio.handleImageUpload(event)">
                    </div>

                    <div class="fvs-field">
                        <div class="fvs-field-label">Ou URL Direta da Imagem</div>
                        <input type="text" id="fvs-img-url-input" class="fvs-input" placeholder="assets/foto.jpg ou https://..." oninput="window.FalcoStudio.setImageSrc(this.value)">
                    </div>

                    <div class="fvs-field">
                        <div class="fvs-field-label">
                            <span>Largura da Imagem (Width)</span>
                            <span id="fvs-img-width-val" class="fvs-field-val">250px</span>
                        </div>
                        <div class="fvs-range-row">
                            <input type="range" id="fvs-input-img-width" min="40" max="1000" value="250" oninput="window.FalcoStudio.setImgWidth(this.value)">
                        </div>
                    </div>

                    <div class="fvs-field">
                        <div class="fvs-field-label">Filtros da Imagem</div>
                        <div class="fvs-btn-grid">
                            <button type="button" class="fvs-preset-btn" onclick="window.FalcoStudio.setImgFilter('none')">Original</button>
                            <button type="button" class="fvs-preset-btn" onclick="window.FalcoStudio.setImgFilter('grayscale(100%)')">P&B</button>
                            <button type="button" class="fvs-preset-btn" onclick="window.FalcoStudio.setImgFilter('sepia(40%) contrast(110%)')">Dourado / Sépia</button>
                            <button type="button" class="fvs-preset-btn" onclick="window.FalcoStudio.setImgFilter('brightness(1.15) contrast(1.1)')">Brilho Pro</button>
                        </div>
                    </div>
                </div>

                <!-- ABA 4: ESPAÇAMENTO & POSIÇÃO -->
                <div id="fvs-tab-spacing" class="fvs-tab-content" style="display:none;">
                    <div class="fvs-field">
                        <div class="fvs-field-label">Mover Posição (Pixels)</div>
                        <div class="fvs-btn-grid">
                            <button type="button" class="fvs-preset-btn" onclick="window.FalcoStudio.moveElement(0, -10)">⬆ Subir 10px</button>
                            <button type="button" class="fvs-preset-btn" onclick="window.FalcoStudio.moveElement(0, 10)">⬇ Descer 10px</button>
                            <button type="button" class="fvs-preset-btn" onclick="window.FalcoStudio.moveElement(-10, 0)">⬅ Esquerda 10px</button>
                            <button type="button" class="fvs-preset-btn" onclick="window.FalcoStudio.moveElement(10, 0)">➡ Direita 10px</button>
                        </div>
                    </div>

                    <div class="fvs-field">
                        <div class="fvs-field-label">
                            <span>Padding Interno</span>
                            <span id="fvs-padding-val" class="fvs-field-val">16px</span>
                        </div>
                        <div class="fvs-range-row">
                            <input type="range" id="fvs-input-padding" min="0" max="80" value="16" oninput="window.FalcoStudio.setPadding(this.value)">
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(inspector);

        // Launcher
        const launcher = document.createElement('button');
        launcher.id = 'falco-studio-launcher-btn';
        launcher.className = 'fvs-hidden';
        launcher.innerHTML = `<span>🎨 Abrir Studio Visual</span>`;
        launcher.onclick = () => window.FalcoStudio.toggleMode();
        document.body.appendChild(launcher);
    }

    // Inicialização do Motor do Studio
    window.FalcoStudio = {
        init: function () {
            injectGoogleFonts();
            injectStyles();
            injectStudioUI();

            document.body.classList.add('falco-studio-active', 'fvs-dock-top');
            this.enableInlineEditing(true);

            // Ouvinte global de cliques
            document.addEventListener('click', (e) => {
                if (!isEditMode) return;
                if (e.target.closest('#falco-top-studio-bar') || e.target.closest('#falco-floating-inspector') || e.target.closest('#falco-studio-launcher-btn') || e.target.closest('#falco-transform-gizmo')) {
                    return;
                }

                this.selectElement(e.target);
            }, true);

            // Ouvinte global de Mouse Move para Drag & Resize
            window.addEventListener('mousemove', (e) => {
                if (isResizing) {
                    this.handleResizeMove(e);
                } else if (isDragging) {
                    this.handleMoveDragMove(e);
                }
            });

            // Ouvinte global de Mouse Up
            window.addEventListener('mouseup', () => {
                if (isResizing || isDragging) {
                    isResizing = false;
                    isDragging = false;
                    currentHandle = null;
                    this.updateGizmoPosition();
                }
            });

            // Recalcular posição do Gizmo ao rolar ou redimensionar
            window.addEventListener('scroll', () => this.updateGizmoPosition(), { passive: true });
            window.addEventListener('resize', () => this.updateGizmoPosition(), { passive: true });

            // Alt + Scroll do mouse para escalar qualquer elemento
            window.addEventListener('wheel', (e) => {
                if (isEditMode && e.altKey && activeElement) {
                    e.preventDefault();
                    const factor = e.deltaY < 0 ? 1.05 : 0.95;
                    this.quickScale(factor);
                }
            }, { passive: false });

            // Ctrl + E ou Cmd + E
            window.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
                    e.preventDefault();
                    this.toggleMode();
                }
            });

            this.cleanLegacyStorageArtifacts();
        },

        // Limpar artefatos e caches de versões antigas gravados no localStorage
        cleanLegacyStorageArtifacts: function () {
            try {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('falco_studio_saved_') || key.startsWith('falco_editor_')) {
                        localStorage.removeItem(key);
                    }
                });
            } catch (err) {
                console.warn('Storage cleanup:', err);
            }
        },

        selectElement: function (el) {
            if (!el || el === document.body || el === document.documentElement) return;

            if (activeElement) {
                activeElement.classList.remove('fvs-selected-element');
            }

            activeElement = el;
            activeElement.classList.add('fvs-selected-element');

            const tagChip = document.getElementById('fvs-selected-tag');
            const targetBadge = document.getElementById('fvs-target-type-badge');
            const uploadBtn = document.getElementById('fvs-gizmo-upload-btn');
            const tagName = el.tagName.toLowerCase();
            const textPreview = el.innerText ? `"${el.innerText.trim().substring(0, 24)}..."` : '';

            if (tagChip) tagChip.innerText = `<${tagName}> ${textPreview}`;
            if (targetBadge) targetBadge.innerText = `(${tagName.toUpperCase()})`;

            if (uploadBtn) {
                uploadBtn.style.display = (el.tagName === 'IMG' || el.style.backgroundImage) ? 'inline-flex' : 'none';
            }

            this.syncInspectorValues(el);
            this.updateGizmoPosition();

            if (el.tagName === 'IMG') {
                this.switchTab('media', document.querySelectorAll('.fvs-tab-btn')[2]);
            } else if (el.tagName === 'A' || el.tagName === 'BUTTON') {
                this.switchTab('style', document.querySelectorAll('.fvs-tab-btn')[0]);
            }
        },

        updateGizmoPosition: function () {
            const gizmo = document.getElementById('falco-transform-gizmo');
            if (!gizmo || !activeElement || !isEditMode) {
                if (gizmo) gizmo.classList.remove('active');
                return;
            }

            const rect = activeElement.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

            gizmo.style.top = `${rect.top + scrollTop}px`;
            gizmo.style.left = `${rect.left + scrollLeft}px`;
            gizmo.style.width = `${rect.width}px`;
            gizmo.style.height = `${rect.height}px`;
            gizmo.classList.add('active');
        },

        // ── ALTERNAR POSIÇÃO DA BARRA (TOPO / RODAPÉ) ──
        toggleDockPosition: function () {
            const topBar = document.getElementById('falco-top-studio-bar');
            const label = document.getElementById('fvs-dock-label');

            if (barPosition === 'top') {
                barPosition = 'bottom';
                document.body.classList.remove('fvs-dock-top');
                document.body.classList.add('fvs-dock-bottom');
                if (topBar) {
                    topBar.classList.remove('fvs-dock-top');
                    topBar.classList.add('fvs-dock-bottom');
                }
                if (label) label.innerText = '⬆ Barra no Topo';
            } else {
                barPosition = 'top';
                document.body.classList.remove('fvs-dock-bottom');
                document.body.classList.add('fvs-dock-top');
                if (topBar) {
                    topBar.classList.remove('fvs-dock-bottom');
                    topBar.classList.add('fvs-dock-top');
                }
                if (label) label.innerText = '⬇ Barra em Baixo';
            }
            this.updateGizmoPosition();
        },

        // ── REDIMENSIONAMENTO POR ARRASTO DO MOUSE ──
        startResize: function (e, handle) {
            e.preventDefault();
            e.stopPropagation();
            if (!activeElement) return;

            isResizing = true;
            currentHandle = handle;
            startX = e.clientX;
            startY = e.clientY;

            const rect = activeElement.getBoundingClientRect();
            startWidth = rect.width;
            startHeight = rect.height;
        },

        handleResizeMove: function (e) {
            if (!isResizing || !activeElement) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;

            const isImage = activeElement.tagName === 'IMG';
            const aspectRatio = startWidth / (startHeight || 1);

            if (currentHandle.includes('e')) newWidth = Math.max(30, startWidth + dx);
            if (currentHandle.includes('w')) newWidth = Math.max(30, startWidth - dx);
            if (currentHandle.includes('s')) newHeight = Math.max(20, startHeight + dy);
            if (currentHandle.includes('n')) newHeight = Math.max(20, startHeight - dy);

            if (isImage || e.shiftKey) {
                if (currentHandle.includes('e') || currentHandle.includes('w')) {
                    newHeight = newWidth / aspectRatio;
                } else {
                    newWidth = newHeight * aspectRatio;
                }
            }

            activeElement.style.width = `${Math.round(newWidth)}px`;
            activeElement.style.height = isImage ? 'auto' : `${Math.round(newHeight)}px`;
            activeElement.style.maxWidth = 'none';

            this.updateGizmoPosition();
            this.syncInspectorValues(activeElement);
        },

        // ── ARRASTAR E MOVER (DRAG TO MOVE) ──
        startMoveDrag: function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (!activeElement) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const computed = window.getComputedStyle(activeElement);
            startMarginLeft = parseInt(computed.marginLeft) || 0;
            startMarginTop = parseInt(computed.marginTop) || 0;
        },

        handleMoveDragMove: function (e) {
            if (!isDragging || !activeElement) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            activeElement.style.marginLeft = `${startMarginLeft + dx}px`;
            activeElement.style.marginTop = `${startMarginTop + dy}px`;

            this.updateGizmoPosition();
        },

        moveElement: function (deltaX, deltaY) {
            if (!activeElement) return;
            const computed = window.getComputedStyle(activeElement);
            const currentML = parseInt(computed.marginLeft) || 0;
            const currentMT = parseInt(computed.marginTop) || 0;

            activeElement.style.marginLeft = `${currentML + deltaX}px`;
            activeElement.style.marginTop = `${currentMT + deltaY}px`;

            this.updateGizmoPosition();
        },

        quickScale: function (factor) {
            if (!activeElement) return;

            const rect = activeElement.getBoundingClientRect();
            const currentWidth = rect.width || activeElement.offsetWidth || 200;
            const newWidth = Math.round(Math.max(30, currentWidth * factor));

            activeElement.style.width = `${newWidth}px`;
            activeElement.style.maxWidth = 'none';

            if (activeElement.tagName !== 'IMG') {
                const currentFontSize = parseInt(window.getComputedStyle(activeElement).fontSize) || 16;
                const newFontSize = Math.round(Math.max(10, currentFontSize * factor));
                activeElement.style.fontSize = `${newFontSize}px`;
            }

            this.updateGizmoPosition();
            this.syncInspectorValues(activeElement);
        },

        syncInspectorValues: function (el) {
            const style = window.getComputedStyle(el);

            const fontSize = parseInt(style.fontSize) || 16;
            const fontInput = document.getElementById('fvs-input-fontsize');
            const fontVal = document.getElementById('fvs-fontsize-val');
            if (fontInput) fontInput.value = fontSize;
            if (fontVal) fontVal.innerText = `${fontSize}px`;

            const textColor = this.rgbToHex(style.color);
            const textInput = document.getElementById('fvs-input-text-color');
            const textHex = document.getElementById('fvs-input-text-hex');
            if (textInput) textInput.value = textColor;
            if (textHex) textHex.value = textColor;

            const bgColor = this.rgbToHex(style.backgroundColor);
            const bgInput = document.getElementById('fvs-input-bg-color');
            const bgHex = document.getElementById('fvs-input-bg-hex');
            if (bgInput) bgInput.value = bgColor !== '#000000' ? bgColor : '#121216';
            if (bgHex) bgHex.value = bgColor;

            const radius = parseInt(style.borderRadius) || 0;
            const radiusInput = document.getElementById('fvs-input-radius');
            const radiusVal = document.getElementById('fvs-radius-val');
            if (radiusInput) radiusInput.value = radius;
            if (radiusVal) radiusVal.innerText = `${radius}px`;

            const padding = parseInt(style.paddingTop) || 0;
            const paddingInput = document.getElementById('fvs-input-padding');
            const paddingVal = document.getElementById('fvs-padding-val');
            if (paddingInput) paddingInput.value = padding;
            if (paddingVal) paddingVal.innerText = `${padding}px`;

            if (el.tagName === 'IMG') {
                const imgInput = document.getElementById('fvs-img-url-input');
                if (imgInput) imgInput.value = el.src || '';
                const imgWidth = parseInt(style.width) || el.offsetWidth || 250;
                const widthInput = document.getElementById('fvs-input-img-width');
                const widthVal = document.getElementById('fvs-img-width-val');
                if (widthInput) widthInput.value = imgWidth;
                if (widthVal) widthVal.innerText = `${imgWidth}px`;
            }

            const linkInput = document.getElementById('fvs-input-link');
            const parentLink = el.tagName === 'A' ? el : el.closest('a');
            if (linkInput) {
                linkInput.value = parentLink ? (parentLink.href || '') : '';
            }
        },

        switchTab: function (tabName, btn) {
            document.querySelectorAll('.fvs-tab-content').forEach(c => c.style.display = 'none');
            document.querySelectorAll('.fvs-tab-btn').forEach(b => b.classList.remove('active'));

            const target = document.getElementById(`fvs-tab-${tabName}`);
            if (target) target.style.display = 'block';
            if (btn) btn.classList.add('active');
        },

        toggleMode: function () {
            isEditMode = !isEditMode;
            const topBar = document.getElementById('falco-top-studio-bar');
            const inspector = document.getElementById('falco-floating-inspector');
            const gizmo = document.getElementById('falco-transform-gizmo');
            const launcher = document.getElementById('falco-studio-launcher-btn');
            const btnMode = document.getElementById('fvs-btn-mode-toggle');

            if (isEditMode) {
                document.body.classList.add('falco-studio-active');
                if (barPosition === 'top') {
                    document.body.classList.add('fvs-dock-top');
                    document.body.classList.remove('fvs-dock-bottom');
                } else {
                    document.body.classList.add('fvs-dock-bottom');
                    document.body.classList.remove('fvs-dock-top');
                }
                if (topBar) topBar.classList.remove('fvs-hidden');
                if (inspector && !isInspectorCollapsed) inspector.classList.remove('fvs-hidden');
                if (launcher) launcher.classList.add('fvs-hidden');
                if (btnMode) btnMode.classList.add('active');
                this.enableInlineEditing(true);
                this.updateGizmoPosition();
            } else {
                document.body.classList.remove('falco-studio-active', 'fvs-dock-top', 'fvs-dock-bottom');
                if (topBar) topBar.classList.add('fvs-hidden');
                if (inspector) inspector.classList.add('fvs-hidden');
                if (gizmo) gizmo.classList.remove('active');
                if (launcher) launcher.classList.remove('fvs-hidden');
                if (btnMode) btnMode.classList.remove('active');
                this.enableInlineEditing(false);
                if (activeElement) activeElement.classList.remove('fvs-selected-element');
            }
        },

        toggleInspector: function () {
            const inspector = document.getElementById('falco-floating-inspector');
            if (!inspector) return;
            isInspectorCollapsed = !isInspectorCollapsed;
            inspector.style.display = isInspectorCollapsed ? 'none' : 'flex';
        },

        enableInlineEditing: function (enable) {
            const editableTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'BUTTON', 'LI', 'LABEL', 'DIV'];
            document.querySelectorAll('*').forEach(el => {
                if (el.closest('#falco-top-studio-bar') || el.closest('#falco-floating-inspector') || el.closest('#falco-studio-launcher-btn') || el.closest('#falco-transform-gizmo')) {
                    return;
                }
                if (editableTags.includes(el.tagName) && el.children.length === 0) {
                    el.contentEditable = enable ? "true" : "false";
                }
            });
        },

        setFontFamily: function (font) {
            if (!activeElement) return;
            activeElement.style.fontFamily = font;
        },

        setFontSize: function (size) {
            if (!activeElement) return;
            activeElement.style.fontSize = `${size}px`;
            const valDisplay = document.getElementById('fvs-fontsize-val');
            if (valDisplay) valDisplay.innerText = `${size}px`;
            this.updateGizmoPosition();
        },

        setTextColor: function (hex) {
            if (!activeElement) return;
            activeElement.style.color = hex;
            const input = document.getElementById('fvs-input-text-color');
            const hexInput = document.getElementById('fvs-input-text-hex');
            if (input) input.value = hex;
            if (hexInput) hexInput.value = hex;
        },

        setBgColor: function (bg) {
            if (!activeElement) return;
            activeElement.style.backgroundColor = bg;
            const input = document.getElementById('fvs-input-bg-color');
            const hexInput = document.getElementById('fvs-input-bg-hex');
            if (input && bg.startsWith('#')) input.value = bg;
            if (hexInput) hexInput.value = bg;
        },

        setRadius: function (r) {
            if (!activeElement) return;
            activeElement.style.borderRadius = `${r}px`;
            const valDisplay = document.getElementById('fvs-radius-val');
            if (valDisplay) valDisplay.innerText = `${r}px`;
        },

        setBorderColor: function (color) {
            if (!activeElement) return;
            activeElement.style.borderColor = color;
            if (!activeElement.style.borderStyle) activeElement.style.borderStyle = 'solid';
        },

        setBorderWidth: function (w) {
            if (!activeElement) return;
            activeElement.style.borderWidth = w;
            if (w !== '0px') {
                activeElement.style.borderStyle = 'solid';
                if (!activeElement.style.borderColor) activeElement.style.borderColor = '#c9a961';
            }
        },

        setPadding: function (p) {
            if (!activeElement) return;
            activeElement.style.padding = `${p}px`;
            const valDisplay = document.getElementById('fvs-padding-val');
            if (valDisplay) valDisplay.innerText = `${p}px`;
            this.updateGizmoPosition();
        },

        setTextAlign: function (align) {
            if (!activeElement) return;
            activeElement.style.textAlign = align;
        },

        setLink: function (href) {
            if (!activeElement) return;
            const parentLink = activeElement.tagName === 'A' ? activeElement : activeElement.closest('a');
            if (parentLink) parentLink.href = href;
        },

        handleImageUpload: function (event) {
            const file = event.target.files[0];
            if (!file || !activeElement) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                if (activeElement.tagName === 'IMG') {
                    activeElement.src = dataUrl;
                } else {
                    activeElement.style.backgroundImage = `url(${dataUrl})`;
                    activeElement.style.backgroundSize = 'cover';
                    activeElement.style.backgroundPosition = 'center';
                }
                const urlInput = document.getElementById('fvs-img-url-input');
                if (urlInput) urlInput.value = dataUrl.substring(0, 50) + '... (Imagem Local)';
                this.updateGizmoPosition();
            };
            reader.readAsDataURL(file);
        },

        setImageSrc: function (url) {
            if (!activeElement) return;
            if (activeElement.tagName === 'IMG') {
                activeElement.src = url;
            } else {
                activeElement.style.backgroundImage = `url(${url})`;
            }
            this.updateGizmoPosition();
        },

        setImgWidth: function (w) {
            if (!activeElement) return;
            activeElement.style.width = `${w}px`;
            activeElement.style.maxWidth = 'none';
            const valDisplay = document.getElementById('fvs-img-width-val');
            if (valDisplay) valDisplay.innerText = `${w}px`;
            this.updateGizmoPosition();
        },

        setImgFilter: function (filter) {
            if (!activeElement) return;
            activeElement.style.filter = filter;
        },

        applyPreset: function (preset) {
            if (!activeElement) return;
            switch (preset) {
                case 'gold-solid':
                    activeElement.style.background = 'linear-gradient(135deg, #c9a961 0%, #dfc079 50%, #967637 100%)';
                    activeElement.style.color = '#060608';
                    activeElement.style.fontWeight = '800';
                    activeElement.style.border = 'none';
                    activeElement.style.borderRadius = '9999px';
                    activeElement.style.boxShadow = '0 6px 20px rgba(201, 169, 97, 0.45)';
                    break;
                case 'gold-outline':
                    activeElement.style.background = 'transparent';
                    activeElement.style.color = '#dfc079';
                    activeElement.style.fontWeight = '700';
                    activeElement.style.border = '2px solid #c9a961';
                    activeElement.style.borderRadius = '9999px';
                    activeElement.style.boxShadow = '0 0 15px rgba(201, 169, 97, 0.2)';
                    break;
                case 'whatsapp-pulse':
                    activeElement.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
                    activeElement.style.color = '#ffffff';
                    activeElement.style.fontWeight = '800';
                    activeElement.style.border = 'none';
                    activeElement.style.borderRadius = '9999px';
                    activeElement.style.boxShadow = '0 8px 25px rgba(34, 197, 94, 0.5)';
                    break;
                case 'glass':
                    activeElement.style.background = 'rgba(255, 255, 255, 0.06)';
                    activeElement.style.backdropFilter = 'blur(16px)';
                    activeElement.style.color = '#ffffff';
                    activeElement.style.border = '1px solid rgba(201, 169, 97, 0.35)';
                    activeElement.style.borderRadius = '16px';
                    activeElement.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.8)';
                    break;
            }
            this.syncInspectorValues(activeElement);
            this.updateGizmoPosition();
        },

        saveEdits: function () {
            const appRoot = document.getElementById('root') || document.getElementById('page-wrapper') || document.body;
            const clone = appRoot.cloneNode(true);
            clone.querySelectorAll('#falco-top-studio-bar, #falco-editor-bar, #falco-floating-inspector, #falco-transform-gizmo, #falco-studio-launcher-btn, #falco-studio-styles, #falco-studio-fonts').forEach(el => el.remove());
            clone.querySelectorAll('.fvs-selected-element').forEach(el => el.classList.remove('fvs-selected-element'));
            clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));

            localStorage.setItem(STORAGE_KEY, clone.innerHTML);
            alert('✅ Alterações visuais salvas no navegador com sucesso!');
        },

        loadSavedEdits: function () {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const appRoot = document.getElementById('root') || document.getElementById('page-wrapper');
                if (appRoot) {
                    appRoot.innerHTML = saved;
                    if (isEditMode) this.enableInlineEditing(true);
                }
            }
        },

        resetOriginal: function () {
            if (!confirm('Deseja descartar as alterações e restaurar a página original?')) return;
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        },

        getCleanHtml: function () {
            const clone = document.documentElement.cloneNode(true);
            clone.querySelectorAll('#falco-top-studio-bar, #falco-editor-bar, #falco-floating-inspector, #falco-transform-gizmo, #falco-studio-launcher-btn, #falco-studio-styles, #falco-studio-fonts').forEach(el => el.remove());

            clone.classList.remove('falco-studio-active', 'fvs-dock-top', 'fvs-dock-bottom');
            clone.querySelectorAll('.fvs-selected-element').forEach(el => el.classList.remove('fvs-selected-element'));
            clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));

            return '<!DOCTYPE html>\n' + clone.outerHTML;
        },

        downloadHtml: function () {
            const cleanHtml = this.getCleanHtml();
            const blob = new Blob([cleanHtml], { type: 'text/html' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'index-editado.html';
            link.click();
        },

        copyCleanHtml: function () {
            const cleanHtml = this.getCleanHtml();
            navigator.clipboard.writeText(cleanHtml).then(() => {
                alert('📋 Código HTML limpo copiado para a área de transferência!');
            });
        },

        rgbToHex: function (rgb) {
            if (!rgb || rgb.startsWith('#')) return rgb || '#ffffff';
            const res = rgb.match(/\d+/g);
            if (!res || res.length < 3) return '#ffffff';
            return "#" + ((1 << 24) + (parseInt(res[0]) << 16) + (parseInt(res[1]) << 8) + parseInt(res[2])).toString(16).slice(1);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.FalcoStudio.init());
    } else {
        window.FalcoStudio.init();
    }
})();
