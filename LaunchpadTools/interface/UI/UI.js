
class UI {

    static enum_Color = {
        ARTNET: "rgb(136,0,255)",
        SACN: "rgb(255,181,20)",
        RTTRPL: "rgb(0,240,160)",
        DMX_IN: "rgb(0,160,255)",
    }

    static enum_StatusType = {
        INFO: 0,
        WARNING: 1,
        ERROR: 2,
    }

    // Keyboard
    static enum_KeyCode = {
        CONTROL: "Control",
        SHIFT: "Shift",
    }
    static _KeyboardState = {}
    // Mouse
    static enum_MouseButton = {
        LEFT: 0,
        MIDDLE: 1,
        RIGHT: 2,
    }

    // File dialog
    static s_FileDialogButton = null

    // SelectableFrame
    static s_SF_Containers = [] // all frames
    static s_SF_Context = null // active selection frame

    // Resizable Panels
    static s_ResizablePanelEntries = []

    // SVGs
    static s_SVG_RequiredCount = 0
    static s_SVG_LoadedCount = 0
    static s_SVG_Map = {
        "ArrowDown": null,
        "ArrowRight": null,
        "Bulb": null,
        "Expand": null,
        "Collapse": null,
        "Config": null,
        "DragIndicator": null,
        "EditBoxPencil": null,
        "Error": null,
        "ErrorFilled": null,
        "Warning": null,
        "WarningFilled": null,
        "File": null,
        "FileWithLines": null,
        "Filter": null,
        "Flash": null,
        "FolderClosed": null,
        "FolderOpen": null,
        "List": null,
        "Locked": null,
        "Unlocked": null,
        "Pencil": null,
        "Web": null,
        "Clear": null,
        "Add": null,
        "Checked": null,
        "Checkmark": null,
        "Download": null,
        "OpenExternal": null,
        "SettingsFilled": null,
        "InfoFilled": null,
        "HelpFilled": null,
        "Sort": null,
        "Terminal": null,
        "Trash": null,
        "Unchecked": null,
        "Upload": null,
        "AddBox": null,
        "EnterFullscreen": null,
        "ExitFullscreen": null,
    }

    static IsReady() {
        return this.s_SVG_LoadedCount === this.s_SVG_RequiredCount
    }

    static Initialize() {
        console.log("Initialize UI")

        for (let file in this.s_SVG_Map) {
            this.s_SVG_RequiredCount++
            let req = new XMLHttpRequest()
            req.open("GET", `http://${Config.ServerAddress}/res/img/UI/${file}.svg`, true)
            req.timeout = 5000
            req.onerror = () => { console.error("Load Error - " + file); this.s_SVG_LoadedCount++; this.s_SVG_Map[file] = undefined; }
            req.ontimeout = () => { console.error("Load Timeout - " + file); this.s_SVG_LoadedCount++; this.s_SVG_Map[file] = undefined; }
            req.onload = () => {
                this.s_SVG_LoadedCount++
                this.s_SVG_Map[file] = req.responseText.replaceAll('xmlns="http://www.w3.org/2000/svg"', 'viewbox="0 0 48 48"').replaceAll('width="48"', 'width="100%"').replaceAll('height="48" ', 'height="100%"').replaceAll("<path", "<path fill=white ")
            }
            req.send()
        }

        window.addEventListener('keydown', (e) => {
            this._KeyboardState[e.key] = true
        })

        window.addEventListener('keyup', (e) => {
            this._KeyboardState[e.key] = false
        })

        WM.RegisterEscapeEvent(UI.ProcessEvent_Escape)

        UI.InitializeFileDialog()
        UI.InitializePortSelectableHandlers()
    }

    static InitializeFileDialog() {
        Utils.AppendChild(document.body, Utils.AsHTML(`<input type="file" style="display:none;" id="ui_fd"/>`))
        UI.s_FileDialogButton = document.getElementById("ui_fd")
    }

    static OpenFileDialog(title, callback) {
        UI.s_FileDialogButton.onchange = () => {
            const filePath = UI.s_FileDialogButton.value
            callback({
                files: UI.s_FileDialogButton.files,
                name: filePath.substr(filePath.lastIndexOf('\\') + 1)
            })
        }
        UI.s_FileDialogButton.click()
    }

