
class WM {
    static g_Overlay = { name: null, closeEvent: null, allowClose: null }
    static g_ContextMenuHandlers = {}
    static s_EscapeEvents = {}

    static Initialize() {
        console.log("Initialize WindowManager")

        // Initialize custom context menu
        document.addEventListener('contextmenu', (e) => {
            if (WM._ProcessContextMenuEvent(e))
                e.preventDefault();
        }, false);

        // Close context menu on Esc press
        document.addEventListener('keydown', (e) => {
            e = e || window.event;
            var isEscape = false;
            if ("key" in e) {
                isEscape = (e.key === "Escape" || e.key === "Esc");
            } else {
                isEscape = (e.keyCode === 27);
            }
            if (isEscape) {
                var needReturn = false
                for (let key in WM.s_EscapeEvents) {
                    let e = WM.s_EscapeEvents[key]
                    if (e && e()) {
                        needReturn = true
                    }
                }

                if (needReturn)
                    return

                // returns for stacked priority
                if (document.getElementById("contextMenuOverlay")) {
                    document.getElementById("contextMenuOverlay").remove()
                    return
                }
                if (WM.GetOverlay() && WM.g_Overlay.allowClose) {
                    WM.CloseOverlay();
                    return
                }
            }
        })
    }

    // if handler returns true, overlay close step is not executed
    static RegisterEscapeEvent(handler) {
        var id = Utils.GetNewLocalUID()
        WM.s_EscapeEvents[id] = handler
        return id
    }

    static UnregisterEscapeEvent(id) {
        delete s_EscapeEvents[id]
    }

    static OpenTab(url, mode) {
        window.open(url, mode || '_blank').focus();
    }

    // target.dataset.context_group
    static SetContextMenuHandler(group, handler) {
        if (!WM.g_ContextMenuHandlers[group]) {
            WM.g_ContextMenuHandlers[group] = handler
        } else {
            console.error("Context menu handler already registered for group: " + group)
        }
    }

    static AddTab(name, html, openCallback, closeCallback, tabID) {
        Utils.AppendChild(document.getElementById("window"), Utils.AsHTML(html))
        return Toolbar.AddTab(name, openCallback, closeCallback, document.getElementById(tabID))
    }

    /////////////////////////////////////
    // Overlays

    static GetOverlayRoot() {
        return document.body
    }

    static IsOverlayOpen(name) {
        return WM.g_Overlay.name === name
    }

    static OpenOverlay(name, html, closeEvent, dontAllowClose) {
        WM.g_Overlay.name = name
        WM.g_Overlay.closeEvent = closeEvent
        WM.g_Overlay.allowClose = !dontAllowClose

        Utils.AppendChild(WM.GetOverlayRoot(), Utils.AsHTML(html))

        if (WM.g_Overlay.allowClose) {
            WM.GetOverlay().addEventListener('click', function (e) {
                if (e.target == WM.GetOverlay()) {
                    WM.CloseOverlay()
                }
            })
        }
    }

    static GetOverlay() {
        return document.getElementById(WM.g_Overlay.name)
    }

    static CloseOverlay() {
        if (!WM.g_Overlay.name)
            return

        if (WM.g_Overlay.closeEvent)
            WM.g_Overlay.closeEvent()

        WM.GetOverlay().parentNode.removeChild(WM.GetOverlay())

        WM.g_Overlay.name = null
    }

    //////////////////////////////////////////////////////////////////////////
    // Context Menu

    static IsContextMenuOpen() {
        return document.getElementById("contextMenuOverlay") ? true : false
    }

    static _ProcessContextMenuEvent(e) {
        if (!e.target)
            return false

        var target = e.target
        var originalTarget = e.target
        while (1 < 2) {
            if (!target.dataset || !target.dataset.context_group) {
                target = target.parentElement
                if (!target || target === document.body)
                    return
                continue
            }
            break
        }

        if (target.dataset.context_group === "block") {
            return false
        } else if (target.dataset.context_group === "cancel") {
            return true
        }

        if (target.dataset.context_group === "contextOverlay") {
            if (document.getElementById("contextMenuOverlay")) {
                document.getElementById("contextMenuOverlay").remove()
                try {
                    // open context menu again new new target if rightclicked while context menu was open
                    var mx = Utils.GetMouseX(e)
                    var my = Utils.GetMouseY(e)
                    var newTarget = document.elementFromPoint(mx, my)
                    if (newTarget) {
                        return this._ProcessContextMenuEvent({
                            target: newTarget,
                            pageX: e.pageX,
                            pageY: e.pageY,
                            clientX: e.clientX,
                            clientY: e.clientY,
                        })
                    }
                } catch (ex) {
                    console.error(ex)
                }
            }
            return true
        }

        var groupHandler = WM.g_ContextMenuHandlers[target.dataset.context_group]
        if (groupHandler) {
            return groupHandler(target, e, originalTarget)
        } else {
            console.warn("Unknown context menu group: " + target.dataset.context_group)
            return false
        }
    }

    static OpenContextMenu(mouseEvent, dropList, cfg) {
        if (document.getElementById("contextMenuOverlay")) {
            document.getElementById("contextMenuOverlay").remove()
        }

        var mx = Utils.GetMouseX(mouseEvent)
        var my = Utils.GetMouseY(mouseEvent)

        var options = ""
        var idx = 0
        for (const entry of dropList) {
            if (entry === null) {
                options += '<hr class="context-menu-sep">'
            } else if (entry.category) {
                options += `<span class="context-menu-category">` + entry.category + '</span>'
            } else {
                options += `<span id="cm_opt_${idx}" class="context-menu-entry">` + entry.text + '</span>'
                idx++
            }
        }
        // WEB_COMPILER_INLINE_HTML_BEGIN
        var dropdownTemplate = `
            <div data-context_group="contextOverlay" id="contextMenuOverlay" class="no-select _${Utils.GetNewLocalUID()}">
                <div data-context_group="cancel" class="context-menu">
                    ${options}
                </div>
            </div>
        `

        // WEB_COMPILER_INLINE_HTML_END
        Utils.AppendChild(document.body, Utils.AsHTML(dropdownTemplate))
        var drop = new DOM_Cache(document.getElementById("contextMenuOverlay"))

        if (cfg) {
            if (cfg.minWidth) {
                drop.Find(".context-menu").style.minWidth = cfg.minWidth + "px"
            }
            if (cfg.customID) {
                drop.Find(".context-menu").id = cfg.customID
            }
        }

        mx = Math.min(mx, (document.body.clientWidth - 4) - (drop.Find(".context-menu").clientWidth + 1))
        my = Math.min(my, (document.documentElement.scrollHeight - 4) - (drop.Find(".context-menu").clientHeight + 1))
        if (my < 0)
            my = 0
        if (mx < 0)
            mx = 0
        drop.Find(".context-menu").style.left = mx + "px"
        drop.Find(".context-menu").style.top = my + "px"

        idx = 0
        for (const entry of dropList) {
            if (entry && !entry.category) {
                drop.Find("#cm_opt_" + idx).addEventListener('click', entry.action)
                idx++
            }
        }

        document.getElementById("contextMenuOverlay").addEventListener('click', () => {
            document.getElementById("contextMenuOverlay").remove()
        })
    }
}