class OptionLine {

    static enum_Type = {
        SINGLE: 0,   // Single selection
        MULTIPLE: 1, // Multiple selections
    }

    constructor(cfg) {
        this.m_Callback = cfg.callback
        this.m_Options = cfg.options
        this.m_Title = cfg.title
        this.m_Frame = new DOM_Cache(cfg.frame)
        this.m_Frame.root.classList.add("flex-center")
        this.m_Frame.root.classList.add("optline-frame")
        this.m_Frame.root.classList.add("no-select")
        this.m_Type = cfg.type || OptionLine.enum_Type.SINGLE
        this.m_OptionColors = cfg.optionColors

        var opts = ""
        if (!this.m_Selection) {
            this.m_Selection = new Array(this.m_Options.length)
        }
        for (const opt of this.m_Options) {
            if (this.m_OptionColors) {
                opts = opts + `<div class="optline-option" style="padding-top: 0.15rem;">${opt}</div>`
            } else {
                opts = opts + `<div class="optline-option ${this.m_Type === OptionLine.enum_Type.SINGLE ? "optline-option-single" : "optline-option-multi"}">${opt}</div>`
            }
        }

        Utils.AppendChild(this.m_Frame.root, Utils.AsHTML(opts))

        var options = this.m_Frame.FindAll(".optline-option")
        var idx = 0
        for (let opt of options) {
            opt.dataset.index = idx++
            opt.onclick = () => {
                var sel = this.GetSelection()
                const lastSel = sel.slice() // value copy
                if (this.m_Type == OptionLine.enum_Type.SINGLE) {
                    for (var i = 0; i < sel.length; i++) {
                        sel[i] = opt.dataset.index == i
                    }
                } else {
                    sel[opt.dataset.index] = !sel[opt.dataset.index]
                }
                this.SetSelection(sel)
                if (sel !== lastSel) {
                    this.m_Callback({
                        selection: sel,
                        lastSelection: lastSel
                    })
                }
            }
        }

        this.Update()
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    SetTitle(title) {
        this.m_Title = title
        this.Update()
    }


    // WEB_COMPILER_MEMBER_FUNCTION
    SetSelection(sel) {
        this.m_Selection = sel
        this.Update()
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    GetSelection() {
        return this.m_Selection
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    Update() {
        var opts = this.m_Frame.FindAll(".optline-option")
        for (var i = 0; i < this.m_Selection.length; i++) {
            // WEB_COMPILER_INLINE_CSS_BEGIN
            const optCol = this.m_OptionColors ? this.m_OptionColors[i] : "var(--accent_ol)";
            // WEB_COMPILER_INLINE_CSS_END
            if (this.m_Selection[i]) {
                opts[i].style.backgroundColor = optCol.replaceAll("rgb(", "rgba(").replaceAll(")", ",0.25)")
                opts[i].style.borderBottom = "0.15rem solid " + optCol
            } else {
                // WEB_COMPILER_INLINE_CSS_BEGIN
                opts[i].style.backgroundColor = "var(--lighter2_bg)"
                opts[i].style.borderBottom = "0.15rem solid var(--toolbar_hover)"
                // WEB_COMPILER_INLINE_CSS_END
            }
        }

        if (this.m_Title)
            this.m_Frame.root.parentElement.setAttribute("title", this.m_Title)
    }

}