    static GetColoredSVG(name, color) {
        return this.s_SVG_Map[name].replaceAll("fill=white", "fill=\"" + color + "\"");
    }

    static IsKeyDown(keyCode) {
        return this._KeyboardState[keyCode] === true
    }

    static IsDescendant(parent, elem) {
        if (parent === elem)
            return true
        while (elem.parentElement) {
            if (elem.parentElement === parent)
                return true
            elem = elem.parentElement
        }
        return false
    }

    static FindParentIf(elem, pred) {
        while (elem.parentElement) {
            if (pred(elem.parentElement)) {
                return elem.parentElement
            }
            elem = elem.parentElement
        }
        return null
    }

    static ProcessEvent_Escape() {
        if (WM.GetOverlay() || WM.IsContextMenuOpen())
            return
        UI.s_SF_Context = null
        UI._SF_ClearUnrelatedSelections()
    }

    static RemToPix(rem) {
        return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }

    static PixToRem(px) {
        return px / parseFloat(getComputedStyle(document.documentElement).fontSize);
    }

    static SortChildren(parent, sel, sortFn, parentTo) {
        var sorted = Array.prototype.slice.call(parent.querySelectorAll(sel)).sort(sortFn)
        for (var sortedChild of sorted) {
            sortedChild.parentElement.appendChild(sortedChild)
        }
    }

    //////////////////////////////////////////////////////////////////

    static SetExpandSectionVisibility(trig, content, state) {
        if (state) {
            content.classList.remove("hide")
            trig.classList.add('expand-trigger-active')
        } else {
            content.classList.add("hide")
            trig.classList.remove('expand-trigger-active')
        }
    }

    static GetExpandSectionVisibility(trig) {
        return trig.classList.contains("expand-trigger-active")
    }

    static ToggleExpandSectionVisibility(trig, content) {
        this.SetExpandSectionVisibility(
            trig,
            content,
            !this.GetExpandSectionVisibility(trig)
        )
    }

    static CreateExpandSectionHTML(containerID, triggerID, contentID, headerText) {
        headerText = headerText ? '<span>' + headerText + '</span>' : ''
        // WEB_COMPILER_INLINE_HTML_BEGIN
        return `
        <div id="${containerID.replaceAll('#', '')}" class="collapse-container">
            <div class="collapse-container-header no-select">
                <div id="${triggerID.replaceAll('#', '')}" class="expand-trigger dndev-section-expand-trigger"></div>
                ${headerText}
            </div>
            <div id="${contentID.replaceAll('#', '')}" class="collapse-container-content hide"></div>
        </div>
        `
        // WEB_COMPILER_INLINE_HTML_END
    }

    static InitializeExpandSection(trig, content) {
        trig.addEventListener('click', () => {
            this.ToggleExpandSectionVisibility(
                trig,
                content
            )
        })

        this.SetExpandSectionVisibility(trig, content, true)
    }

    static GetGridTemplateForLayout(portLayout, portWidth, portHeight) {
        var rowCount = Utils.GetPortLayoutRowCount(portLayout)
        var colCount = Utils.GetPortLayoutColumnCount(portLayout)
        if (rowCount) {
            // WEB_COMPILER_INLINE_CSS_BEGIN
            return `grid-template: repeat(${rowCount}, calc(${portHeight})) / repeat(${colCount}, calc(${portWidth}));`
            // WEB_COMPILER_INLINE_CSS_END
        } else {
            // WEB_COMPILER_INLINE_CSS_BEGIN
            return `grid-template: repeat(1, calc(${portHeight})) / repeat(${portLayout}, calc(${portWidth})); `
            // WEB_COMPILER_INLINE_CSS_END
        }
    }

    static CreatePortSelectableFrame(index, id, content) {
        // WEB_COMPILER_INLINE_HTML_BEGIN
        return `
        <div id="${id}" data-sf_index="${index}" class="port-selectable-frame">
            <div id="sf_t" class="hide port-selectable-frame-t"></div>
            <div id="sf_b" class="hide port-selectable-frame-b"></div>
            <div id="sf_l" class="hide port-selectable-frame-l"></div>
            <div id="sf_r" class="hide port-selectable-frame-r"></div>
            ${content}    
        </div>
        `
        // WEB_COMPILER_INLINE_HTML_END
    }

