const s_HorizontalBarMap = [91, 92, 93, 94, 95, 96, 97, 98]
const s_VerticalBarMap = [89, 79, 69, 59, 49, 39, 29, 19]
const s_GridMap = [
    81, 82, 83, 84, 85, 86, 87, 88,
    71, 72, 73, 74, 75, 76, 77, 78,
    61, 62, 63, 64, 65, 66, 67, 68,
    51, 52, 53, 54, 55, 56, 57, 58,
    41, 42, 43, 44, 45, 46, 47, 48,
    31, 32, 33, 34, 35, 36, 37, 38,
    21, 22, 23, 24, 25, 26, 27, 28,
    11, 12, 13, 14, 15, 16, 17, 18,
]

const s_Palette = [
    [0, 0, 0], [7, 7, 7], [31, 31, 31], [63, 63, 63], [63, 18, 18], [63, 0, 0], [21, 0, 0], [6, 0, 0], [63, 46, 26], [63, 20, 0], [21, 7, 0], [9, 6, 0], [63, 63, 18], [63, 63, 0], [21, 21, 0], [6, 6, 0], [33, 63, 18], [20, 63, 0], [7, 21, 0], [4, 10, 0], [18, 63, 18], [0, 63, 0], [0, 21, 0], [0, 6, 0], [18, 63, 23], [0, 63, 6], [0, 21, 3], [0, 6, 0], [18, 63, 33], [0, 63, 21], [0, 21, 7], [0, 7, 4], [18, 63, 45], [0, 63, 37], [0, 21, 13], [0, 6, 4], [18, 48, 63], [0, 41, 63], [0, 16, 20], [0, 3, 6], [18, 33, 63], [0, 21, 63], [0, 7, 21], [0, 1, 6], [18, 18, 63], [0, 0, 63], [0, 0, 21], [0, 0, 6], [33, 18, 63], [20, 0, 63], [6, 0, 24], [3, 0, 11], [63, 18, 63], [63, 0, 63], [21, 0, 21], [6, 0, 6], [63, 18, 33], [63, 0, 20], [21, 0, 7], [8, 0, 4], [63, 5, 0], [37, 13, 0], [29, 20, 0], [16, 24, 0], [0, 14, 0], [0, 21, 13], [0, 20, 31], [0, 0, 63], [0, 17, 19], [9, 0, 50], [31, 31, 31], [7, 7, 7], [63, 0, 0], [46, 63, 11], [43, 58, 1], [24, 63, 2], [3, 34, 0], [0, 63, 33], [0, 41, 63], [0, 10, 63], [15, 0, 63], [30, 0, 63], [43, 6, 30], [15, 8, 0], [63, 18, 0], [33, 55, 1], [28, 63, 5], [0, 63, 0], [14, 63, 9], [21, 63, 27], [13, 63, 50], [22, 34, 63], [12, 20, 48], [33, 31, 57], [52, 7, 63], [63, 0, 22], [63, 31, 0], [45, 43, 0], [35, 63, 0], [32, 22, 1], [14, 10, 0], [4, 18, 3], [3, 19, 13], [5, 5, 10], [5, 7, 22], [25, 14, 6], [41, 0, 2], [54, 20, 15], [53, 26, 6], [63, 55, 9], [39, 55, 11], [25, 44, 3], [7, 7, 11], [54, 63, 26], [31, 63, 46], [38, 37, 63], [35, 25, 63], [15, 15, 15], [28, 28, 28], [55, 63, 63], [39, 0, 0], [13, 0, 0], [6, 51, 0], [1, 16, 0], [45, 43, 0], [15, 12, 0], [44, 23, 0], [18, 5, 0]
]

function distance(a, b) {
    return Math.sqrt(Math.pow(a.r - b.r, 2) + Math.pow(a.g - b.g, 2) + Math.pow(a.b - b.b, 2));
}

function nearestColor(r, g, b) {
    var lowest = Number.POSITIVE_INFINITY;
    var tmp;
    let index = 0;
    s_Palette.forEach((el, i) => {
        tmp = distance({ r: r, g: g, b: b }, { r: el[0], g: el[1], b: el[2] })
        if (tmp < lowest) {
            lowest = tmp;
            index = i;
        };

    })
    return index
}

class LaunchPadX {

    static IndexPadMap = {}

