// WEB_COMPILER_DEFINE_BEGIN
// (uint8_t)'A'
const ASCII_A = 65
// WEB_COMPILER_DEFINE_END

class Utils {
    ////////////////////////////////////////////////
    static s_LocalUID_Counter = 0
    ////////////////////////////////////////////////

    // Convert string to valid HTML ID
    static ToValidID(str) {
        return str.replace(/\W/g, '_');
    }

    // Merge keys from source into target and create list/dict of modified keys
    static CheckedMergeDictionary(target, source, resultAsDictionary) {
        var changeList = resultAsDictionary ? {} : []
        for (let e in source) {
            if (target[e] === undefined || !Utils.DeepEquals(target[e], source[e])) {
                if (resultAsDictionary) {
                    changeList[e] = true
                } else {
                    changeList.push(e)
                }
                target[e] = source[e]
            }
        }
        return changeList
    }

    // Merge keys from source into target
    static MergeDictionary(target, source) {
        for (let e in source) {
            target[e] = source[e]
        }
    }

    // Convert string to Pascal Case
    static ToPascalCase(str, strict) {
        return str.replace(/(\w)(\w*)/g,
            function (g0, g1, g2) { return g1.toUpperCase() + (strict === true ? g2.toLowerCase() : g2); });
    }

    // String to DOM object
    static AsHTML(str) {
        var t = document.createElement('template')
        t.innerHTML = str
        return t
    }

    // Append child to parent
    static AppendChild(parent, child) {
        parent.insertAdjacentHTML('beforeend', child.innerHTML)
    }

    // Get local space mouse X from event
    static GetMouseX(e) {
        if (e.pageX) {
            return e.pageX;
        } else if (e.clientX) {
            return e.clientX + (document.documentElement.scrollLeft ?
                document.documentElement.scrollLeft :
                document.body.scrollLeft);
        } else {
            return 0;
        }
    }

    // Get local space mouse Y from event
    static GetMouseY(e) {
        if (e.pageY) {
            return e.pageY;
        } else if (e.clientY) {
            return e.clientY + (document.documentElement.scrollTop ?
                document.documentElement.scrollTop :
                document.body.scrollTop);
        } else {
            return 0;
        }
    }

    static NumberToCharFast(x) {
        return String.fromCharCode(ASCII_A + x)
    }

    static u4_to_hex_table = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"]
    static UniverseToString(format, uni) {
        if (format === NA.enum_UniverseDisplayFormat.HEX) {
            const bw = (uni >> 8) & 0xFF;
            const bs1 = (uni >> 4) & 0x0F;
            const bs2 = uni & 0x0F;
            return `${bw.toString(16).toUpperCase()}.${this.u4_to_hex_table[bs1]}.${this.u4_to_hex_table[bs2]}`.replaceAll(/^0\.0./g, "0.")
        } else if (format === NA.enum_UniverseDisplayFormat.BASE16) {
            const bw = (uni >> 8) & 0xFF;
            const bs1 = (uni >> 4) & 0x0F;
            const bs2 = uni & 0x0F;
            return `${bw}.${bs1}.${bs2}`.replaceAll(/^0\.0./g, "0.")
        } else if (format === NA.enum_UniverseDisplayFormat.ALPHA) {
            if (uni) {
                uni--
                const p1 = uni % 26
                const p2 = ((Math.floor(uni / (26))) % 26)
                const p3 = ((Math.floor(uni / (26 * 26))) % 26)
                const p4 = ((Math.floor(uni / (26 * 26 * 26))) % 26)
                var res = ""

                if (p4 !== 0)
                    res += String.fromCharCode(ASCII_A + p4 - 1)
                if (p3 !== 0)
                    res += String.fromCharCode(ASCII_A + p3 - 1)
                if (p2 !== 0)
                    res += String.fromCharCode(ASCII_A + p2 - 1)

                res += String.fromCharCode(ASCII_A + p1)

                return res
            } else {
                return "0"
            }
        } else {
            return uni;
        }
    }

    static __isStringDecimal(str) {
        return !/[^0-9]/.test(str)
    }