    static SetSelectableFrameEdges(elem, top, bottom, left, right) {
        const t = elem.querySelector("#sf_t")
        const b = elem.querySelector("#sf_b")
        const l = elem.querySelector("#sf_l")
        const r = elem.querySelector("#sf_r")
        t.classList.add("hide")
        b.classList.add("hide")
        l.classList.add("hide")
        r.classList.add("hide")

        if (top)
            t.classList.remove("hide")
        if (bottom)
            b.classList.remove("hide")
        if (left)
            l.classList.remove("hide")
        if (right)
            r.classList.remove("hide")
    }

    static UpdateSelectableFrameEdges(cont, selectionGrid, idPrefix) {
        for (var x = 0; x < selectionGrid.length; x++) {
            for (var y = 0; y < selectionGrid[x].length; y++) {
                const idx = x + y * selectionGrid.length;
                const frame = cont.querySelector("#" + idPrefix + idx)
                if (frame) {
                    if (selectionGrid[x][y]) {
                        const closedTop = (y === 0) || !selectionGrid[x][y - 1]
                        const closedBottom = (y === selectionGrid[x].length - 1) || !selectionGrid[x][y + 1]
                        const closedLeft = (x === 0) || !selectionGrid[x - 1][y]
                        const closedRight = (x === selectionGrid.length - 1) || !selectionGrid[x + 1][y]
                        UI.SetSelectableFrameEdges(frame, closedTop, closedBottom, closedLeft, closedRight)
                    } else {
                        UI.SetSelectableFrameEdges(frame, false, false, false, false)
                    }
                } else {
                    console.error(`Frame ${x}.${y} not found`);
                }
            }
        }
    }

    // WCM_* WebCompiler macro
    static WCM_SFC_CHECK() {
        if (!e.target)
            return
        const sfc = UI.FindParentIf(e.target, (p) => { return p.dataset.sf_container_id })
        if (!sfc)
            return
        var entry = this.s_SF_Containers[sfc.dataset.sf_container_id]
        if (!entry)
            console.trace("Invalid sf_container_id")
    }

    // Clear all selections not in current context
    static _SF_ClearUnrelatedSelections() {
        var x = 1;
        for (var key in this.s_SF_Containers) {
            const e = this.s_SF_Containers[key]
            if (this.s_SF_Context === e)
                continue
            e.selectionOrder = []
            for (var i = 0; i < e.container.childElementCount; i++) {
                const frame = e.container.children[i]
                frame.dataset.sf_selected = false
                e.selHandler(frame, i, false)
            }
        }
    }

    // Clear selections in this context
    static _SF_ClearContextSelection() {
        this.s_SF_Context.selectionOrder = []
        for (var i = 0; i < this.s_SF_Context.container.childElementCount; i++) {
            const frame = this.s_SF_Context.container.children[i]
            frame.dataset.sf_selected = false
            this.s_SF_Context.selHandler(frame, i, false)
        }
    }

    // Select frame if target is descendant of frame in active context
    static _SF_CheckSelect(entry, target, toggle, origState) {
        const frame = UI.FindParentIf(target, (elem) => {
            return elem.dataset.sf_index
        })
        if (!frame)
            return null
        const sfIndex = parseInt(frame.dataset.sf_index)
        frame.dataset.sf_selected = toggle ? frame.dataset.sf_selected != "true" : true

        if (origState != undefined && frame.dataset.sf_selected == origState) {
            return null
        }

        if (frame.dataset.sf_selected == "true") {
            if (entry.selectionOrder.indexOf(sfIndex) === -1) {
                entry.selectionOrder.push(sfIndex)
            }
        } else {
            if (entry.selectionOrder.length === 0) {
                entry.selectionOrder = []
            } else {
                const loc = entry.selectionOrder.indexOf(sfIndex)
                if (loc !== -1) {
                    entry.selectionOrder.splice(loc, 1)
                }
            }
        }
        entry.selHandler(frame, frame.dataset.sf_index, frame.dataset.sf_selected == "true")
    }

    // selectHandler: fn(frameElem, idx, isSelected)
    static RegisterSelectableFrameContainer(cont, selectHandler) {
        if (cont.dataset.sf_container_id) {
            console.error("Selectable frame container already registered")
            console.trace(cont)
            return cont.dataset.sf_container_id
        }

        const rid = Utils.GetNewLocalUID()
        cont.dataset.sf_container_id = rid

        let entry = {
            id: rid,
            container: cont,
            selHandler: selectHandler,
            selectionOrder: [],
            lastChangedIndex: null,
        }

        this.s_SF_Containers[rid] = entry;

        return rid
    }

