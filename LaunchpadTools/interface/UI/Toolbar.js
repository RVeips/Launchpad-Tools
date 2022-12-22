class Toolbar {
    static s_Tabs = {}
    static s_Toolbar
    static toolbar_MenuMap

    static Initialize() {
        console.log("Initialize Toolbar")
        Toolbar.s_Toolbar = document.getElementById('toolbar')
        Toolbar.toolbar_MenuMap = [
            {
                name: 'Settings',
                actions: [
                    { name: 'MIDI Interfaces', action: function () { new MIDIInterfacesWindow } },
                ]
            },
        ]

        // Create menu entries
        var tbEntries = ''
        for (var entry of Toolbar.toolbar_MenuMap) {
            entry.safe_name = entry.name.replace(/ /g, "_")
            var tbActions = ``;
            for (var act of entry.actions) {
                if (act == null) {
                    tbActions += `<hr class="toolbar-action-sep">`;
                } else {
                    act.safe_name = act.name.replace(/ /g, "_")
                    tbActions += `<div class="toolbar-action-entry" id="toolbar_${entry.safe_name}_${act.safe_name}">${act.name}</div>`;
                }
            }

            // WEB_COMPILER_INLINE_HTML_BEGIN
            tbEntries += ` 
            <div class="toolbar-entry" id="toolbar_${entry.safe_name}">
                <div class="toolbar-button flex-center" id="toolbar_btn_${entry.safe_name}">${entry.name}</div>
                <div class="toolbar-actions" id="toolbar_act_${entry.safe_name}">
                    ${tbActions}
                </div>
            </div>`
            // WEB_COMPILER_INLINE_HTML_END
        }

        Toolbar.s_Toolbar.innerHTML = tbEntries

        // Register handlers
        for (let entry of Toolbar.toolbar_MenuMap) {
            let entryTrig = document.getElementById(`toolbar_${entry.safe_name}`)
            let entryBtn = document.getElementById(`toolbar_btn_${entry.safe_name}`)
            let entryAct = document.getElementById(`toolbar_act_${entry.safe_name}`)

            entryTrig.addEventListener('mouseenter', function () {
                entryBtn.classList.add('toolbar-entry-button-trighover');
                entryAct.classList.add('toolbar-entry-action-trighover');
            })

            entryTrig.addEventListener('mouseleave', function () {
                entryBtn.classList.remove('toolbar-entry-button-trighover');
                entryAct.classList.remove('toolbar-entry-action-trighover');
            })

            for (let act of entry.actions || []) {
                if (!act) // skip separator
                    continue

                let btn = document.getElementById(`toolbar_${entry.safe_name}_${act.safe_name}`);
                btn.addEventListener('click', function () {
                    entryBtn.classList.remove('toolbar-entry-button-trighover');
                    entryAct.classList.remove('toolbar-entry-action-trighover');
                    act.action()
                })
            }
        }
    }

    static AddTab(name, openCallback, closeCallback, dom) {
        const safeName = name.replace(/ /g, "_")
        Toolbar.s_Tabs[safeName] = { "openCallback": openCallback, "closeCallback": closeCallback, isOpen: false, "dom": dom, "dom_parent": dom.parentElement }
        dom.remove()
        // WEB_COMPILER_INLINE_HTML_BEGIN
        const tabEntry = ` 
            <div class="toolbar-entry" id="toolbar_tab_${safeName}">
                <div class="toolbar-button toolbar-tab flex-center" id="toolbar_btn_${safeName}">${name}</div>
            </div>`
        // WEB_COMPILER_INLINE_HTML_END

        Toolbar.s_Toolbar.insertAdjacentHTML("afterbegin", tabEntry)

        // Register handlers
        let entryTrig = document.getElementById(`toolbar_tab_${safeName}`)
        let entryBtn = document.getElementById(`toolbar_btn_${safeName}`)

        entryTrig.addEventListener('mouseenter', function () {
            entryBtn.classList.add('toolbar-entry-button-trighover');
        })

        entryTrig.addEventListener('mouseleave', function () {
            entryBtn.classList.remove('toolbar-entry-button-trighover');
        })

        entryTrig.addEventListener('click', () => {
            Toolbar.OpenTab(safeName)
        })

        return dom
    }

    static OpenTab(name) {
        const safeName = name.replace(/ /g, "_")
        let tab = Toolbar.s_Tabs[safeName]
        if (!tab) {
            console.error("Tab not found - " + name)
            return
        }
        if (!tab.isOpen) {
            tab.isOpen = true
            document.getElementById(`toolbar_btn_${safeName}`).classList.add('toolbar-tab-selected')
            if (tab.openCallback)
                tab.openCallback({ dom: tab.dom, parent: tab.dom_parent })
        }

        for (const tabName in Toolbar.s_Tabs) {
            if (tabName === safeName)
                continue
            let tab = Toolbar.s_Tabs[tabName]
            if (tab.isOpen) {
                tab.isOpen = false
                document.getElementById(`toolbar_btn_${tabName}`).classList.remove('toolbar-tab-selected');
                if (tab.closeCallback)
                    tab.closeCallback({ "dom": tab.dom, parent: tab.dom_parent })
            }
        }
    }

    static SetTabLabel(name, label) {
        const safeName = name.replace(/ /g, "_")
        document.getElementById(`toolbar_btn_${safeName}`).innerHTML = label
    }
}