    static __isStringABC(str) {
        return /[A-Z]/.test(str)
    }

    static __str2int(str) {
        var ret = -1; // set to invalid data
        var val = 0;
        var i;
        var len;
        var byte;
        len = str.length;
        if (len !== 0) {
            // test if string has decimal digits only
            if (Utils.__isStringDecimal(str) == true) { // Yes
                // try decimal
                val = +str;
            } else { // No
                // try hex
                i = 0;
                while (i < len) {
                    // get current character then increment
                    var byteCode = str.charCodeAt(i)
                    byte = str.charAt(i++)
                    // transform hex character to the 4bit equivalent number, using the ascii table indexes
                    if (/^[0-9]+$/.test(byte))
                        byteCode = byteCode - '0'.charCodeAt(0);
                    else if (/^[a-f]+$/.test(byte))
                        byteCode = byteCode - 'a'.charCodeAt(0) + 10;
                    else if (/^[A-F]+$/.test(byte))
                        byteCode = byteCode - 'A'.charCodeAt(0) + 10;
                    else
                        return ret; // string is invalid
                    // shift 4 to make space for new digit, and add the 4 bits of the new digit
                    val = (val << 4) | (byteCode & 0xF);
                }
            }
        } else {
            return ret; // string is empty
        }
        return val; // parse success
    }

    static UniverseFromString(str) {
        var ret = -1
        var net = 0, subnet = 0, univ = 0;

        if (str.length === 0)
            return 0; // string is empty

        var val = 0
        var list = str.split(".")
        const list_count = list.length

        if (list_count > 1) { // point separated format found
            if (list_count == 2) {
                val = Utils.__str2int(list[0]);
                if (val == -1)
                    return ret; // conversion error
                subnet = val;

                val = Utils.__str2int(list[1]);
                if (val == -1)
                    return ret; // conversion error

                univ = val;

            } else if (list_count == 3) {
                val = Utils.__str2int(list[0]);
                if (val == -1)
                    return ret; // conversion error

                net = val;
                //
                val = Utils.__str2int(list[1]);
                if (val == -1)
                    return ret; // conversion error

                subnet = val;
                //
                val = Utils.__str2int(list[2]);
                if (val == -1)
                    return ret; // conversion error

                univ = val;
            }

            val = (univ & 0xFF) | ((subnet & 0xFF) << 4) | ((net & 0xFF) << 8);
            if (val > 0x7FFF)
                return ret; // value out of range

        } else { // single value decimal or alpha (ABC)
            // test if string has decimal digits only
            if (Utils.__isStringDecimal(str) == true) { // Yes
                // try decimal
                val = +str;
            } else { // No
                // try ABC

                str = str.toUpperCase()

                // check if string contains only letters
                if (Utils.__isStringABC(str) == false)
                    return 0; // non letter value detected

                val = 0; // starting from 1
                const strLen = str.length;

                if (strLen > 4)
                    return 0xFFFF;

                const ALPHA_POWER = [1, 26, 676, 17576]
                for (var i = 0; i < strLen; i++) {
                    var power = ALPHA_POWER[(strLen - 1) - i];
                    var relVal = (str.charCodeAt(i) - 'A'.charCodeAt(0)) + 1; // start from 1
                    val += power * relVal;
                }
            }
        }
        return val; // parse success
    }

    static GetNewLocalUID() {
        return (Utils.s_LocalUID_Counter++).toString(36)
    }

    static GetPortLayoutRowCount(pl) {
        return pl.split(":").length
    }

    static GetPortLayoutColumnCount(pl) {
        var count = 0
        for (const l of pl.split(":"))
            count = Math.max(count, l)
        return count
    }

    static PortIndexToXY(idx, columns) {
        return {
            x: idx % columns,
            y: Math.floor(idx / columns)
        }
    }

    static GetLastElement(arr) {
        return arr[arr.length - 1]
    }