    static InitializePortSelectableHandlers() {
        window.addEventListener('mouseup', (e) => {
            this.s_SF_Context = null
        })

        window.addEventListener('mousedown', (e) => {
            if (e.button !== UI.enum_MouseButton.LEFT)
                return

            WCM_SFC_CHECK() // check target and get entry
            this.s_SF_Context = entry
            this._SF_ClearUnrelatedSelections()

            const frame = UI.FindParentIf(e.target, (elem) => {
                return elem.dataset.sf_index
            })
            if (!frame)
                return null

            // Ctrl+A before trying to select ports starts dragging the ports until ESC is pressed - clear global selection on port event
            var wsel = window.getSelection()
            if (wsel)
                wsel.removeAllRanges()

            var initiallySelected = frame.dataset.sf_selected == "true"
            var fromIndex = Utils.GetLastElement(entry.selectionOrder)
            var initCleared = false
            const ctrlDown = UI.IsKeyDown(UI.enum_KeyCode.CONTROL)
            const shiftDown = UI.IsKeyDown(UI.enum_KeyCode.SHIFT)
            const origSelCount = entry.selectionOrder.length

            // TODO: dont clear if selecting different port with normal leftclick - just change selection and call update
            if (!ctrlDown && !shiftDown) {
                if (entry.selectionOrder.length > 1) {
                    initiallySelected = false
                }
                this._SF_ClearContextSelection()
                initCleared = true
            } else {
                if ((ctrlDown || shiftDown) && entry.selectionOrder.length === 1 && initiallySelected) {
                    this._SF_ClearContextSelection()
                    return
                } else if (shiftDown && initiallySelected) {
                    this._SF_ClearContextSelection()
                    return
                }
            }

            if (!shiftDown || entry.selectionOrder.length === 0) {
                const origState = frame.dataset.sf_selected
                if (!(origSelCount == 1 && initiallySelected)) {
                    this._SF_CheckSelect(entry, e.target, true)
                    if (origState != frame.dataset.sf_selected) {
                        entry.lastChangedIndex = frame.dataset.sf_index
                    }
                }
            }

            if (initiallySelected && !ctrlDown && !shiftDown) {
                if (!initCleared)
                    this._SF_ClearContextSelection()
            } else {
                if (shiftDown && !ctrlDown && fromIndex !== undefined) {
                    var toIndex = parseInt(frame.dataset.sf_index)
                    if (fromIndex !== toIndex) {
                        this._SF_ClearContextSelection()
                        for (var i = fromIndex; i != (toIndex + (fromIndex > toIndex ? -1 : 1)); i += (fromIndex > toIndex ? -1 : 1)) {
                            const frame = entry.container.children[i]
                            frame.dataset.sf_selected = true
                            entry.selectionOrder.push(i)
                            entry.selHandler(frame, i, true)
                        }
                    }
                }
            }
        })

        window.addEventListener('mousemove', (e) => {
            if (!this.s_SF_Context)
                return;

            WCM_SFC_CHECK() // check target and get entry
            if (this.s_SF_Context !== entry)
                return
            const frame = UI.FindParentIf(e.target, (elem) => {
                return elem.dataset.sf_index
            })
            if (!frame)
                return null
            if (frame.dataset.sf_index !== entry.lastChangedIndex) {
                const origState = frame.dataset.sf_selected
                this._SF_CheckSelect(entry, e.target, false, origState)
                if (origState != frame.dataset.sf_selected) {
                    entry.lastChangedIndex = frame.dataset.sf_index
                }
            }
        })
    }

    static UnregisterSelectableFrameContainer(rid) {
        delete this.s_SF_Containers[rid]
    }

    static GetSelectableFrameSelectionOrder(rid) {
        return this.s_SF_Containers[rid].selectionOrder
    }

