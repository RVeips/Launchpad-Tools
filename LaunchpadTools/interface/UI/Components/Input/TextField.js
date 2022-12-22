
class TextField {

    static enum_Type = {
        TEXT: 0,
        UNIVERSE: 1,
        IP: 2,
        INTEGER: 3,
        UNSIGNED: 4,
        FLOAT: 5,
    }

    static ValidResultToClass(vr) {
        switch (vr) {
            case UI.enum_StatusType.ERROR: return "field-error"
            case UI.enum_StatusType.WARNING: return "field-warning"
            case UI.enum_StatusType.INFO: return "field-info"
            default: console.error("TextField::ValidResultToClass unknown value: " + vr); return "field-error"
        }
    }

    static CreateNumberRangeValidator(low, high, res, msg) {
        return (text) => {
            if (!text || text.length === 0) {
                return {
                    isValid: false,
                    type: res,
                    message: msg
                }
            }
            return {
                isValid: (+text) >= low && (+text) <= high,
                type: res,
                message: msg
            }
        }
    }

    static CreateEmptyStringValidator(res, msg) {
        return (text) => {
            if (!text || text.length === 0) {
                return {
                    isValid: false,
                    type: res,
                    message: msg
                }
            }

            return { isValid: true }

        }
    }

    static CreateNonEmptyStringValidator(res, msg) {
        return (text) => {
            if (text && text.length > 0) {
                return {
                    isValid: false,
                    type: res,
                    message: msg
                }
            }

            return { isValid: true }

        }
    }

    static CreateIPAddressValidator(res, msg) {
        return (text) => {
            if (!text || text.length === 0) {
                return {
                    isValid: false,
                    type: res,
                    message: msg
                }
            }

            var ipValid = true
            if (!Utils.IsValidIP(text)) {
                ipValid = false
            } else {
                const ipArr = Utils.IPAddressToArray(text)
                if (!ipArr) {
                    ipValid = false
                } else if ((ipArr[0] == 0xFF || ipArr[0] == 0) || ipArr[3] == 0xFF || ipArr[3] == 0 || ipArr[1] == 0xFF || ipArr[2] == 0xFF) {
                    ipValid = false
                }
            }

            return {
                isValid: ipValid,
                type: res,
                message: msg
            }
        }
    }

    static CreateNetmaskValidator(res, msg) {
        return (text) => {
            if (!text || text.length === 0) {
                return {
                    isValid: false,
                    type: res,
                    message: msg
                }
            }

            var ipValid = true
            if (!Utils.IsValidIP(text)) {
                ipValid = false
            } else {
                const ipArr = Utils.IPAddressToArray(text)
                if (!ipArr) {
                    ipValid = false
                } else {
                    const ipInt = Utils.IPArrayToInt(ipArr)
                    if (ipInt === 0) {
                        ipValid = false
                    } else if (!Utils.NetmaskValid(ipInt)) {
                        ipValid = false
                    }
                }
            }

            return {
                isValid: ipValid,
                type: res,
                message: msg
            }
        }
    }

    static CreateUniverseValidator(low, high, res, msg) {
        if (msg === undefined) {
            msg = "Value Range:\n[0 - 32767]\n[0 - 127.15.15]\n[0 - 7F.F.F]\n[0 - AVLG]"
        }
        return (text) => {
            if (!text || text.length === 0) {
                return { isValid: false, type: res, message: msg }
            }
            const uni = Utils.UniverseFromString(text)
            return {
                isValid: uni >= low && uni <= high,
                type: res,
                message: msg
            }
        }
    }

