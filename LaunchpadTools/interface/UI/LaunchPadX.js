const s_HorizontalBarMap = [91, 92, 93, 94, 95, 96, 97, 98]
const s_VerticalBarMap   = [89, 79, 69, 59, 49, 39, 29, 19]
const s_GridMap      = [
    81, 82, 83, 84, 85, 86, 87, 88,
    71, 72, 73, 74, 75, 76, 77, 78,
    61, 62, 63, 64, 65, 66, 67, 68,
    51, 52, 53, 54, 55, 56, 57, 58,
    41, 42, 43, 44, 45, 46, 47, 48,
    31, 32, 33, 34, 35, 36, 37, 38,
    21, 22, 23, 24, 25, 26, 27, 28,
    11, 12, 13, 14, 15, 16, 17, 18,
]

class LaunchPadX {

    static IndexPadMap = {}

    static Initialize() {
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
        `

        const control_pad_content = `
            <span id="sticky_toggle" class="lpx-sticky-toggle no-select" title="Toggle Mode">T</span>
        `

        let stickyToggleCapable = []
        let InitSubComponents = (comp) => {
            let stickyToggle= comp.querySelector("#sticky_toggle")
            if(stickyToggle) {
                stickyToggle.onclick = (e)=>{
                    if(stickyToggle.classList.contains("lpx-sticky-toggle-active")) {
                        stickyToggle.classList.remove("lpx-sticky-toggle-active")
                    } else {
                        stickyToggle.classList.add("lpx-sticky-toggle-active")
                    }
                    bind_MIDI.SetToggleMode(comp.dataset.midi_index, stickyToggle.classList.contains("lpx-sticky-toggle-active"))
                }
                stickyToggleCapable.push(comp)
            }
        }

        for(var i = 0; i < 64; i++) {
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

        for(var i = 0; i < 8; i++) {
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

        let UpdateBrightness = (e)=>{
            const val = e.target.value
            LaunchPadX.brightness_display.innerText = "Brightness | " + val + "%"
            bind_MIDI.SetBrightness(val/100)
        }
        LaunchPadX.brightness_control.oninput = UpdateBrightness
        LaunchPadX.brightness_control.onchange = UpdateBrightness

        bind_MIDI.slots_Config.push((cfg)=>{
            LaunchPadX.brightness_control.value = cfg.brightness*100
            UpdateBrightness({target: {value: LaunchPadX.brightness_control.value}})

            for(var o of stickyToggleCapable) {
                if(cfg.toggle_mode[o.dataset.midi_index]) {
                    o.querySelector("#sticky_toggle").classList.add("lpx-sticky-toggle-active")
                }
            }

            // mirror back
            for(var key in cfg.toggle_mode) {
                bind_MIDI.SetToggleMode(key, cfg.toggle_mode[key])
            }

            // mirror back
            for(var key in cfg.color) {
                var cc = cfg.color[key]
                bind_MIDI.SetColorConfig(key, cc.on[0],cc.on[1],cc.on[2], cc.off[0],cc.off[1],cc.off[2], cc.mode, cc.off_solid)
            }

            for(let ek in LaunchPadX.IndexPadMap) {
                let e = LaunchPadX.IndexPadMap[ek]
                e.style.backgroundColor = `rgb(${bind_MIDI.config.color[ek].off[0]*255},${bind_MIDI.config.color[ek].off[1]*255},${bind_MIDI.config.color[ek].off[2]*255})`;
            }
        })

        for(let ek in LaunchPadX.IndexPadMap) {
            let e = LaunchPadX.IndexPadMap[ek]
        
            e.onclick = (e)=>{
                var cc = bind_MIDI.config.color[ek]
                var cols = g_SelectedColor.replaceAll("rgb(", "").replaceAll(")", "").split(",");

                if(e.shiftKey && (e.ctrlKey || e.altKey)) {
                    Coloris.close()
                    if(e.altKey) {
                        g_SelectedColor= `rgb(${cc.on[0]*255},${cc.on[1]*255},${cc.on[2]*255})`
                    } else if(e.ctrlKey) {
                        g_SelectedColor= `rgb(${cc.off[0]*255},${cc.off[1]*255},${cc.off[2]*255})`
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
                    if(e.altKey) {
                        bind_MIDI.SetColorConfig(ek, (+cols[0])/255, (+cols[1])/255, (+cols[2])/255 , cc.off[0],cc.off[1],cc.off[2], cc.mode, cc.off_solid)
                        bind_MIDI.ColorUpdate()
                    } else if(e.ctrlKey) {
                        bind_MIDI.SetColorConfig(ek, cc.on[0],cc.on[1],cc.on[2], (+cols[0])/255, (+cols[1])/255, (+cols[2])/255 , cc.mode, cc.off_solid)
                        bind_MIDI.ColorUpdate()
                    }
                }
            }
        }

        bind_MIDI.slot_NoteOn = (idx, power) =>{
            var pad = LaunchPadX.IndexPadMap[idx]
            if(pad) {
                pad.style.backgroundColor = `rgb(${bind_MIDI.config.color[idx].on[0]*255},${bind_MIDI.config.color[idx].on[1]*255},${bind_MIDI.config.color[idx].on[2]*255})`;
            } 
        }
        bind_MIDI.slot_NoteOff = (idx, power)=> {
            var pad = LaunchPadX.IndexPadMap[idx]
            if(pad) {
                pad.style.backgroundColor = `rgb(${bind_MIDI.config.color[idx].off[0]*255},${bind_MIDI.config.color[idx].off[1]*255},${bind_MIDI.config.color[idx].off[2]*255})`;
            } 
        }
    }

}