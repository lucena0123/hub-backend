(function () {
    function showFatalError(message) {
        let banner = document.getElementById('v5-fatal-error');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'v5-fatal-error';
            banner.style.position = 'fixed';
            banner.style.top = '16px';
            banner.style.left = '50%';
            banner.style.transform = 'translateX(-50%)';
            banner.style.background = '#7f1d1d';
            banner.style.color = '#fee2e2';
            banner.style.padding = '10px 16px';
            banner.style.borderRadius = '10px';
            banner.style.fontSize = '12px';
            banner.style.fontWeight = '700';
            banner.style.zIndex = '2000';
            banner.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)';
            document.body.appendChild(banner);
        }
        banner.textContent = message;
    }

    function getParticipantBoundsFromRegistry(elementRegistry) {
        const participant = elementRegistry.getAll().find((el) => el.type === 'bpmn:Participant');
        if (!participant) return null;
        const { x, y, width, height } = participant;
        if ([x, y, width, height].some((value) => typeof value !== 'number')) return null;
        return { x, y, width, height };
    }

    function addPhaseBands(viewer, phases, participantBounds) {
        if (!Array.isArray(phases) || phases.length === 0) return;
        const canvas = viewer.get('canvas');
        const container = canvas.getLayer('background');
        const svgNS = "http://www.w3.org/2000/svg";
        const bandY = participantBounds ? participantBounds.y : 50;
        const bandHeight = participantBounds ? participantBounds.height : 750;
        const maxRight = participantBounds ? participantBounds.x + participantBounds.width : null;

        phases.forEach((phase) => {
            const group = document.createElementNS(svgNS, "g");
            const rect = document.createElementNS(svgNS, "rect");
            const rectWidth = maxRight ? Math.max(0, Math.min(phase.width, maxRight - phase.x)) : phase.width;
            if (rectWidth <= 0) return;
            rect.setAttribute("x", phase.x);
            rect.setAttribute("y", bandY);
            rect.setAttribute("width", rectWidth);
            rect.setAttribute("height", bandHeight);
            rect.setAttribute("class", "phase-band-bg");
            group.appendChild(rect);

            const labelWidth = phase.name.length * 5.5 + 16;
            const labelBg = document.createElementNS(svgNS, "rect");
            labelBg.setAttribute("x", phase.x + 10);
            labelBg.setAttribute("y", bandY + 8);
            labelBg.setAttribute("width", labelWidth);
            labelBg.setAttribute("height", 16);
            labelBg.setAttribute("class", "phase-label-bg");
            group.appendChild(labelBg);

            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("x", phase.x + 18);
            text.setAttribute("y", bandY + 19);
            text.setAttribute("class", "phase-label-text");
            text.textContent = phase.name;
            group.appendChild(text);

            container.appendChild(group);
        });
    }

    function getEditModeFromUrl() {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.has('edit')) {
                const value = params.get('edit');
                return value === '' || value === '1' || value === 'true';
            }
        } catch (err) {
            return false;
        }
        return false;
    }

    function setEditMode(enabled) {
        document.body.classList.toggle('v5-edit-mode', enabled);
        try {
            localStorage.setItem('v5EditMode', enabled ? 'true' : 'false');
        } catch (err) { }
    }

    function isEditModeEnabled() {
        const urlMode = getEditModeFromUrl();
        if (urlMode) return true;
        try {
            return localStorage.getItem('v5EditMode') === 'true';
        } catch (err) {
            return false;
        }
    }

    function ensureEditToggleButton() {
        const controls = document.querySelector('.premium-controls .zoom-controls');
        if (!controls || controls.querySelector('.edit-btn')) return null;
        const btn = document.createElement('button');
        btn.className = 'zoom-btn edit-btn';
        btn.title = 'Ativar modo edição';
        btn.textContent = '✎';
        controls.appendChild(btn);
        return btn;
    }

    function getStorageKey(config) {
        const base = (config && (config.storageKey || config.key)) || window.v5DataKey || window.location.pathname || 'v5';
        return `v5-layout:${base}`;
    }

    function createEditPanel(viewer, config, originalXml) {
        if (document.querySelector('.v5-edit-controls')) return;
        const panel = document.createElement('div');
        panel.className = 'v5-edit-controls';
        panel.innerHTML = `
            <h3>Modo Edição</h3>
            <button type="button" id="v5-save-local">Salvar local</button>
            <button type="button" id="v5-reset-local">Resetar layout</button>
            <button type="button" id="v5-copy-xml">Copiar XML</button>
            <button type="button" id="v5-download-xml">Baixar XML</button>
            <button type="button" id="v5-copy-js">Copiar snippet JS</button>
            <div class="v5-edit-hint">Arraste elementos e ajuste linhas. Clique em "Salvar local" para manter após recarregar.</div>
        `;
        document.body.appendChild(panel);

        const saveLocalButton = panel.querySelector('#v5-save-local');
        const resetLocalButton = panel.querySelector('#v5-reset-local');
        const copyButton = panel.querySelector('#v5-copy-xml');
        const downloadButton = panel.querySelector('#v5-download-xml');
        const copyJsButton = panel.querySelector('#v5-copy-js');

        const saveXml = () => viewer.saveXML({ format: true }).then(({ xml }) => xml);
        const storageKey = getStorageKey(config);

        if (saveLocalButton) {
            saveLocalButton.addEventListener('click', async () => {
                const xml = await saveXml();
                try {
                    localStorage.setItem(storageKey, xml);
                    saveLocalButton.textContent = 'Salvo ✓';
                    setTimeout(() => { saveLocalButton.textContent = 'Salvar local'; }, 1200);
                } catch (err) {
                    showFatalError('Erro ao salvar no navegador.');
                }
            });
        }

        if (resetLocalButton) {
            resetLocalButton.addEventListener('click', async () => {
                try {
                    localStorage.removeItem(storageKey);
                } catch (err) { }
                if (originalXml) {
                    viewer.importXML(originalXml).then(() => {
                        window.location.reload();
                    }).catch(() => window.location.reload());
                } else {
                    window.location.reload();
                }
            });
        }

        copyButton.addEventListener('click', async () => {
            const xml = await saveXml();
            copyTextToClipboard(xml);
        });

        downloadButton.addEventListener('click', async () => {
            const xml = await saveXml();
            const blob = new Blob([xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'diagram.bpmn';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        });

        copyJsButton.addEventListener('click', async () => {
            const xml = await saveXml();
            const safeXml = xml.replace(/`/g, '\\`');
            const snippet = 'const diagramXML = `\n' + safeXml + '\n`;';
            copyTextToClipboard(snippet);
        });
    }

    function copyTextToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
            return;
        }
        fallbackCopy(text);
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.top = '-1000px';
        document.body.appendChild(textarea);
        textarea.select();
        try { document.execCommand('copy'); } catch (err) { }
        textarea.remove();
    }

    function initBpmnV5(config) {
        const {
            diagramXML,
            nodeDetails = {},
            phases = [],
            zoom = 0.85,
            startLabel = 'INÍCIO DO PROCESSO',
            endLabels = {},
            showDefaultEndLabel = true,
            useEndName = true,
            defaultEndLabelText = 'FIM',
            defaultEndClass = 'end-label-lost'
        } = config || {};

        const storageKey = getStorageKey(config);
        let resolvedXml = diagramXML;
        try {
            const storedXml = localStorage.getItem(storageKey);
            if (storedXml) resolvedXml = storedXml;
        } catch (err) { }

        if (!resolvedXml) {
            console.error('diagramXML não informado.');
            showFatalError('Erro: diagramXML não informado.');
            return;
        }

        if (typeof window.BpmnJS === 'undefined') {
            console.error('BpmnJS não carregou.');
            showFatalError('Erro: bpmn-modeler não carregou.');
            return;
        }

        if (!document.getElementById('canvas')) {
            console.error('Elemento #canvas não encontrado.');
            showFatalError('Erro: elemento #canvas não encontrado.');
            return;
        }

        const viewer = new BpmnJS({ container: '#canvas' });
        viewer.importXML(resolvedXml).then(function () {
            const canvas = viewer.get('canvas');
            const overlays = viewer.get('overlays');
            const elementRegistry = viewer.get('elementRegistry');
            const participantBounds = getParticipantBoundsFromRegistry(elementRegistry);
            const editMode = isEditModeEnabled();
            setEditMode(editMode);
            const editToggle = ensureEditToggleButton();
            if (editToggle) {
                editToggle.classList.toggle('active', editMode);
                editToggle.title = editMode ? 'Desativar modo edição' : 'Ativar modo edição';
                editToggle.addEventListener('click', function () {
                    const nextState = !document.body.classList.contains('v5-edit-mode');
                    setEditMode(nextState);
                    editToggle.classList.toggle('active', nextState);
                    editToggle.title = nextState ? 'Desativar modo edição' : 'Ativar modo edição';
                });
            }
            createEditPanel(viewer, config, diagramXML);

            // Zoom otimizado para legibilidade imediata (Nível 5)
            canvas.zoom(zoom);
            const viewbox = canvas.viewbox();
            canvas.viewbox({
                x: 0,
                y: 0,
                width: viewbox.width,
                height: viewbox.height
            });

            // Configuração do Slider de Scroll
            const slider = document.getElementById('scroll-slider');
            const updateSliderMax = function () {
                if (!participantBounds || !slider) return;
                const v = canvas.viewbox();
                const maxX = Math.max(0, (participantBounds.x + participantBounds.width) - v.width);
                slider.max = Math.round(maxX);
                if (parseInt(slider.value, 10) > slider.max) slider.value = slider.max;
            };
            updateSliderMax();

            if (slider) {
                // Sincroniza Slider -> Viewbox
                slider.addEventListener('input', function () {
                    const v = canvas.viewbox();
                    canvas.viewbox({
                        x: parseInt(this.value),
                        y: v.y,
                        width: v.width,
                        height: v.height
                    });
                });

                // Sincroniza Viewbox -> Slider (para arraste manual)
                viewer.get('eventBus').on('canvas.viewbox.changed', function (e) {
                    const v = e.viewbox;
                    updateSliderMax();
                    slider.value = v.x;
                });
            }

            // Funções de Zoom Globais
            window.zoomIn = function () {
                viewer.get('canvas').zoom(viewer.get('canvas').zoom() + 0.1);
                updateSliderMax();
            };
            window.zoomOut = function () {
                viewer.get('canvas').zoom(viewer.get('canvas').zoom() - 0.1);
                updateSliderMax();
            };
            window.resetZoom = function () {
                viewer.get('canvas').zoom('fit-viewport');
                const v = viewer.get('canvas').viewbox();
                viewer.get('canvas').viewbox({ x: 0, y: v.y, width: v.width, height: v.height });
                updateSliderMax();
            };

            elementRegistry.getAll().forEach(function (e) {
                if (e.type === 'bpmn:StartEvent') {
                    canvas.addMarker(e.id, 'event-start');
                    overlays.add(e.id, {
                        position: { bottom: -30, left: -20 },
                        html: `<div class="node-label start-label">${startLabel}</div>`
                    });
                }
                else if (e.type === 'bpmn:EndEvent') {
                    canvas.addMarker(e.id, 'event-end');
                    const endConfig = endLabels[e.id];
                    if (endConfig) {
                        if (endConfig.marker) canvas.addMarker(e.id, endConfig.marker);
                        overlays.add(e.id, {
                            position: { bottom: -30, left: -10 },
                            html: `<div class="node-label ${endConfig.className || ''}">${endConfig.text}</div>`
                        });
                    } else if (showDefaultEndLabel) {
                        const labelText = useEndName ? (e.name || defaultEndLabelText) : defaultEndLabelText;
                        if (labelText) {
                            overlays.add(e.id, {
                                position: { bottom: -30, left: -10 },
                                html: `<div class="node-label ${defaultEndClass}">${labelText}</div>`
                            });
                        }
                    }
                }
                else if (e.type === 'bpmn:ExclusiveGateway') {
                    canvas.addMarker(e.id, 'gateway-style');
                }
                else if (e.type === 'bpmn:Task') {
                    canvas.addMarker(e.id, 'task-style');
                    if (e.id.includes('_I_')) canvas.addMarker(e.id, 'task-ia');
                    else if (e.id.includes('_A_')) canvas.addMarker(e.id, 'task-auto');

                    const info = nodeDetails[e.id];
                    if (info) {
                        if (info.sla) {
                            overlays.add(e.id, {
                                position: { bottom: 0, right: 0 },
                                html: `<div class="node-badge sla-badge">SLA: ${info.sla}</div>`
                            });
                        }
                        if (info.tag) {
                            overlays.add(e.id, {
                                position: { top: 0, left: 0 },
                                html: `<div class="node-badge tag-badge">${info.tag}</div>`
                            });
                        }
                    }
                }
            });

            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
                viewer.get('eventBus').on('element.hover', function (e) {
                    const info = nodeDetails[e.element.id];
                    if (info) {
                        tooltip.innerHTML = `<strong>${info.tag || ''}</strong><br>${info.desc}<br><small>SLA: ${info.sla || 'N/A'}</small>${info.artefato ? '<br><span style="color:#a5f3fc;margin-top:6px;display:block;font-size:10px;border-top:1px solid rgba(255,255,255,0.15);padding-top:5px;">' + info.artefato + '</span>' : ''}`;
                        tooltip.style.display = 'block';
                    }
                });
                viewer.get('eventBus').on('element.out', function () { tooltip.style.display = 'none'; });
                document.body.addEventListener('mousemove', function (e) {
                    tooltip.style.left = (e.pageX + 10) + 'px';
                    tooltip.style.top = (e.pageY + 10) + 'px';
                });
            }

            addPhaseBands(viewer, phases, participantBounds);
            window.bpmnV5Viewer = viewer;
        }).catch(function (err) {
            console.error('BPMN Import Error:', err);
            showFatalError('Erro ao importar BPMN: ver console.');
        });
    }

    window.initBpmnV5 = initBpmnV5;
})();