    constructor(cfg) {
        this.m_Callback = cfg.callback
        this.m_Validator = cfg.validator
        this.m_DisplayPrefix = cfg.displayPrefix ? `<span class="textfield-prefix text-placeholder no-select" style="font-size: 0.8rem;">${cfg.displayPrefix}</span>` : null
        this.m_Title = cfg.title
        this.m_Text = cfg.value
        this.m_Type = cfg.type || TextField.enum_Type.TEXT
        this.m_Frame = new DOM_Cache(cfg.frame)
        this.m_Frame.root.classList.add("flex-center")
        this.m_Frame.root.classList.add("textfield-frame")
        this.m_Padding = cfg.padding
        this.m_Editing = false
        this.m_ValidatorEnabled = true
        this.m_Enabled = cfg.enabled !== undefined ? cfg.enabled : true
        this.m_DisplayOnly = cfg.displayOnly
        if (this.m_DisplayOnly)
            this.m_Enabled = false

        if (this.m_Title) {
            this.m_Frame.root.setAttribute("title", this.m_Title)
        }

        Utils.AppendChild(this.m_Frame.root, Utils.AsHTML(`${this.m_DisplayPrefix || ""}${cfg.displayUnit ? `<span class="textfield-unit text-placeholder no-select" style="font-size: 0.7rem;">${cfg.displayUnit}</span>` : ""}<input class="textfield-input" type="text">`))

        if (cfg.showIcon) {
            // WEB_COMPILER_INLINE_CSS_BEGIN
            Utils.AppendChild(this.m_Frame.root, Utils.AsHTML(`<div class="textfield-icon">${UI.GetColoredSVG("Pencil", "var(--text_weak_placeholder)")}</div>`))
            // WEB_COMPILER_INLINE_CSS_END
            this.m_Frame.Find("textfield-text").classList.add("textfield-text-rs")
        }

        this.m_Input = this.m_Frame.Find(".textfield-input")

        if (cfg.maxLength) {
            this.SetMaxLength(cfg.maxLength)
        }

        this.m_Input.addEventListener("focus", () => {
            this.m_EditStartValue = this.m_Input.value
            this.m_Editing = true
            this.Update()
        })
        this.m_Input.addEventListener("blur", (e) => {
            this.m_Editing = false;
            this.SetValue(this.m_EditStartValue)
            Utils.SetCaretPosition(this.m_Input, 0)
            document.activeElement.blur()
            this.Update()
        })
        this.m_Input.addEventListener("change", () => {
            this.ProcessInput()
        })
        this.m_Input.addEventListener("input", () => {
            this.ProcessInput()
        })
        this.m_Input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                if (this.IsInputValid()) {
                    const originalStart = this.m_EditStartValue
                    this.m_Editing = false;
                    Utils.SetCaretPosition(this.m_Input, 0)
                    this.Update()
                    this.m_EditStartValue = this.m_Input.value
                    document.activeElement.blur()
                    if (this.m_Input.value !== originalStart) {
                        this.m_Callback({
                            value: this.GetValue(),
                            lastValue: originalStart
                        })
                    }
                } else {
                    this.m_Editing = false;
                    this.SetValue(this.m_EditStartValue)
                    Utils.SetCaretPosition(this.m_Input, 0)
                    document.activeElement.blur()
                    this.Update()
                }
            } else if (e.key === "Escape") {
                this.m_Editing = false;
                this.SetValue(this.m_EditStartValue)
                Utils.SetCaretPosition(this.m_Input, 0)
                document.activeElement.blur()
                this.Update()
            }
        })

        this.Update()
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    SetPlaceholder(p) {
        this.m_Placeholder = p
        this.m_Input.placeholder = p
        this.Update()
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    SetTitle(title) {
        this.m_Title = title
        this.Update()
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    SetValidatorEnabled(enabled) {
        this.m_ValidatorEnabled = enabled
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    IsEditing() {
        return this.m_Editing
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    SetValue(val) {
        if (!this.IsEditing()) {
            this.m_Input.value = val
            this.ProcessInput()
        } else {
            this.m_EditStartValue = val
        }
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    GetValue() {
        return this.m_Text
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    SetMaxLength(len) {
        this.m_MaxLength = len
        this.m_Input.maxLength = len
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    GetValidState() {
        if (!this.m_ValidatorEnabled)
            return { isValid: true };

        const typeValid = (() => {
            switch (this.m_Type) {
                case TextField.enum_Type.IP: break;
                case TextField.enum_Type.UNIVERSE: break;
                case TextField.enum_Type.INTEGER: break;
                case TextField.enum_Type.UNSIGNED: break;
                case TextField.enum_Type.FLOAT: break;
            }
            return { isValid: true };
        })()

        return this.m_Validator ? this.m_Validator(this.m_Text) : typeValid
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    IsInputValid() {
        const vs = this.GetValidState()
        if (vs.isValid) {
            return true
        } else {
            return vs.type !== UI.enum_StatusType.ERROR
        }
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    SetEnabled(enabled) {
        if (this.m_DisplayOnly)
            return
        if (this.m_Enabled === enabled)
            return
        this.m_Enabled = enabled
        this.Update()
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    IsEnabled() {
        return this.m_Enabled
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    Update() {
        const validState = this.GetValidState()

        if (this.m_Input === document.activeElement) {
            this.m_Input.style.paddingLeft = "0"
            this.m_Input.style.paddingRight = "0"
            // WEB_COMPILER_INLINE_CSS_BEGIN
            if (this.m_DisplayPrefix)
                this.m_Frame.Find(".textfield-prefix").style.color = "var(--text_weak_placeholder)"
            // WEB_COMPILER_INLINE_CSS_END
        } else {
            // WEB_COMPILER_INLINE_CSS_BEGIN
            if (this.m_DisplayPrefix)
                this.m_Frame.Find(".textfield-prefix").style.color = "var(--text_placeholder)"
            // WEB_COMPILER_INLINE_CSS_END
            if (this.m_Padding) {
                this.m_Input.style.paddingLeft = this.m_Padding
                this.m_Input.style.paddingRight = this.m_Padding
                this.m_Input.style.boxSizing = "border-box"
            }
        }

        const title = Utils.IsOverflowingX(this.m_Input) ? (this.m_Title ? `"${this.GetValue()}"\n${this.m_Title}` : `"${this.GetValue()}"`) : (this.m_Title ? this.m_Title : "")

        const forceNoMessage = !this.IsEditing() && this.m_Placeholder
        if (this.m_DisplayOnly || (forceNoMessage || validState.isValid) && this.IsEnabled()) {
            this.m_Frame.root.classList.remove("field-info")
            this.m_Frame.root.classList.remove("field-warning")
            this.m_Frame.root.classList.remove("field-error")
            if (title.length !== 0)
                this.m_Frame.root.setAttribute("title", title)
            else
                this.m_Frame.root.setAttribute("title", title)
            this.m_Frame.Delete(".top-right-status-svg", true)
            this.m_Frame.root.classList.remove("field-disabled")
            this.m_Input.removeAttribute("disabled")
            this.m_Input.classList.remove("textfield-input-disabled")

            if (this.m_DisplayOnly) {
                this.m_Frame.root.classList.add("field-displayonly")
                this.m_Input.setAttribute("disabled", true)
            }
        } else {
            if (this.IsEnabled()) {
                this.m_Frame.root.classList.add(TextField.ValidResultToClass(validState.type))
                if (validState.message) {
                    this.m_Frame.root.setAttribute("title", title + (validState.message ? ("\n\n" + validState.message) : ""))
                }

                UI.SetTopRightSVG(this.m_Frame, validState.type)
                this.m_Frame.root.classList.remove("field-disabled")
                this.m_Input.removeAttribute("disabled")
                this.m_Input.classList.remove("textfield-input-disabled")
            } else {
                this.m_Frame.Delete(".top-right-status-svg", true)
                this.m_Frame.root.classList.add("field-disabled")
                this.m_Input.setAttribute("disabled", true)
                this.m_Input.classList.add("textfield-input-disabled")
            }
        }
    }

    // WEB_COMPILER_MEMBER_FUNCTION
    ProcessInput() {
        var newVal = Utils.ToSafeString(this.m_Input.value)

        switch (this.m_Type) {
            case TextField.enum_Type.UNSIGNED: newVal = newVal.replaceAll(/[^\dxXabcdefABCDEF]+/g, ""); break;
            case TextField.enum_Type.UNIVERSE: newVal = newVal.replaceAll(/[_]+/g, ""); break;
            case TextField.enum_Type.IP: newVal = newVal.replaceAll(/[^\d.]+/g, ""); break;
            case TextField.enum_Type.INTEGER: newVal = newVal.replaceAll(/[^\dxXabcdefABCDEF-]+/g, ""); break;
            case TextField.enum_Type.FLOAT: newVal = newVal.replaceAll(/[^\d-.]+/g, ""); break;
        }

        this.m_Input.value = newVal
        this.m_Text = newVal

        this.Update()
    }
}