    ////////////////////////////////////////////////////////////////
    // Resizable panel
    static RegisterResizablePanel(cfg) {
        if (this.s_ResizablePanelEntries[cfg.name]) {
            console.error("RegisterResizablePanel entry [" + cfg.name + "] already exists")
            return;
        }
        if (cfg.location.toLowerCase() === "left") {
            cfg.handle.classList.add("szpanel-handle-x-left")

            this.s_ResizablePanelEntries[cfg.name] = {
                panelWidth: UI.RemToPix(cfg.size),
                dragLastPos: null,
                sizeStart: null,
                resizing: false,
            }

            let entry = this.s_ResizablePanelEntries[cfg.name]

            entry.resizeDoneCallback = cfg.resizeDoneCallback

            entry.resizeToPixelWidth = (newWidth) => {
                if (UI.PixToRem(newWidth) < cfg.minSize)
                    newWidth = UI.RemToPix(cfg.minSize)
                else if (UI.PixToRem(newWidth) > cfg.maxSize)
                    newWidth = UI.RemToPix(cfg
                        .maxSize)
                entry.panelWidth = newWidth
                cfg.adjacentElement.style.width = `calc(100% - ${UI.PixToRem(newWidth)}rem)`
                cfg.panel.style.width = `${UI.PixToRem(newWidth)}rem`
            }

            cfg.handle.addEventListener('mousedown', (e) => {
                cfg.handle.classList.add("szpanel-handle-active-x-left")
                document.body.style.cursor = "grabbing"
                entry.dragLastPos = Utils.GetMouseX(e)
                entry.sizeStart = entry.panelWidth
                entry.resizing = true
            })

            document.addEventListener('mouseup', (e) => {
                cfg.handle.classList.remove("szpanel-handle-active-x-left")
                document.body.style.cursor = "default"
                entry.resizing = false

                if (entry.resizeDoneCallback)
                    entry.resizeDoneCallback(entry)
            })

            document.addEventListener('mousemove', (e) => {
                if (!entry.resizing)
                    return
                const mx = Utils.GetMouseX(e)
                const delta = entry.dragLastPos - mx
                var newWidth = entry.sizeStart + delta
                entry.resizeToPixelWidth(newWidth)
            })

            if (cfg.defaultSize) {
                cfg.handle.addEventListener('dblclick', () => {
                    entry.resizeToPixelWidth(UI.RemToPix(cfg.defaultSize)) // default size

                    if (entry.resizeDoneCallback)
                        entry.resizeDoneCallback(entry)
                })
            }

            entry.resizeToPixelWidth(entry.panelWidth) // initial size
        } else {
            console.error("RegisterResizablePanel location not supported: " + cfg.location)
        }
    }

    static s_SessionTimeoutOpen = false
    static ShowSessionTimeoutWindow() {
        if (this.s_SessionTimeoutOpen)
            return

        this.s_SessionTimeoutOpen = true

        // WEB_COMPILER_INLINE_HTML_BEGIN
        Utils.AppendChild(document.body, Utils.AsHTML(`
        <div id="session_timeout" class="no-select">
        Manager connection lost<br><br>Close this window
        </div>
        `))
        // WEB_COMPILER_INLINE_HTML_END
    }

    static SetTopRightSVG(domCache, type) {
        if (!domCache.Find(".top-right-status-svg")) {
            if (type === UI.enum_StatusType.ERROR) {
                // WEB_COMPILER_INLINE_CSS_BEGIN
                Utils.AppendChild(domCache.root, Utils.AsHTML(UI.GetColoredSVG("ErrorFilled", "var(--error_field_ol)").replaceAll("<svg ", `<svg class="top-right-status-svg" `)))
                // WEB_COMPILER_INLINE_CSS_END
            } else if (type === UI.enum_StatusType.WARNING) {
                // WEB_COMPILER_INLINE_CSS_BEGIN
                Utils.AppendChild(domCache.root, Utils.AsHTML(UI.GetColoredSVG("WarningFilled", "var(--warning_field_ol)").replaceAll("<svg ", `<svg class="top-right-status-svg" `)))
                // WEB_COMPILER_INLINE_CSS_END
            } else if (type === UI.enum_StatusType.INFO) {
                // WEB_COMPILER_INLINE_CSS_BEGIN
                Utils.AppendChild(domCache.root, Utils.AsHTML(UI.GetColoredSVG("InfoFilled", "var(--info_field_ol)").replaceAll("<svg ", `<svg class="top-right-status-svg" `)))
                // WEB_COMPILER_INLINE_CSS_END
            }
        }
    }
}