    static Initialize() {
        for (let ce of s_Palette) {
            ce[0] *= 4
            ce[1] *= 4
            ce[2] *= 4
        }

        Utils.AppendChild(document.getElementById("window"), Utils.AsHTML(`
            <div id="lpx-container">
                <div id="lpx-brightness-controls">
                    <span id="lpx-brightness-display">Brightness</span>
                    <input type="range" min="0" max="100" value="100" class="lpx-slider" id="lpx-brightness-value">
                </div>

                <div id="lpx-control-h">
                </div>
                <div id="lpx-control-v">
                </div>
                <div id="lpx-surface">
                </div>
            </div>
        `))
        LaunchPadX.container = document.querySelector("#lpx-container")
        LaunchPadX.surface = LaunchPadX.container.querySelector("#lpx-surface")
        LaunchPadX.pads_h = LaunchPadX.container.querySelector("#lpx-control-h")
        LaunchPadX.pads_v = LaunchPadX.container.querySelector("#lpx-control-v")
        LaunchPadX.pads = []
        LaunchPadX.control_h = []
        LaunchPadX.control_v = []
        LaunchPadX.brightness_control = document.getElementById("lpx-brightness-value")
        LaunchPadX.brightness_display = document.getElementById("lpx-brightness-display")

        const main_pad_content = `
            <span id="sticky_toggle" class="lpx-sticky-toggle no-select" title="Toggle Mode">T</span>
            <span id="set_mode_solid" class="lpx-mode-solid no-select" title="LED Mode Solid">S</span>
            <span id="set_mode_pulse" class="lpx-mode-pulse no-select" title="LED Mode Pulse">P</span>
            <span id="set_mode_flash" class="lpx-mode-flash no-select" title="LED Mode Flash">F</span>
            <div class="lpx-ind-on" id="onColor"></div>
            <div class="lpx-ind-off" id="offColor"></div>
            <div class="lpx-ind-active" id="indicator"></div>
        `

        const control_pad_content = main_pad_content

        let stickyToggleCapable = []
        let solidModeCapable = []
        let pulseModeCapable = []
        let flashModeCapable = []
        let InitSubComponents = (comp) => {
            let stickyToggle = comp.querySelector("#sticky_toggle")
            if (stickyToggle) {
                stickyToggle.onclick = (e) => {
                    if (stickyToggle.classList.contains("lpx-sticky-toggle-active")) {
                        stickyToggle.classList.remove("lpx-sticky-toggle-active")
                    } else {
                        stickyToggle.classList.add("lpx-sticky-toggle-active")
                    }
                    bind_MIDI.SetToggleMode(comp.dataset.midi_index, stickyToggle.classList.contains("lpx-sticky-toggle-active"))
                }
                stickyToggleCapable.push(comp)
            }


            let solidModeToggle = comp.querySelector("#set_mode_solid")
            let pulseModeToggle = comp.querySelector("#set_mode_pulse")
            let flashModeToggle = comp.querySelector("#set_mode_flash")
            if (solidModeToggle) {
                solidModeToggle.onclick = (e) => {
                    if (!solidModeToggle.classList.contains("lpx-mode-active")) {
                        solidModeToggle.classList.add("lpx-mode-active")
                        pulseModeToggle.classList.remove("lpx-mode-active")
                        flashModeToggle.classList.remove("lpx-mode-active")
                    }
                    var cc = bind_MIDI.config.color[comp.dataset.midi_index]
                    bind_MIDI.SetColorConfig(comp.dataset.midi_index, cc.on[0], cc.on[1], cc.on[2], cc.off[0], cc.off[1], cc.off[2], "solid", cc.off_solid, [cc.palette_on, cc.palette_off])
                }
                solidModeCapable.push(comp)
            }
            if (pulseModeToggle) {
                pulseModeToggle.onclick = (e) => {
                    if (!pulseModeToggle.classList.contains("lpx-mode-active")) {
                        solidModeToggle.classList.remove("lpx-mode-active")
                        pulseModeToggle.classList.add("lpx-mode-active")
                        flashModeToggle.classList.remove("lpx-mode-active")
                    }
                    var cc = bind_MIDI.config.color[comp.dataset.midi_index]
                    bind_MIDI.SetColorConfig(comp.dataset.midi_index, cc.on[0], cc.on[1], cc.on[2], cc.off[0], cc.off[1], cc.off[2], "pulse", cc.off_solid, [cc.palette_on, cc.palette_off])
                }
                pulseModeCapable.push(comp)
            }
            if (flashModeToggle) {
                flashModeToggle.onclick = (e) => {
                    if (!flashModeToggle.classList.contains("lpx-mode-active")) {
                        solidModeToggle.classList.remove("lpx-mode-active")
                        pulseModeToggle.classList.remove("lpx-mode-active")
                        flashModeToggle.classList.add("lpx-mode-active")
                    }
                    var cc = bind_MIDI.config.color[comp.dataset.midi_index]
                    bind_MIDI.SetColorConfig(comp.dataset.midi_index, cc.on[0], cc.on[1], cc.on[2], cc.off[0], cc.off[1], cc.off[2], "flash", cc.off_solid, [cc.palette_on, cc.palette_off])
                }
                flashModeCapable.push(comp)
            }
        }

        for (var i = 0; i < 64; i++) {
            Utils.AppendChild(LaunchPadX.surface, Utils.AsHTML(`
                <div id="lpx-pad-${i}" class="lpx-pad">
                    ${main_pad_content}
                </div>
            `))
            let pad = LaunchPadX.surface.querySelector(`#lpx-pad-${i}`)
            pad.dataset.midi_index = s_GridMap[i];
            LaunchPadX.IndexPadMap[s_GridMap[i]] = pad;
            LaunchPadX.pads.push(pad)
            InitSubComponents(pad)
        }

        Utils.AppendChild(LaunchPadX.surface, Utils.AsHTML(`<div id="lpx-centermark"></div>`))

        for (var i = 0; i < 8; i++) {
            Utils.AppendChild(LaunchPadX.pads_h, Utils.AsHTML(`
                <div id="lpx-ch-${i}" class="lpx-pad">
                    ${control_pad_content}
                </div>
            `))
            let hc = LaunchPadX.pads_h.querySelector(`#lpx-ch-${i}`)
            hc.dataset.midi_index = s_HorizontalBarMap[i];
            LaunchPadX.IndexPadMap[s_HorizontalBarMap[i]] = hc;
            LaunchPadX.control_h.push(hc)
            InitSubComponents(hc)

            Utils.AppendChild(LaunchPadX.pads_v, Utils.AsHTML(`
                <div id="lpx-cv-${i}" class="lpx-pad">
                    ${control_pad_content}
                </div>
            `))
            let vc = LaunchPadX.pads_v.querySelector(`#lpx-cv-${i}`)
            vc.dataset.midi_index = s_VerticalBarMap[i];
            LaunchPadX.IndexPadMap[s_VerticalBarMap[i]] = vc;
            LaunchPadX.control_h.push(vc)

            InitSubComponents(vc)
        }

        let UpdateBrightness = (e) => {
            const val = e.target.value
            LaunchPadX.brightness_display.innerText = "Brightness | " + val + "%"
            bind_MIDI.SetBrightness(val / 100)
        }
        LaunchPadX.brightness_control.oninput = UpdateBrightness
        LaunchPadX.brightness_control.onchange = UpdateBrightness

        let s_FirstRead = true
        bind_MIDI.slots_Config.push((cfg) => {
            LaunchPadX.brightness_control.value = cfg.brightness * 100
            UpdateBrightness({ target: { value: LaunchPadX.brightness_control.value } })

            for (var o of stickyToggleCapable) {
                if (cfg.toggle_mode[o.dataset.midi_index]) {
                    o.querySelector("#sticky_toggle").classList.add("lpx-sticky-toggle-active")
                }
            }

            for (var o of solidModeCapable) {
                if (cfg.color[o.dataset.midi_index].mode == "solid") {
                    o.querySelector("#set_mode_solid").classList.add("lpx-mode-active")
                    o.querySelector("#set_mode_pulse").classList.remove("lpx-mode-active")
                    o.querySelector("#set_mode_flash").classList.remove("lpx-mode-active")
                }
            }

            for (var o of pulseModeCapable) {
                if (cfg.color[o.dataset.midi_index].mode == "pulse") {
                    o.querySelector("#set_mode_solid").classList.remove("lpx-mode-active")
                    o.querySelector("#set_mode_pulse").classList.add("lpx-mode-active")
                    o.querySelector("#set_mode_flash").classList.remove("lpx-mode-active")
                }
            }

            for (var o of flashModeCapable) {
                if (cfg.color[o.dataset.midi_index].mode == "flash") {
                    o.querySelector("#set_mode_solid").classList.remove("lpx-mode-active")
                    o.querySelector("#set_mode_pulse").classList.remove("lpx-mode-active")
                    o.querySelector("#set_mode_flash").classList.add("lpx-mode-active")
                }
            }

            // mirror back
            for (var key in cfg.toggle_mode) {
                bind_MIDI.SetToggleMode(key, cfg.toggle_mode[key])
            }

            // mirror back
            for (var key in cfg.color) {
                var cc = cfg.color[key]
                bind_MIDI.SetColorConfig(key, cc.on[0], cc.on[1], cc.on[2], cc.off[0], cc.off[1], cc.off[2], cc.mode, cc.off_solid, [cc.palette_on, cc.palette_off])
            }

            for (let ek in LaunchPadX.IndexPadMap) {
                let e = LaunchPadX.IndexPadMap[ek]
                e.querySelector("#offColor").style.backgroundColor = `rgb(${bind_MIDI.config.color[ek].off[0] * 255},${bind_MIDI.config.color[ek].off[1] * 255},${bind_MIDI.config.color[ek].off[2] * 255})`;
                e.querySelector("#onColor").style.backgroundColor = `rgb(${bind_MIDI.config.color[ek].on[0] * 255},${bind_MIDI.config.color[ek].on[1] * 255},${bind_MIDI.config.color[ek].on[2] * 255})`;
                if (e.dataset.is_on == "true") {
                    e.querySelector("#indicator").style.backgroundColor = `rgb(${bind_MIDI.config.color[ek].on[0] * 255},${bind_MIDI.config.color[ek].on[1] * 255},${bind_MIDI.config.color[ek].on[2] * 255})`;
                } else {
                    e.querySelector("#indicator").style.backgroundColor = `rgb(${bind_MIDI.config.color[ek].off[0] * 255},${bind_MIDI.config.color[ek].off[1] * 255},${bind_MIDI.config.color[ek].off[2] * 255})`;
                }
            }
        })

        for (let ek in LaunchPadX.IndexPadMap) {
            let e = LaunchPadX.IndexPadMap[ek]

            e.onclick = (e) => {
                var cc = bind_MIDI.config.color[ek]
                var cols = g_SelectedColor.replaceAll("rgb(", "").replaceAll(")", "").split(",");
                var paletteIndex = nearestColor(+cols[0], +cols[1], +cols[2])

                if (e.shiftKey && (e.ctrlKey || e.altKey)) {
                    Coloris.close()
                    if (e.altKey) {
                        g_SelectedColor = `rgb(${cc.on[0] * 255},${cc.on[1] * 255},${cc.on[2] * 255})`
                    } else if (e.ctrlKey) {
                        g_SelectedColor = `rgb(${cc.off[0] * 255},${cc.off[1] * 255},${cc.off[2] * 255})`
                    }

                    Coloris({
                        parent: '#colorPicker',
                        themeMode: 'dark',
                        format: 'rgb',
                        alpha: false,
                        inline: true,
                        defaultColor: g_SelectedColor,
                    })
                } else {
                    if (e.altKey) {
                        bind_MIDI.SetColorConfig(ek, (+cols[0]) / 255, (+cols[1]) / 255, (+cols[2]) / 255, cc.off[0], cc.off[1], cc.off[2], cc.mode, cc.off_solid, [paletteIndex, cc.palette_off])
                        bind_MIDI.ColorUpdate()
                    } else if (e.ctrlKey) {
                        bind_MIDI.SetColorConfig(ek, cc.on[0], cc.on[1], cc.on[2], (+cols[0]) / 255, (+cols[1]) / 255, (+cols[2]) / 255, cc.mode, cc.off_solid, [cc.palette_on, paletteIndex])
                        bind_MIDI.ColorUpdate()
                    }
                }
            }
        }

        bind_MIDI.slot_NoteOn = (idx, power) => {
            var pad = LaunchPadX.IndexPadMap[idx]
            if (pad) {
                pad.dataset.is_on = true
                pad.querySelector("#indicator").style.backgroundColor = `rgb(${bind_MIDI.config.color[idx].on[0] * 255},${bind_MIDI.config.color[idx].on[1] * 255},${bind_MIDI.config.color[idx].on[2] * 255})`;
            }
        }
        bind_MIDI.slot_NoteOff = (idx, power) => {
            var pad = LaunchPadX.IndexPadMap[idx]
            if (pad) {
                pad.dataset.is_on = false
                pad.querySelector("#indicator").style.backgroundColor = `rgb(${bind_MIDI.config.color[idx].off[0] * 255},${bind_MIDI.config.color[idx].off[1] * 255},${bind_MIDI.config.color[idx].off[2] * 255})`;
            }
        }
    }

}