class DropdownMenu {

    static ValidResultToClass(vr) {
        switch (vr) {
            case UI.enum_StatusType.ERROR: return "field-error"
            case UI.enum_StatusType.WARNING: return "field-warning"
            case UI.enum_StatusType.INFO: return "field-info"
            default: console.error("DropdownMenu::ValidResultToClass unknown value: " + vr); return "field-error"
        }
    }

    constructor(cfg) {
        this.m_SelectionCallback = cfg.callback
        this.m_Options = cfg.options
        this.m_SelectedIndex = cfg.selectedIndex
        this.m_NoSelection = cfg.noSelection ? `<i class="text-placeholder no-select">${cfg.noSelection || "-"}</i>` : "-"
        this.m_DisplayPrefix = cfg.displayPrefix ? `<span class="dd-prefix text-placeholder no-select" style="font-size: 0.8rem;">${cfg.displayPrefix}</span>` : ""
        this.m_AlignCenter = cfg.alignCenter !== undefined ? cfg.alignCenter : true
        this.m_Title = cfg.title
        this.m_Frame = new DOM_Cache(cfg.frame)
        this.m_Frame.root.classList.add("flex-center")
        this.m_Frame.root.classList.add("dd-menu-frame")
        this.m_Frame.root.classList.add("no-select")
        this.m_LeftPadding = cfg.leftPadding
        this.m_Status = cfg.status
        this.m_Enabled = true
        this.m_CustomID = "cid_" + Utils.GetNewLocalUID()

        Utils.AppendChild(this.m_Frame.root, Utils.AsHTML(`${UI.s_SVG_Map.ArrowDown}`.replaceAll("<svg ", `<svg class="dd-arrow"`)))
        Utils.AppendChild(this.m_Frame.root, Utils.AsHTML(`<div class="dd-text"></div>`))

        this.m_Frame.root.onclick = () => { this.Open(); }

        this.Update()
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    SetTitle(title) {
        this.m_Title = title
        this.Update()
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    SetOptions(opts) {
        this.m_Options = opts
        this.Update()

        if (!opts)
            return
        var d = document.getElementById(this.m_CustomID)
        if (d) {
            for (var i = 0; i < opts.length; i++) {
                d.querySelector("#cm_opt_" + i).innerText = opts[i]
            }
        }
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    SetSelectedItem(sel) {
        if (Number.isInteger(sel)) {
            this.m_SelectedIndex = sel
        } else {
            this.m_SelectedIndex = this.m_Options.indexOf(sel)
        }

        this.Update()
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    GetValue() {
        try {
            if (this.m_SelectedIndex === null || this.m_SelectedIndex === undefined) {
                return "???"
            }
            return this.GetOptionAt(this.m_SelectedIndex)
        } catch {
            return "???"
        }
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    GetOptions() {
        return this.m_Options
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    Open() {
        if (!this.IsEnabled())
            return

        let dropList = []

        if (this.m_Title) {
            dropList.push({
                category: this.m_Title
            })
        }

        for (let idx in this.m_Options) {
            dropList.push({
                text: this.m_Options[+idx],
                action: () => {
                    const lastIdx = this.m_SelectedIndex
                    this.m_SelectedIndex = +idx
                    this.Update()
                    if (+idx !== lastIdx) {
                        this.m_SelectionCallback({
                            index: +idx,
                            lastIndex: lastIdx,
                            value: this.m_Options[+idx]
                        })
                    }
                }
            })
        }

        let rect = this.m_Frame.root.getBoundingClientRect()
        WM.OpenContextMenu(
            {
                pageX: rect.left,
                pageY: this.m_Title ? rect.top : rect.bottom
            },
            dropList,
            {
                minWidth: rect.right - rect.left,
                customID: this.m_CustomID
            },
        )
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    GetStatus() {
        return this.m_Status
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    SetStatus(stat) {
        this.m_Status = stat
        this.Update()
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    SetEnabled(enabled) {
        if (this.m_Enabled === enabled)
            return
        this.m_Enabled = enabled
        this.Update()
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    IsEnabled() {
        return this.m_Enabled;
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    GetOptionAt(idx) {
        if (this.m_Options) {
            return this.m_Options[idx]
        } else {
            return null
        }
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    Update() {
        const optText = this.GetOptionAt(this.m_SelectedIndex)

        if (this.m_AlignCenter) {
            this.m_Frame.Find(".dd-text").style.position = "relative"
            this.m_Frame.Find(".dd-text").style.width = "100%"
            this.m_Frame.Find(".dd-text").style.height = "100%"

            // WEB_COMPILER_INLINE_HTML_BEGIN
            if (this.m_LeftPadding) {
                this.m_Frame.Find(".dd-text").innerHTML = `
                    ${this.m_DisplayPrefix}
                    <div class="dd-selection" style="padding-left: ${this.m_LeftPadding}; !important">${optText || this.m_NoSelection}</div>
                `
            } else {
                this.m_Frame.Find(".dd-text").innerHTML = `
                    ${this.m_DisplayPrefix}
                    <div class="dd-selection">${optText || this.m_NoSelection}</div>
                `
            }
            // WEB_COMPILER_INLINE_HTML_END
        } else {
            this.m_Frame.Find(".dd-text").style.position = "absolute"
            this.m_Frame.Find(".dd-text").innerHTML = this.m_DisplayPrefix + (optText || this.m_NoSelection)
        }

        const titlePrefix = optText ? ("[ " + optText + " ]\n") : ""

        if (this.GetStatus()) {
            this.m_Frame.root.classList.add(DropdownMenu.ValidResultToClass(this.GetStatus().type))
            if (this.GetStatus().message) {
                this.m_Frame.root.setAttribute("title", titlePrefix + ((this.m_Title ? this.m_Title : "") + (this.GetStatus().message ? ("\n\n" + this.GetStatus().message) : "")))
            }

            UI.SetTopRightSVG(this.m_Frame, this.GetStatus().type)
        } else {
            this.m_Frame.root.classList.remove("field-info")
            this.m_Frame.root.classList.remove("field-warning")
            this.m_Frame.root.classList.remove("field-error")
            this.m_Frame.root.setAttribute("title", titlePrefix + (this.m_Title ? this.m_Title : ""))
            this.m_Frame.Delete(".top-right-status-svg", true)
        }

        if (this.IsEnabled()) {
            this.m_Frame.root.classList.remove("field-disabled")
        } else {
            this.m_Frame.root.classList.add("field-disabled")
        }
    }

}