class MIDIInterfacesWindow {
    // WEB_COMPILER_MEMBER_FUNCTION
    UpdateInterfaces(ifs) {
        var table = document.getElementById('midifTable')

        if (ifs) {
            if (ifs.length) {
                document.getElementById('midif-empty').classList.add('no-display');
            } else {
                document.getElementById('midif-empty').classList.remove('no-display');
            }

            for (var midif of ifs) {
                const id = "midif" + midif.index + midif.type
                let entry = table.querySelector("#" + id);

                if (!entry) {
                    // WEB_COMPILER_INLINE_HTML_BEGIN
                    var entryHtml =
                        `
                        <tr id="${id}" class="midif-entry">
                            <td class="midif-statecell"><div class="midif-cell"><span class="midif-linkstate"></span><span class="midif-name idle-text">${midif.name}</span></div></td>
                            <td class="midif-ip-td"><div class="midif-cell flex-center"><div id="lpin" class="midif-checkbox flex-center"></div></div></td>
                            <td class="midif-ip-td"><div class="midif-cell flex-center"><div id="lpout" class="midif-checkbox flex-center"></div></div></td>
                            <td class="midif-ip-td"><div class="midif-cell flex-center"><div id="mainout" class="midif-checkbox flex-center"></div></div></td>
                        </tr>
                    `;
                    // WEB_COMPILER_INLINE_HTML_END
                    Utils.AppendChild(table, Utils.AsHTML(entryHtml));
                    entry = table.querySelector("#" + id);
                    entry.dataset.index = midif.index
                    entry.dataset.type = midif.type
                }

                var nameElem = entry.querySelector(".midif-name");
                var linkState = entry.querySelector(".midif-linkstate")
                if (midif.type == "in") {
                    linkState.classList.add('midif-in');
                    linkState.innerText = "INPUT"
                } else {
                    linkState.classList.add('midif-out');
                    linkState.innerText = "OUTPUT"
                }

                entry.querySelector("#lpin").onclick = ()=>{ bind_MIDI.SelectEvent(entry.dataset.type, entry.dataset.index, "lpin") }
                entry.querySelector("#lpout").onclick = ()=>{ bind_MIDI.SelectEvent(entry.dataset.type, entry.dataset.index, "lpout") }
                entry.querySelector("#mainout").onclick = ()=>{ bind_MIDI.SelectEvent(entry.dataset.type, entry.dataset.index, "mainout") }

                if(midif.is_lpin) {
                    entry.querySelector("#lpin").classList.add("midif-checkbox-checked")
                } else {
                    entry.querySelector("#lpin").classList.remove("midif-checkbox-checked")
                }
                
                if(midif.is_lpout) {
                    entry.querySelector("#lpout").classList.add("midif-checkbox-checked")
                } else {
                    entry.querySelector("#lpout").classList.remove("midif-checkbox-checked")
                }
                
                if(midif.is_mainout) {
                    entry.querySelector("#mainout").classList.add("midif-checkbox-checked")
                } else {
                    entry.querySelector("#mainout").classList.remove("midif-checkbox-checked")
                }

                if(midif.lastError && midif.lastError.length > 0) {
                    alert(`[${midif.name}] Operation failed:\n\n${midif.lastError}`)
                }
            }

            var toRemove = []
            var elems = document.getElementsByClassName('midif-entry')
            for (var el of elems) {
                var name = el.querySelector(".midif-name")
                if (!name) {
                    toRemove.push(el)
                } else {
                    var found = false;
                    for (var midif of ifs) {
                        const id = "midif" + midif.index + midif.type
                        if (el.id === id) {
                            found = true
                            break
                        }
                    }
                    if (!found) {
                        toRemove.push(el)
                    }
                }
            }
            for (var r of toRemove) {
                r.parentNode.removeChild(r)
            }
        } else {
            var elems = document.getElementsByClassName('midif-entry');
            while (elems.length > 0) {
                elems[0].parentNode.removeChild(elems[0]);
            }
        }
    }

    constructor() {
        this._id = 'window_MIDIInterfaces'

        if (WM.IsOverlayOpen(this._id))
            return

        // WEB_COMPILER_INLINE_HTML_BEGIN
        var win = `
        <div id="${this._id}" class="fs-overlay-window">
        <div id="midif-frame">
            <div class="popup-window-bar flex-center no-select">MIDI Interfaces</div>
            <div class="popup-window-content flex-center scroll-y">
                <div class="midif-content">
                    <table id="midifTable" class="na-table no-select">
                        <tr class="na-table-header">
                            <th width="25%">INTERFACE</th>
                            <th width="25%">LAUNCHPAD INPUT</th>
                            <th width="25%">LAUNCHPAD OUTPUT</th>
                            <th width="25%">MAIN OUTPUT</th>
                        </tr>
                    </table>
                    <span id="midif-empty" class="no-display flex-center no-select">NO INTERFACES FOUND</span>
                </div>
            </div>
            <div id="midifClose" class="window-close flex-center">
            </div>
        </div>
        </div>
        `
        // WEB_COMPILER_INLINE_HTML_END

        WM.CloseOverlay()
        WM.OpenOverlay(this._id, win, null)

        document.getElementById('midifClose').addEventListener('click', function () {
            WM.CloseOverlay()
        })

        this.UpdateInterfaces(g_MIDI_Interfaces)
        bind_MIDI.slot_Window = ()=>{
            this.UpdateInterfaces(g_MIDI_Interfaces)
        }
    }
}