    static s_Latin_map = {
        "??": "A", "??": "A", "???": "A", "???": "A", "???": "A", "???": "A", "???": "A", "??": "A", "??": "A", "???": "A", "???": "A", "???": "A", "???": "A", "???": "A", "??": "A", "??": "A", "??": "A", "??": "A", "???": "A", "??": "A", "??": "A", "???": "A", "??": "A", "??": "A", "??": "A", "??": "A", "??": "A", "???": "A", "??": "A", "??": "A", "???": "AA", "??": "AE", "??": "AE", "??": "AE", "???": "AO", "???": "AU", "???": "AV", "???": "AV", "???": "AY", "???": "B", "???": "B", "??": "B", "???": "B", "??": "B", "??": "B", "??": "C", "??": "C", "??": "C", "???": "C", "??": "C", "??": "C", "??": "C", "??": "C", "??": "D", "???": "D", "???": "D", "???": "D", "???": "D", "??": "D", "???": "D", "??": "D", "??": "D", "??": "D", "??": "D", "??": "DZ", "??": "DZ", "??": "E", "??": "E", "??": "E", "??": "E", "???": "E", "??": "E", "???": "E", "???": "E", "???": "E", "???": "E", "???": "E", "???": "E", "??": "E", "??": "E", "???": "E", "??": "E", "??": "E", "???": "E", "??": "E", "??": "E", "???": "E", "???": "E", "??": "E", "??": "E", "???": "E", "???": "E", "???": "ET", "???": "F", "??": "F", "??": "G", "??": "G", "??": "G", "??": "G", "??": "G", "??": "G", "??": "G", "???": "G", "??": "G", "???": "H", "??": "H", "???": "H", "??": "H", "???": "H", "???": "H", "???": "H", "???": "H", "??": "H", "??": "I", "??": "I", "??": "I", "??": "I", "??": "I", "???": "I", "??": "I", "???": "I", "??": "I", "??": "I", "???": "I", "??": "I", "??": "I", "??": "I", "??": "I", "??": "I", "???": "I", "???": "D", "???": "F", "???": "G", "???": "R", "???": "S", "???": "T", "???": "IS", "??": "J", "??": "J", "???": "K", "??": "K", "??": "K", "???": "K", "???": "K", "???": "K", "??": "K", "???": "K", "???": "K", "???": "K", "??": "L", "??": "L", "??": "L", "??": "L", "???": "L", "???": "L", "???": "L", "???": "L", "???": "L", "???": "L", "??": "L", "???": "L", "??": "L", "??": "L", "??": "LJ", "???": "M", "???": "M", "???": "M", "???": "M", "??": "N", "??": "N", "??": "N", "???": "N", "???": "N", "???": "N", "??": "N", "??": "N", "???": "N", "??": "N", "??": "N", "??": "N", "??": "NJ", "??": "O", "??": "O", "??": "O", "??": "O", "???": "O", "???": "O", "???": "O", "???": "O", "???": "O", "??": "O", "??": "O", "??": "O", "??": "O", "???": "O", "??": "O", "??": "O", "??": "O", "???": "O", "??": "O", "???": "O", "???": "O", "???": "O", "???": "O", "???": "O", "??": "O", "???": "O", "???": "O", "??": "O", "???": "O", "???": "O", "??": "O", "??": "O", "??": "O", "??": "O", "??": "O", "??": "O", "???": "O", "???": "O", "??": "O", "??": "OI", "???": "OO", "??": "E", "??": "O", "??": "OU", "???": "P", "???": "P", "???": "P", "??": "P", "???": "P", "???": "P", "???": "P", "???": "Q", "???": "Q", "??": "R", "??": "R", "??": "R", "???": "R", "???": "R", "???": "R", "??": "R", "??": "R", "???": "R", "??": "R", "???": "R", "???": "C", "??": "E", "??": "S", "???": "S", "??": "S", "???": "S", "??": "S", "??": "S", "??": "S", "???": "S", "???": "S", "???": "S", "??": "T", "??": "T", "???": "T", "??": "T", "??": "T", "???": "T", "???": "T", "??": "T", "???": "T", "??": "T", "??": "T", "???": "A", "???": "L", "??": "M", "??": "V", "???": "TZ", "??": "U", "??": "U", "??": "U", "??": "U", "???": "U", "??": "U", "??": "U", "??": "U", "??": "U", "??": "U", "???": "U", "???": "U", "??": "U", "??": "U", "??": "U", "???": "U", "??": "U", "???": "U", "???": "U", "???": "U", "???": "U", "???": "U", "??": "U", "??": "U", "???": "U", "??": "U", "??": "U", "??": "U", "???": "U", "???": "U", "???": "V", "???": "V", "??": "V", "???": "V", "???": "VY", "???": "W", "??": "W", "???": "W", "???": "W", "???": "W", "???": "W", "???": "W", "???": "X", "???": "X", "??": "Y", "??": "Y", "??": "Y", "???": "Y", "???": "Y", "???": "Y", "??": "Y", "???": "Y", "???": "Y", "??": "Y", "??": "Y", "???": "Y", "??": "Z", "??": "Z", "???": "Z", "???": "Z", "??": "Z", "???": "Z", "??": "Z", "???": "Z", "??": "Z", "??": "IJ", "??": "OE", "???": "A", "???": "AE", "??": "B", "???": "B", "???": "C", "???": "D", "???": "E", "???": "F", "??": "G", "??": "G", "??": "H", "??": "I", "??": "R", "???": "J", "???": "K", "??": "L", "???": "L", "???": "M", "??": "N", "???": "O", "??": "OE", "???": "O", "???": "OU", "???": "P", "??": "R", "???": "N", "???": "R", "???": "S", "???": "T", "???": "E", "???": "R", "???": "U", "???": "V", "???": "W", "??": "Y", "???": "Z", "??": "a", "??": "a", "???": "a", "???": "a", "???": "a", "???": "a", "???": "a", "??": "a", "??": "a", "???": "a", "???": "a", "???": "a", "???": "a", "???": "a", "??": "a", "??": "a", "??": "a", "??": "a", "???": "a", "??": "a", "??": "a", "???": "a", "??": "a", "??": "a", "??": "a", "???": "a", "???": "a", "??": "a", "??": "a", "???": "a", "???": "a", "??": "a", "???": "aa", "??": "ae", "??": "ae", "??": "ae", "???": "ao", "???": "au", "???": "av", "???": "av", "???": "ay", "???": "b", "???": "b", "??": "b", "???": "b", "???": "b", "???": "b", "??": "b", "??": "b", "??": "o", "??": "c", "??": "c", "??": "c", "???": "c", "??": "c", "??": "c", "??": "c", "??": "c", "??": "c", "??": "d", "???": "d", "???": "d", "??": "d", "???": "d", "???": "d", "??": "d", "???": "d", "???": "d", "???": "d", "???": "d", "??": "d", "??": "d", "??": "d", "??": "i", "??": "j", "??": "j", "??": "j", "??": "dz", "??": "dz", "??": "e", "??": "e", "??": "e", "??": "e", "???": "e", "??": "e", "???": "e", "???": "e", "???": "e", "???": "e", "???": "e", "???": "e", "??": "e", "??": "e", "???": "e", "??": "e", "??": "e", "???": "e", "??": "e", "??": "e", "???": "e", "???": "e", "???": "e", "??": "e", "???": "e", "??": "e", "???": "e", "???": "e", "???": "et", "???": "f", "??": "f", "???": "f", "???": "f", "??": "g", "??": "g", "??": "g", "??": "g", "??": "g", "??": "g", "??": "g", "???": "g", "???": "g", "??": "g", "???": "h", "??": "h", "???": "h", "??": "h", "???": "h", "???": "h", "???": "h", "???": "h", "??": "h", "???": "h", "??": "h", "??": "hv", "??": "i", "??": "i", "??": "i", "??": "i", "??": "i", "???": "i", "???": "i", "??": "i", "??": "i", "???": "i", "??": "i", "??": "i", "??": "i", "???": "i", "??": "i", "??": "i", "???": "i", "???": "d", "???": "f", "???": "g", "???": "r", "???": "s", "???": "t", "???": "is", "??": "j", "??": "j", "??": "j", "??": "j", "???": "k", "??": "k", "??": "k", "???": "k", "???": "k", "???": "k", "??": "k", "???": "k", "???": "k", "???": "k", "???": "k", "??": "l", "??": "l", "??": "l", "??": "l", "??": "l", "???": "l", "??": "l", "???": "l", "???": "l", "???": "l", "???": "l", "???": "l", "??": "l", "??": "l", "???": "l", "??": "l", "??": "l", "??": "lj", "??": "s", "???": "s", "???": "s", "???": "s", "???": "m", "???": "m", "???": "m", "??": "m", "???": "m", "???": "m", "??": "n", "??": "n", "??": "n", "???": "n", "??": "n", "???": "n", "???": "n", "??": "n", "??": "n", "???": "n", "??": "n", "???": "n", "???": "n", "??": "n", "??": "n", "??": "nj", "??": "o", "??": "o", "??": "o", "??": "o", "???": "o", "???": "o", "???": "o", "???": "o", "???": "o", "??": "o", "??": "o", "??": "o", "??": "o", "???": "o", "??": "o", "??": "o", "??": "o", "???": "o", "??": "o", "???": "o", "???": "o", "???": "o", "???": "o", "???": "o", "??": "o", "???": "o", "???": "o", "???": "o", "??": "o", "???": "o", "???": "o", "??": "o", "??": "o", "??": "o", "??": "o", "??": "o", "???": "o", "???": "o", "??": "o", "??": "oi", "???": "oo", "??": "e", "???": "e", "??": "o", "???": "o", "??": "ou", "???": "p", "???": "p", "???": "p", "??": "p", "???": "p", "???": "p", "???": "p", "???": "p", "???": "p", "???": "q", "??": "q", "??": "q", "???": "q", "??": "r", "??": "r", "??": "r", "???": "r", "???": "r", "???": "r", "??": "r", "??": "r", "???": "r", "??": "r", "???": "r", "??": "r", "???": "r", "???": "r", "??": "r", "??": "r", "???": "c", "???": "c", "??": "e", "??": "r", "??": "s", "???": "s", "??": "s", "???": "s", "??": "s", "??": "s", "??": "s", "???": "s", "???": "s", "???": "s", "??": "s", "???": "s", "???": "s", "??": "s", "??": "g", "???": "o", "???": "o", "???": "u", "??": "t", "??": "t", "???": "t", "??": "t", "??": "t", "???": "t", "???": "t", "???": "t", "???": "t", "??": "t", "???": "t", "???": "t", "??": "t", "??": "t", "??": "t", "???": "th", "??": "a", "???": "ae", "??": "e", "???": "g", "??": "h", "??": "h", "??": "h", "???": "i", "??": "k", "???": "l", "??": "m", "??": "m", "???": "oe", "??": "r", "??": "r", "??": "r", "???": "r", "??": "t", "??": "v", "??": "w", "??": "y", "???": "tz", "??": "u", "??": "u", "??": "u", "??": "u", "???": "u", "??": "u", "??": "u", "??": "u", "??": "u", "??": "u", "???": "u", "???": "u", "??": "u", "??": "u", "??": "u", "???": "u", "??": "u", "???": "u", "???": "u", "???": "u", "???": "u", "???": "u", "??": "u", "??": "u", "???": "u", "??": "u", "???": "u", "??": "u", "??": "u", "???": "u", "???": "u", "???": "ue", "???": "um", "???": "v", "???": "v", "???": "v", "??": "v", "???": "v", "???": "v", "???": "v", "???": "vy", "???": "w", "??": "w", "???": "w", "???": "w", "???": "w", "???": "w", "???": "w", "???": "w", "???": "x", "???": "x", "???": "x", "??": "y", "??": "y", "??": "y", "???": "y", "???": "y", "???": "y", "??": "y", "???": "y", "???": "y", "??": "y", "???": "y", "??": "y", "???": "y", "??": "z", "??": "z", "???": "z", "??": "z", "???": "z", "??": "z", "???": "z", "??": "z", "???": "z", "???": "z", "???": "z", "??": "z", "??": "z", "??": "z", "???": "ff", "???": "ffi", "???": "ffl", "???": "fi", "???": "fl", "??": "ij", "??": "oe", "???": "st", "???": "a", "???": "e", "???": "i", "???": "j", "???": "o", "???": "r", "???": "u", "???": "v", "???": "x"
    }

