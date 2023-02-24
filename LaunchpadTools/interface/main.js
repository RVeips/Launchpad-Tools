var g_MIDI_Interfaces = []

WM.Initialize()
Toolbar.Initialize()
Initialize_Footer()

document.getElementById("initial_load").remove()

var zoom = 100
var root_size = 12
document.addEventListener('keydown', (e) => {
    if (e.key == '+') {
        if (e.ctrlKey)
            root_size++
        else
            zoom += 2
    } else if (e.key == '-') {
        if (e.ctrlKey)
            root_size--
        else
            zoom -= 2
    }
    document.body.style.zoom = zoom + "%"
    document.querySelector(":root").style.fontSize = root_size + "pt"
})

var s_FirstMIDI = false
new QWebChannel(qt.webChannelTransport, (ch) => {
    bind_MIDI = ch.objects.midi

    bind_MIDI.slot_Window = null
    bind_MIDI.slot_NoteOn = null
    bind_MIDI.slot_NoteOff = null
    bind_MIDI.slots_Config = []

    bind_MIDI.deviceListUpdated.connect((list) => {
        g_MIDI_Interfaces = list
        if (!s_FirstMIDI) {
            s_FirstMIDI = true
            // new MIDIInterfacesWindow
        } else {
            if (bind_MIDI.slot_Window)
                bind_MIDI.slot_Window()
        }
    })

    bind_MIDI.configUpdated.connect((cfg) => {
        bind_MIDI.config = cfg
        for (var cb of bind_MIDI.slots_Config) {
            cb(bind_MIDI.config)
        }
    })

    bind_MIDI.noteOn.connect((p, pow) => {
        if (bind_MIDI.slot_NoteOn)
            bind_MIDI.slot_NoteOn(p, pow)
    })

    bind_MIDI.noteOff.connect((p, pow) => {
        if (bind_MIDI.slot_NoteOff)
            bind_MIDI.slot_NoteOff(p, pow)
    })

    LaunchPadX.Initialize()
})
