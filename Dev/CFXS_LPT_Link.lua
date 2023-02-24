local EXEC_INDEX = 1
local MIDI_INDEX = 2
local GRID_BUTTONS = {
    { 101, 71 }, { 102, 72 }, { 103, 73 }, { 104, 74 }, { 105, 75 }, { 106, 76 }, { 107, 77 }, { 108, 78 }, { 109, 79 },
    { 111, 61 }, { 112, 62 }, { 113, 63 }, { 114, 64 }, { 115, 65 }, { 116, 66 }, { 117, 67 }, { 118, 68 }, { 119, 69 },
    { 121, 51 }, { 122, 52 }, { 123, 53 }, { 124, 54 }, { 125, 55 }, { 126, 56 }, { 127, 57 }, { 128, 58 }, { 129, 59 },
    { 131, 41 }, { 132, 42 }, { 133, 43 }, { 134, 44 }, { 135, 45 }, { 136, 46 }, { 137, 47 }, { 138, 48 }, { 139, 49 },
    { 141, 31 }, { 142, 32 }, { 143, 33 }, { 144, 34 }, { 145, 35 }, { 146, 36 }, { 147, 37 }, { 148, 38 }, { 149, 39 },
    { 151, 21 }, { 152, 22 }, { 153, 23 }, { 154, 24 }, { 155, 25 }, { 156, 26 }, { 157, 27 }, { 158, 28 }, { 159, 29 },
    { 161, 11 }, { 162, 12 }, { 163, 13 }, { 164, 14 }, { 165, 15 }, { 166, 16 }, { 167, 17 }, { 168, 18 }, { 169, 19 },
}
local X_BUTTONS = {
    { 201, 91 }, { 202, 92 }, { 203, 93 }, { 204, 94 }, { 205, 95 }, { 206, 96 }, { 207, 97 }, { 208, 98 },
    { 211, 81 }, { 212, 82 }, { 213, 83 }, { 214, 84 }, { 215, 85 }, { 216, 86 }, { 217, 87 }, { 218, 88 },
}

local ALL_BUTTONS = {}
for i, v in pairs(GRID_BUTTONS) do table.insert(ALL_BUTTONS, v) end
for i, v in pairs(X_BUTTONS) do table.insert(ALL_BUTTONS, v) end

function FindChannel(exec)
    for i, v in pairs(ALL_BUTTONS) do
        if exec == v[EXEC_INDEX] then
            return v[MIDI_INDEX]
        end
    end
    return nil
end

local MAX_BUTTON_PAGE = 2 -- 32

local PAGE_CACHE = {}

function Regen()
    print("Generating color map...")

    local pages = {}
    PAGE_CACHE = {}
    for button_page = 1, MAX_BUTTON_PAGE do
        local objects = {}
        for i, v in pairs(ALL_BUTTONS) do
            local exec = GetObject(fmt("Executor %d.%d", button_page, v[EXEC_INDEX]))
            if exec:IsValid() then
                table.insert(objects, exec)
            end
        end
        if #objects > 0 then
            table.insert(pages, { ["page_number"] = button_page,["objects"] = objects })
        end
    end

    for _, page in pairs(pages) do
        local exportCommand = fmt("Export Executor ")
        for _, exec in pairs(page.objects) do
            exportCommand = exportCommand .. fmt("%d.%d", page.page_number, exec:GetIndex() + 1) .. "+"
        end
        exportCommand = exportCommand:gsub("%+$", "")
        exportCommand = exportCommand .. fmt(' "cfxs_lpt_temp.xml" /y /nc')
        Command(exportCommand)

        local content = ReadFile("/importexport/cfxs_lpt_temp.xml")
        if not content then
            error("Read cfxs_lpt_temp returned nil")
        end

        local idx = 1
        local exec_desc = {}
        local seq_exportCommand = fmt("Export Sequence ")
        local macro_exportCommand = fmt("Export Macro ")
        for k in content:gmatch("<Exec.->(.-)</Exec>") do
            local exec = page.objects[idx]
            local name = k:match('<Assignment name="(.-)%s%d+">')
            local button = BUTTON_TYPE_MAP[k:match('<Button>(%d+)<')]
            local type, index = k:match("<No>(%d+)</No>.-<No>.-</No>.-<No>(%d+)</No>")
            type = tonumber(type)
            local execQuery = "Executor " .. fmt("%d.%d", page.page_number, exec:GetIndex() + 1)
            if type == 25 then
                seq_exportCommand = seq_exportCommand .. floor(index) .. " +"
            elseif type == 13 then
                macro_exportCommand = macro_exportCommand .. floor(index) .. " +"
            else
                error("Unknown exec type: " .. tostring(type))
            end

            table.insert(exec_desc, {
                exec_query = execQuery,
                cue_query = execQuery .. " Cue",
                midi_ch = FindChannel(exec:GetIndex() + 1),
                color = { 0, 0, 0 }
            })

            idx = idx + 1
        end
        seq_exportCommand = seq_exportCommand:gsub("%+$", "")
        macro_exportCommand = macro_exportCommand:gsub("%+$", "")
        seq_exportCommand = seq_exportCommand .. fmt(' "cfxs_lpt_temp.xml" /y /nc')
        macro_exportCommand = macro_exportCommand .. fmt(' "cfxs_lpt_temp.xml" /y /nc')
        Command(seq_exportCommand)
        local seq_content = ReadFile("/importexport/cfxs_lpt_temp.xml")
        if not seq_content then
            error("Read cfxs_lpt_temp returned nil")
        end
        Command(macro_exportCommand)
        local macro_content = ReadFile("/macros/cfxs_lpt_temp.xml")
        if not macro_content then
            error("Read cfxs_lpt_temp returned nil")
        end

        local seq_colors = {}
        local macro_colors = {}

        for k in seq_content:gmatch("<Sequ.-</Sequ>") do
            local index = tonumber(k:match('index="(%d+)')) + 1
            local color = k:match('<Appearance Color="(.-)" />')
            seq_colors[index] = color and color or "ffed6f"
        end

        for k in macro_content:gmatch("<Macro.-</Macro>") do
            local index = tonumber(k:match('index="(%d+)')) + 1
            local color = k:match('<Appearance Color="(.-)" />')
            macro_colors[index] = color and color or "aa0000"
        end

        idx = 1
        for k in content:gmatch("<Exec.->(.-)</Exec>") do
            local type, index = k:match("<No>(%d+)</No>.-<No>.-</No>.-<No>(%d+)</No>")
            type = tonumber(type)
            if type == 25 then
                exec_desc[idx].color = seq_colors[tonumber(index)]
            elseif type == 13 then
                exec_desc[idx].color = macro_colors[tonumber(index)]
            end

            idx = idx + 1
        end

        table.insert(PAGE_CACHE, exec_desc)
    end

    if #pages then
        print(" - Done")
    else
        print(" - Nothing generated")
    end
end

function CheckStatus()
    for i, v in pairs(PAGE_CACHE) do
        if Vars.BUTTONPAGE == tostring(i) then
            for a, b in pairs(v) do
                local running = _get_object_class(_get_object_handle(b.cue_query) or _get_object_handle(b.exec_query) or
                    1) == "CMD_CUE"
                printf("Page %d ch %d running: %s | color: %s", i, b.midi_ch, running, b.color)
            end
        end
    end
end

function Call()
    if GetVar("CFXS_LPT_ACTION") == "regen" then
        Regen()
    end

    CheckStatus()

    SetVar("CFXS_LPT_ACTION", "none")
end

function Cleanup()
end

return function() try(Call) end, function() try(Cleanup) end