    static ToSafeString(str) {
        return (() => {
            try {
                return str.normalize('NFKD').replace(/[\u0300-\u036F]/g, '')
            } catch {
                return str.replace(/[^A-Za-z0-9\[\] ]/g, function (a) { return Utils.s_Latin_map[a] || a })
            }
        })().replace(/\u0401/g, 'YO')
            .replace(/\u0419/g, 'I')
            .replace(/\u0426/g, 'TS')
            .replace(/\u0423/g, 'U')
            .replace(/\u041A/g, 'K')
            .replace(/\u0415/g, 'E')
            .replace(/\u041D/g, 'N')
            .replace(/\u0413/g, 'G')
            .replace(/\u0428/g, 'SH')
            .replace(/\u0429/g, 'SCH')
            .replace(/\u0417/g, 'Z')
            .replace(/\u0425/g, 'H')
            .replace(/\u042A/g, '')
            .replace(/\u0451/g, 'yo')
            .replace(/\u0439/g, 'i')
            .replace(/\u0446/g, 'ts')
            .replace(/\u0443/g, 'u')
            .replace(/\u043A/g, 'k')
            .replace(/\u0435/g, 'e')
            .replace(/\u043D/g, 'n')
            .replace(/\u0433/g, 'g')
            .replace(/\u0448/g, 'sh')
            .replace(/\u0449/g, 'sch')
            .replace(/\u0437/g, 'z')
            .replace(/\u0445/g, 'h')
            .replace(/\u044A/g, "'")
            .replace(/\u0424/g, 'F')
            .replace(/\u042B/g, 'I')
            .replace(/\u0412/g, 'V')
            .replace(/\u0410/g, 'a')
            .replace(/\u041F/g, 'P')
            .replace(/\u0420/g, 'R')
            .replace(/\u041E/g, 'O')
            .replace(/\u041B/g, 'L')
            .replace(/\u0414/g, 'D')
            .replace(/\u0416/g, 'ZH')
            .replace(/\u042D/g, 'E')
            .replace(/\u0444/g, 'f')
            .replace(/\u044B/g, 'i')
            .replace(/\u0432/g, 'v')
            .replace(/\u0430/g, 'a')
            .replace(/\u043F/g, 'p')
            .replace(/\u0440/g, 'r')
            .replace(/\u043E/g, 'o')
            .replace(/\u043B/g, 'l')
            .replace(/\u0434/g, 'd')
            .replace(/\u0436/g, 'zh')
            .replace(/\u044D/g, 'e')
            .replace(/\u042F/g, 'Ya')
            .replace(/\u0427/g, 'CH')
            .replace(/\u0421/g, 'S')
            .replace(/\u041C/g, 'M')
            .replace(/\u0418/g, 'I')
            .replace(/\u0422/g, 'T')
            .replace(/\u042C/g, "'")
            .replace(/\u0411/g, 'B')
            .replace(/\u042E/g, 'YU')
            .replace(/\u044F/g, 'ya')
            .replace(/\u0447/g, 'ch')
            .replace(/\u0441/g, 's')
            .replace(/\u043C/g, 'm')
            .replace(/\u0438/g, 'i')
            .replace(/\u0442/g, 't')
            .replace(/\u044C/g, "'")
            .replace(/\u0431/g, 'b')
            .replace(/\u044E/g, 'yu');
    }

