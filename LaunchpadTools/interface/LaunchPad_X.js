var g_MIDI_Interfaces = []

var bind_MIDI

WM.Initialize()
Toolbar.Initialize()
Initialize_Footer()

document.getElementById("initial_load").remove()

var s_FirstMIDI = false
new QWebChannel(qt.webChannelTransport, (ch)=>{
    bind_MIDI = ch.objects.midi
    bind_MIDI.slot_Window = null

    bind_MIDI.deviceListUpdated.connect((list)=>{
        g_MIDI_Interfaces = list
        if(!s_FirstMIDI) {
            s_FirstMIDI = true
            new MIDIInterfacesWindow
        } else {
            if(bind_MIDI.slot_Window)
                bind_MIDI.slot_Window()
        }
    })
})