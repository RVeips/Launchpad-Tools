-- Basic
_G.floor = math.floor
_G.ceil = math.ceil
_G.round = function(x) return floor(x + 0.5) end
_G.is_number = function(x) return type(x) == "number" end
_G.is_string = function(x) return type(x) == "string" end
_G.is_table = function(x) return type(x) == "table" end
_G.is_function = function(x) return type(x) == "function" end
_G.is_nil = function(x) return type(x) == "nil" end
_G.Command = gma.cmd
_G.print = gma.feedback
_G.fmt = string.format
_G.printf = function(...) print(fmt(...)) end
_G.try = function(fn)
    local s, m = pcall(fn)
    if not s then print(m) end
end

try(function()
    _G.Socket = require("socket/socket")

    _G.ReadFile = function(path)
        path = _G.PATH .. (path:gsub(WRONG_SEPARATOR, SEPARATOR))
        local f = io.open(path, "r")
        if not f then
            return nil
        end
        local content = f:read("*a")
        f:close()
        return content
    end

    _G.WriteFile = function(path, content)
        path = _G.PATH .. (path:gsub(WRONG_SEPARATOR, SEPARATOR))
        -- local folderIndex = path:match('^.*()/')
        -- local folder = path:sub(1, folderIndex - 1):gsub("/", "\\")
        -- os.execute('if not exist "' .. folder .. '" mkdir "' .. folder .. '"')
        local f = io.open(path, "w+")
        if not f then
            return false
        end
        f:write(content)
        f:close()
        return true
    end

    -- Variables
    _G._GetVar = gma.show.getvar
    _G._SetVar = gma.show.setvar
    _G._GetUserVar = gma.user.getvar
    _G._SetUserVar = gma.user.setvar
    _G.GetVar = function(name) return _GetVar(name) end
    _G.SetVar = function(name, value) _SetVar(name, value) end
    _G.GetUserVar = function(name) return _GetUserVar(name) end
    _G.SetUserVar = function(name, value) _SetUserVar(name, value) end

    _G.SEPARATOR = ((_GetVar("OS"):lower() == "windows") and "\\" or "/")
    _G.WRONG_SEPARATOR = ((_GetVar("OS"):lower() == "windows") and "/" or "\\")
    _G.PATH = _GetVar("PATH") .. _G.SEPARATOR

    -- Vars meta
    _G.Vars = setmetatable({}, {
        __index = function(self, key)
            return GetVar(key)
        end,
        __newindex = function(self, key, value)
            if key == "BUTTONPAGE" then
                if not is_number(value) then error("Set BUTTONPAGE value not a number: " .. tostring(value)) end
                SetButtonPage(floor(value))
            elseif key == "FADERPAGE" then
                if not is_number(value) then error("Set FADERPAGE value not a number: " .. tostring(value)) end
                SetFaderPage(floor(value))
            else
                SetVar(key, value)
            end
        end
    })

    -- User vars meta
    _G.UserVars = setmetatable({}, {
        __index = function(self, key)
            return GetUserVar(key)
        end,
        __newindex = function(self, key, value)
            SetUserVar(key, value)
        end
    })

    -- Pages
    _G.SetButtonPage = function(page)
        Exec("ButtonPage " .. page)
    end
    _G.NextButtonPage = function()
        Exec("ButtonPage+")
    end
    _G.PrevButtonPage = function(e)
        Exec("ButtonPage-")
    end
    _G.SetFaderPage = function(page)
        Exec("FaderPage " .. page)
    end
    _G.NextFadernPage = function()
        Exec("FaderPage+")
    end
    _G.PrevFaderPage = function(e)
        Exec("FaderPage-")
    end

    -- Object
    _G._get_object_handle = gma.show.getobj.handle
    _G._get_object_class = gma.show.getobj.class
    _G._get_object_index = gma.show.getobj.index
    _G._get_object_number = gma.show.getobj.number
    _G._get_object_name = gma.show.getobj.name
    _G._get_object_label = gma.show.getobj.label
    _G._get_object_amount = gma.show.getobj.amount
    _G._get_object_child = gma.show.getobj.child
    _G._get_object_parent = gma.show.getobj.parent
    _G._get_object_verify = gma.show.getobj.verify
    _G._get_object_compare = gma.show.getobj.compare
    _G._property_amount = gma.show.property.amount
    _G._property_name = gma.show.property.name
    _G._property_get = gma.show.property.get
    _G._property_set = gma.show.property.set

    _G.GetObject = function(name)
        return setmetatable({
            handle = _get_object_handle(name),
            GetChildCount = function(self) return _get_object_amount(self.handle) end,
            GetName = function(self) return _get_object_name(self.handle) end,
            GetLabel = function(self) return _get_object_label(self.handle) end,
            GetClass = function(self) return _get_object_class(self.handle) end,
            GetNumber = function(self) return _get_object_number(self.handle) end,
            GetIndex = function(self) return _get_object_index(self.handle) end,
            GetChild = function(self, index)
                return GetObject(_get_object_child(self.handle, floor(index)))
            end,
            GetParent = function(self)
                return GetObject(_get_object_parent(self.handle))
            end,
            IsValid = function(self)
                if self.handle == nil then return false end
                return _get_object_verify(self.handle)
            end,
            Compare = function(self, other)
                return _get_object_compare(self.handle, other.handle)
            end,
            GetPropertyCount = function(self)
                return _property_amount(self.handle)
            end,
            GetPropertyName = function(self, prop)
                if is_number(prop) then prop = floor(prop) end
                return _property_name(self.handle, prop)
            end,
            GetPropertyValue = function(self, prop)
                if is_number(prop) then prop = floor(prop) end
                return _property_get(self.handle, prop)
            end,
            SetPropertyValue = function(self, prop, val)
                if is_number(prop) then prop = floor(prop) end
                _property_set(self.handle, prop, val)
            end
        }, {})
    end

    -- Types
    _G.BUTTON_TYPE_MAP = {
        ["12299"] = "Go",
        ["12307"] = "Toggle",
        ["12321"] = "FlashGo",
        ["12291"] = "Temp",
    }

    print("libCFXS Loaded")
end)
