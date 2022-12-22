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
        "Á": "A", "Ă": "A", "Ắ": "A", "Ặ": "A", "Ằ": "A", "Ẳ": "A", "Ẵ": "A", "Ǎ": "A", "Â": "A", "Ấ": "A", "Ậ": "A", "Ầ": "A", "Ẩ": "A", "Ẫ": "A", "Ä": "A", "Ǟ": "A", "Ȧ": "A", "Ǡ": "A", "Ạ": "A", "Ȁ": "A", "À": "A", "Ả": "A", "Ȃ": "A", "Ā": "A", "Ą": "A", "Å": "A", "Ǻ": "A", "Ḁ": "A", "Ⱥ": "A", "Ã": "A", "Ꜳ": "AA", "Æ": "AE", "Ǽ": "AE", "Ǣ": "AE", "Ꜵ": "AO", "Ꜷ": "AU", "Ꜹ": "AV", "Ꜻ": "AV", "Ꜽ": "AY", "Ḃ": "B", "Ḅ": "B", "Ɓ": "B", "Ḇ": "B", "Ƀ": "B", "Ƃ": "B", "Ć": "C", "Č": "C", "Ç": "C", "Ḉ": "C", "Ĉ": "C", "Ċ": "C", "Ƈ": "C", "Ȼ": "C", "Ď": "D", "Ḑ": "D", "Ḓ": "D", "Ḋ": "D", "Ḍ": "D", "Ɗ": "D", "Ḏ": "D", "ǲ": "D", "ǅ": "D", "Đ": "D", "Ƌ": "D", "Ǳ": "DZ", "Ǆ": "DZ", "É": "E", "Ĕ": "E", "Ě": "E", "Ȩ": "E", "Ḝ": "E", "Ê": "E", "Ế": "E", "Ệ": "E", "Ề": "E", "Ể": "E", "Ễ": "E", "Ḙ": "E", "Ë": "E", "Ė": "E", "Ẹ": "E", "Ȅ": "E", "È": "E", "Ẻ": "E", "Ȇ": "E", "Ē": "E", "Ḗ": "E", "Ḕ": "E", "Ę": "E", "Ɇ": "E", "Ẽ": "E", "Ḛ": "E", "Ꝫ": "ET", "Ḟ": "F", "Ƒ": "F", "Ǵ": "G", "Ğ": "G", "Ǧ": "G", "Ģ": "G", "Ĝ": "G", "Ġ": "G", "Ɠ": "G", "Ḡ": "G", "Ǥ": "G", "Ḫ": "H", "Ȟ": "H", "Ḩ": "H", "Ĥ": "H", "Ⱨ": "H", "Ḧ": "H", "Ḣ": "H", "Ḥ": "H", "Ħ": "H", "Í": "I", "Ĭ": "I", "Ǐ": "I", "Î": "I", "Ï": "I", "Ḯ": "I", "İ": "I", "Ị": "I", "Ȉ": "I", "Ì": "I", "Ỉ": "I", "Ȋ": "I", "Ī": "I", "Į": "I", "Ɨ": "I", "Ĩ": "I", "Ḭ": "I", "Ꝺ": "D", "Ꝼ": "F", "Ᵹ": "G", "Ꞃ": "R", "Ꞅ": "S", "Ꞇ": "T", "Ꝭ": "IS", "Ĵ": "J", "Ɉ": "J", "Ḱ": "K", "Ǩ": "K", "Ķ": "K", "Ⱪ": "K", "Ꝃ": "K", "Ḳ": "K", "Ƙ": "K", "Ḵ": "K", "Ꝁ": "K", "Ꝅ": "K", "Ĺ": "L", "Ƚ": "L", "Ľ": "L", "Ļ": "L", "Ḽ": "L", "Ḷ": "L", "Ḹ": "L", "Ⱡ": "L", "Ꝉ": "L", "Ḻ": "L", "Ŀ": "L", "Ɫ": "L", "ǈ": "L", "Ł": "L", "Ǉ": "LJ", "Ḿ": "M", "Ṁ": "M", "Ṃ": "M", "Ɱ": "M", "Ń": "N", "Ň": "N", "Ņ": "N", "Ṋ": "N", "Ṅ": "N", "Ṇ": "N", "Ǹ": "N", "Ɲ": "N", "Ṉ": "N", "Ƞ": "N", "ǋ": "N", "Ñ": "N", "Ǌ": "NJ", "Ó": "O", "Ŏ": "O", "Ǒ": "O", "Ô": "O", "Ố": "O", "Ộ": "O", "Ồ": "O", "Ổ": "O", "Ỗ": "O", "Ö": "O", "Ȫ": "O", "Ȯ": "O", "Ȱ": "O", "Ọ": "O", "Ő": "O", "Ȍ": "O", "Ò": "O", "Ỏ": "O", "Ơ": "O", "Ớ": "O", "Ợ": "O", "Ờ": "O", "Ở": "O", "Ỡ": "O", "Ȏ": "O", "Ꝋ": "O", "Ꝍ": "O", "Ō": "O", "Ṓ": "O", "Ṑ": "O", "Ɵ": "O", "Ǫ": "O", "Ǭ": "O", "Ø": "O", "Ǿ": "O", "Õ": "O", "Ṍ": "O", "Ṏ": "O", "Ȭ": "O", "Ƣ": "OI", "Ꝏ": "OO", "Ɛ": "E", "Ɔ": "O", "Ȣ": "OU", "Ṕ": "P", "Ṗ": "P", "Ꝓ": "P", "Ƥ": "P", "Ꝕ": "P", "Ᵽ": "P", "Ꝑ": "P", "Ꝙ": "Q", "Ꝗ": "Q", "Ŕ": "R", "Ř": "R", "Ŗ": "R", "Ṙ": "R", "Ṛ": "R", "Ṝ": "R", "Ȑ": "R", "Ȓ": "R", "Ṟ": "R", "Ɍ": "R", "Ɽ": "R", "Ꜿ": "C", "Ǝ": "E", "Ś": "S", "Ṥ": "S", "Š": "S", "Ṧ": "S", "Ş": "S", "Ŝ": "S", "Ș": "S", "Ṡ": "S", "Ṣ": "S", "Ṩ": "S", "Ť": "T", "Ţ": "T", "Ṱ": "T", "Ț": "T", "Ⱦ": "T", "Ṫ": "T", "Ṭ": "T", "Ƭ": "T", "Ṯ": "T", "Ʈ": "T", "Ŧ": "T", "Ɐ": "A", "Ꞁ": "L", "Ɯ": "M", "Ʌ": "V", "Ꜩ": "TZ", "Ú": "U", "Ŭ": "U", "Ǔ": "U", "Û": "U", "Ṷ": "U", "Ü": "U", "Ǘ": "U", "Ǚ": "U", "Ǜ": "U", "Ǖ": "U", "Ṳ": "U", "Ụ": "U", "Ű": "U", "Ȕ": "U", "Ù": "U", "Ủ": "U", "Ư": "U", "Ứ": "U", "Ự": "U", "Ừ": "U", "Ử": "U", "Ữ": "U", "Ȗ": "U", "Ū": "U", "Ṻ": "U", "Ų": "U", "Ů": "U", "Ũ": "U", "Ṹ": "U", "Ṵ": "U", "Ꝟ": "V", "Ṿ": "V", "Ʋ": "V", "Ṽ": "V", "Ꝡ": "VY", "Ẃ": "W", "Ŵ": "W", "Ẅ": "W", "Ẇ": "W", "Ẉ": "W", "Ẁ": "W", "Ⱳ": "W", "Ẍ": "X", "Ẋ": "X", "Ý": "Y", "Ŷ": "Y", "Ÿ": "Y", "Ẏ": "Y", "Ỵ": "Y", "Ỳ": "Y", "Ƴ": "Y", "Ỷ": "Y", "Ỿ": "Y", "Ȳ": "Y", "Ɏ": "Y", "Ỹ": "Y", "Ź": "Z", "Ž": "Z", "Ẑ": "Z", "Ⱬ": "Z", "Ż": "Z", "Ẓ": "Z", "Ȥ": "Z", "Ẕ": "Z", "Ƶ": "Z", "Ĳ": "IJ", "Œ": "OE", "ᴀ": "A", "ᴁ": "AE", "ʙ": "B", "ᴃ": "B", "ᴄ": "C", "ᴅ": "D", "ᴇ": "E", "ꜰ": "F", "ɢ": "G", "ʛ": "G", "ʜ": "H", "ɪ": "I", "ʁ": "R", "ᴊ": "J", "ᴋ": "K", "ʟ": "L", "ᴌ": "L", "ᴍ": "M", "ɴ": "N", "ᴏ": "O", "ɶ": "OE", "ᴐ": "O", "ᴕ": "OU", "ᴘ": "P", "ʀ": "R", "ᴎ": "N", "ᴙ": "R", "ꜱ": "S", "ᴛ": "T", "ⱻ": "E", "ᴚ": "R", "ᴜ": "U", "ᴠ": "V", "ᴡ": "W", "ʏ": "Y", "ᴢ": "Z", "á": "a", "ă": "a", "ắ": "a", "ặ": "a", "ằ": "a", "ẳ": "a", "ẵ": "a", "ǎ": "a", "â": "a", "ấ": "a", "ậ": "a", "ầ": "a", "ẩ": "a", "ẫ": "a", "ä": "a", "ǟ": "a", "ȧ": "a", "ǡ": "a", "ạ": "a", "ȁ": "a", "à": "a", "ả": "a", "ȃ": "a", "ā": "a", "ą": "a", "ᶏ": "a", "ẚ": "a", "å": "a", "ǻ": "a", "ḁ": "a", "ⱥ": "a", "ã": "a", "ꜳ": "aa", "æ": "ae", "ǽ": "ae", "ǣ": "ae", "ꜵ": "ao", "ꜷ": "au", "ꜹ": "av", "ꜻ": "av", "ꜽ": "ay", "ḃ": "b", "ḅ": "b", "ɓ": "b", "ḇ": "b", "ᵬ": "b", "ᶀ": "b", "ƀ": "b", "ƃ": "b", "ɵ": "o", "ć": "c", "č": "c", "ç": "c", "ḉ": "c", "ĉ": "c", "ɕ": "c", "ċ": "c", "ƈ": "c", "ȼ": "c", "ď": "d", "ḑ": "d", "ḓ": "d", "ȡ": "d", "ḋ": "d", "ḍ": "d", "ɗ": "d", "ᶑ": "d", "ḏ": "d", "ᵭ": "d", "ᶁ": "d", "đ": "d", "ɖ": "d", "ƌ": "d", "ı": "i", "ȷ": "j", "ɟ": "j", "ʄ": "j", "ǳ": "dz", "ǆ": "dz", "é": "e", "ĕ": "e", "ě": "e", "ȩ": "e", "ḝ": "e", "ê": "e", "ế": "e", "ệ": "e", "ề": "e", "ể": "e", "ễ": "e", "ḙ": "e", "ë": "e", "ė": "e", "ẹ": "e", "ȅ": "e", "è": "e", "ẻ": "e", "ȇ": "e", "ē": "e", "ḗ": "e", "ḕ": "e", "ⱸ": "e", "ę": "e", "ᶒ": "e", "ɇ": "e", "ẽ": "e", "ḛ": "e", "ꝫ": "et", "ḟ": "f", "ƒ": "f", "ᵮ": "f", "ᶂ": "f", "ǵ": "g", "ğ": "g", "ǧ": "g", "ģ": "g", "ĝ": "g", "ġ": "g", "ɠ": "g", "ḡ": "g", "ᶃ": "g", "ǥ": "g", "ḫ": "h", "ȟ": "h", "ḩ": "h", "ĥ": "h", "ⱨ": "h", "ḧ": "h", "ḣ": "h", "ḥ": "h", "ɦ": "h", "ẖ": "h", "ħ": "h", "ƕ": "hv", "í": "i", "ĭ": "i", "ǐ": "i", "î": "i", "ï": "i", "ḯ": "i", "ị": "i", "ȉ": "i", "ì": "i", "ỉ": "i", "ȋ": "i", "ī": "i", "į": "i", "ᶖ": "i", "ɨ": "i", "ĩ": "i", "ḭ": "i", "ꝺ": "d", "ꝼ": "f", "ᵹ": "g", "ꞃ": "r", "ꞅ": "s", "ꞇ": "t", "ꝭ": "is", "ǰ": "j", "ĵ": "j", "ʝ": "j", "ɉ": "j", "ḱ": "k", "ǩ": "k", "ķ": "k", "ⱪ": "k", "ꝃ": "k", "ḳ": "k", "ƙ": "k", "ḵ": "k", "ᶄ": "k", "ꝁ": "k", "ꝅ": "k", "ĺ": "l", "ƚ": "l", "ɬ": "l", "ľ": "l", "ļ": "l", "ḽ": "l", "ȴ": "l", "ḷ": "l", "ḹ": "l", "ⱡ": "l", "ꝉ": "l", "ḻ": "l", "ŀ": "l", "ɫ": "l", "ᶅ": "l", "ɭ": "l", "ł": "l", "ǉ": "lj", "ſ": "s", "ẜ": "s", "ẛ": "s", "ẝ": "s", "ḿ": "m", "ṁ": "m", "ṃ": "m", "ɱ": "m", "ᵯ": "m", "ᶆ": "m", "ń": "n", "ň": "n", "ņ": "n", "ṋ": "n", "ȵ": "n", "ṅ": "n", "ṇ": "n", "ǹ": "n", "ɲ": "n", "ṉ": "n", "ƞ": "n", "ᵰ": "n", "ᶇ": "n", "ɳ": "n", "ñ": "n", "ǌ": "nj", "ó": "o", "ŏ": "o", "ǒ": "o", "ô": "o", "ố": "o", "ộ": "o", "ồ": "o", "ổ": "o", "ỗ": "o", "ö": "o", "ȫ": "o", "ȯ": "o", "ȱ": "o", "ọ": "o", "ő": "o", "ȍ": "o", "ò": "o", "ỏ": "o", "ơ": "o", "ớ": "o", "ợ": "o", "ờ": "o", "ở": "o", "ỡ": "o", "ȏ": "o", "ꝋ": "o", "ꝍ": "o", "ⱺ": "o", "ō": "o", "ṓ": "o", "ṑ": "o", "ǫ": "o", "ǭ": "o", "ø": "o", "ǿ": "o", "õ": "o", "ṍ": "o", "ṏ": "o", "ȭ": "o", "ƣ": "oi", "ꝏ": "oo", "ɛ": "e", "ᶓ": "e", "ɔ": "o", "ᶗ": "o", "ȣ": "ou", "ṕ": "p", "ṗ": "p", "ꝓ": "p", "ƥ": "p", "ᵱ": "p", "ᶈ": "p", "ꝕ": "p", "ᵽ": "p", "ꝑ": "p", "ꝙ": "q", "ʠ": "q", "ɋ": "q", "ꝗ": "q", "ŕ": "r", "ř": "r", "ŗ": "r", "ṙ": "r", "ṛ": "r", "ṝ": "r", "ȑ": "r", "ɾ": "r", "ᵳ": "r", "ȓ": "r", "ṟ": "r", "ɼ": "r", "ᵲ": "r", "ᶉ": "r", "ɍ": "r", "ɽ": "r", "ↄ": "c", "ꜿ": "c", "ɘ": "e", "ɿ": "r", "ś": "s", "ṥ": "s", "š": "s", "ṧ": "s", "ş": "s", "ŝ": "s", "ș": "s", "ṡ": "s", "ṣ": "s", "ṩ": "s", "ʂ": "s", "ᵴ": "s", "ᶊ": "s", "ȿ": "s", "ɡ": "g", "ᴑ": "o", "ᴓ": "o", "ᴝ": "u", "ť": "t", "ţ": "t", "ṱ": "t", "ț": "t", "ȶ": "t", "ẗ": "t", "ⱦ": "t", "ṫ": "t", "ṭ": "t", "ƭ": "t", "ṯ": "t", "ᵵ": "t", "ƫ": "t", "ʈ": "t", "ŧ": "t", "ᵺ": "th", "ɐ": "a", "ᴂ": "ae", "ǝ": "e", "ᵷ": "g", "ɥ": "h", "ʮ": "h", "ʯ": "h", "ᴉ": "i", "ʞ": "k", "ꞁ": "l", "ɯ": "m", "ɰ": "m", "ᴔ": "oe", "ɹ": "r", "ɻ": "r", "ɺ": "r", "ⱹ": "r", "ʇ": "t", "ʌ": "v", "ʍ": "w", "ʎ": "y", "ꜩ": "tz", "ú": "u", "ŭ": "u", "ǔ": "u", "û": "u", "ṷ": "u", "ü": "u", "ǘ": "u", "ǚ": "u", "ǜ": "u", "ǖ": "u", "ṳ": "u", "ụ": "u", "ű": "u", "ȕ": "u", "ù": "u", "ủ": "u", "ư": "u", "ứ": "u", "ự": "u", "ừ": "u", "ử": "u", "ữ": "u", "ȗ": "u", "ū": "u", "ṻ": "u", "ų": "u", "ᶙ": "u", "ů": "u", "ũ": "u", "ṹ": "u", "ṵ": "u", "ᵫ": "ue", "ꝸ": "um", "ⱴ": "v", "ꝟ": "v", "ṿ": "v", "ʋ": "v", "ᶌ": "v", "ⱱ": "v", "ṽ": "v", "ꝡ": "vy", "ẃ": "w", "ŵ": "w", "ẅ": "w", "ẇ": "w", "ẉ": "w", "ẁ": "w", "ⱳ": "w", "ẘ": "w", "ẍ": "x", "ẋ": "x", "ᶍ": "x", "ý": "y", "ŷ": "y", "ÿ": "y", "ẏ": "y", "ỵ": "y", "ỳ": "y", "ƴ": "y", "ỷ": "y", "ỿ": "y", "ȳ": "y", "ẙ": "y", "ɏ": "y", "ỹ": "y", "ź": "z", "ž": "z", "ẑ": "z", "ʑ": "z", "ⱬ": "z", "ż": "z", "ẓ": "z", "ȥ": "z", "ẕ": "z", "ᵶ": "z", "ᶎ": "z", "ʐ": "z", "ƶ": "z", "ɀ": "z", "ﬀ": "ff", "ﬃ": "ffi", "ﬄ": "ffl", "ﬁ": "fi", "ﬂ": "fl", "ĳ": "ij", "œ": "oe", "ﬆ": "st", "ₐ": "a", "ₑ": "e", "ᵢ": "i", "ⱼ": "j", "ₒ": "o", "ᵣ": "r", "ᵤ": "u", "ᵥ": "v", "ₓ": "x"
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