    static SetCaretPosition(el, caretPos) {
        if (el !== null) {
            if (el.selectionStart || el.selectionStart === 0) {
                el.setSelectionRange(caretPos, caretPos);
                return true;
            } else {
                return false;
            }
        }
    }

    static PortOrderToString(order, rangeTransition) {
        if (order.length === 0) {
            return ""
        } else if (order.length === 1) {
            return String.fromCharCode(ASCII_A + order[0])
        }

        var stack = []

        for (var s of order) {
            const val = s
            const lidx = stack.length - 1

            if (stack.length !== 0) {
                if (stack[lidx].next === s) {
                    stack[lidx].next++
                    stack[lidx].prev = null
                    stack[lidx].length++
                    continue
                } else if (stack[lidx].prev === s) {
                    stack[lidx].prev--
                    stack[lidx].next = null
                    stack[lidx].length++
                    continue
                }
            }

            stack.push({ start: val, next: val + 1, prev: val - 1, length: 1 })
        }

        var outputString = ""
        for (var k in stack) {
            var set = stack[k]

            if (set.length > 1) {
                outputString = outputString + String.fromCharCode(ASCII_A + set.start) + rangeTransition + String.fromCharCode(ASCII_A + (set.next !== null ? (set.start + set.length - 1) : (set.start - set.length + 1))) + ", "
            } else {
                outputString = outputString + String.fromCharCode(ASCII_A + set.start) + ", "
            }
        }

        return outputString.substring(0, outputString.length - 2)
    }

    static IsValidIP(str) {
        const regexExp = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gi;
        return regexExp.test(str);
    }

    static IPAddressToArray(str) {
        var arr = str.split(".")
        if (arr.length !== 4) {
            return null;
        }

        for (var i = 0; i < 4; i++) {
            arr[i] = +arr[i];
            if (arr[i] > 255 || arr[i] < 0) {
                return false;
            }
        }

        return arr;
    }

    static IPArrayToInt(arr) {
        return (arr[3] | (arr[2] << 8) | (arr[1] << 16) | (arr[0] << 24)) & 0xFFFFFFFF
    }

    static NetmaskValid(val) {
        return ((val & 0xFFFFFFFF) & ((~val >> 1) & 0xFFFFFFFF)) === 0
    }

    static IsOverflowingX(elem) {
        return elem.offsetWidth !== elem.scrollWidth
    }

    static IsArray(obj) {
        return !!obj && obj.constructor === Array;
    }

    static IsFunction(obj) {
        return !!obj && obj.constructor === Function;
    }

    static DeepEquals(obj1, obj2, parents1, parents2) {
        var i;
        // compare primitives
        if (typeof (obj1) !== 'object' || typeof (obj2) !== 'object') {
            return obj1 === obj2;
        }

        // if objects are of different types or lengths they can't be equal
        if (obj1.constructor !== obj2.constructor || (obj1.length !== undefined && obj1.length !== obj2.length)) {
            return false;
        }

        // iterate the objects
        for (i in obj1) {
            // build the parents list for object on the left (obj1)
            //if (parents1 === undefined) parents1 = [];
            //if (obj1.constructor === Object) parents1.push(obj1);
            //// build the parents list for object on the right (obj2)
            //if (parents2 === undefined) parents2 = [];
            //if (obj2.constructor === Object) parents2.push(obj2);
            // walk through object properties
            if (obj1.propertyIsEnumerable(i)) {
                if (obj2.propertyIsEnumerable(i)) {
                    // if object at i was met while going down here
                    // it's a self reference
                    // if ((obj1[i].constructor === Object && parents1.indexOf(obj1[i]) >= 0) || (obj2[i].constructor === Object && parents2.indexOf(obj2[i]) >= 0)) {
                    //     if (obj1[i] !== obj2[i]) {
                    //         return false;
                    //     }
                    //     continue;
                    // }
                    // it's not a self reference so we are here
                    if (!Utils.DeepEquals(obj1[i], obj2[i], parents1, parents2)) {
                        return false;
                    }
                } else {
                    // obj2[i] does not exist
                    return false;
                }
            }
        }
        return true;
    }

    static IntTo_RDM_UID(val) {
        var str = val.toString(16).padStart(12, "0").toUpperCase()
        return str.substring(0, 4) + ":" + str.substring(4)
    }
}



