#include "MIDI_Driver.hpp"
#include <RtMidi/RtMidi.h>
#include <unordered_map>
#include <QTimer>
#include <QString>

////////////////////////////////////////////////////////////////////////
static constexpr auto MIDI_BUFFER_SIZE  = 1024 * 8;
static constexpr auto MIDI_BUFFER_COUNT = 8;
////////////////////////////////////////////////////////////////////////
static bool s_Initialized    = false;
static RtMidiIn* s_MIDI_In   = nullptr;
static RtMidiOut* s_MIDI_Out = nullptr;

static RtMidiIn* s_LaunchIn   = nullptr;
static RtMidiOut* s_LaunchOut = nullptr;
static RtMidiOut* s_MainOut   = nullptr;
static int s_IndexLaunchOut   = -1;
static int s_IndexMainOut     = -1;

std::unordered_map<QString, int> MIDI_Driver::s_MIDI_InputDeviceIndexMap;
std::unordered_map<QString, int> MIDI_Driver::s_MIDI_OutputDeviceIndexMap;
std::unordered_map<int, MIDI_Driver::Device> MIDI_Driver::s_MIDI_InputDevices;
std::unordered_map<int, MIDI_Driver::Device> MIDI_Driver::s_MIDI_OutputDevices;
std::function<void(uint8_t pad, uint8_t power)> MIDI_Driver::s_NoteOnCallback;
std::function<void(uint8_t pad, uint8_t power)> MIDI_Driver::s_NoteOffCallback;

#define LED_SOLID 0
#define LED_PULSE 1
#define LED_FLASH 2
struct PadConfig {
    bool toggleMode = false;
    bool state      = false;
    uint8_t power   = 0;
    int led_mode    = LED_SOLID;
    bool off_solid  = true;
    float r_a       = 1;
    float g_a       = 1;
    float b_a       = 1;
    float r_b       = 0;
    float g_b       = 0;
    float b_b       = 0;
    uint8_t p1      = 0;
    uint8_t p2      = 0;
    int palette_on  = 3;
    int palette_off = 0;
};
std::unordered_map<int, PadConfig> s_PadConfig;
////////////////////////////////////////////////////////////////////////

void MIDI_Driver::Initialize() {
    for (int i = 0; i < 256; i++) {
        s_PadConfig[i] = {};
    }

    if (IsInitialized()) {
        LOG_WARN("Already initialized");
        return;
    }

    LOG_INFO("Initialize MIDI Driver");

    try {
        s_MIDI_In     = new RtMidiIn;
        s_MIDI_Out    = new RtMidiOut;
        s_Initialized = true;
    } catch (const RtMidiError& err) {
        LOG_ERROR("MIDI initialization failed: {}", err.what());
        s_Initialized = false;
        return;
    }

    UpdateDeviceList();

    LOG_TRACE("MIDI Driver initialized");
}

bool MIDI_Driver::IsInitialized() {
    return s_Initialized;
}

void MIDI_Driver::UpdateDeviceList() {
    if (!IsInitialized()) {
        LOG_WARN("Not updating device list - not initialized");
        return;
    }

    int inputCount  = s_MIDI_In->getPortCount();
    int outputCount = s_MIDI_Out->getPortCount();

    // Input list
    if (inputCount) {
        LOG_TRACE("MIDI input devices:");
        s_MIDI_InputDeviceIndexMap.clear();
        for (int i = 0; i < inputCount; i++) {
            try {
                auto portName                        = QString::fromStdString(s_MIDI_In->getPortName(i));
                s_MIDI_InputDeviceIndexMap[portName] = i;
                s_MIDI_InputDevices[i]               = {i, portName};
                LOG_TRACE(" - [{}] {}", i, portName);
            } catch (const RtMidiError& err) {
                LOG_ERROR("Failed to get MIDI input device #{} info: {}", i, err.what());
            }
        }
    } else {
        LOG_TRACE("No MIDI input devices found");
    }

    // Output list
    if (outputCount) {
        LOG_TRACE("MIDI output devices:");
        s_MIDI_OutputDeviceIndexMap.clear();
        for (int i = 0; i < outputCount; i++) {
            try {
                auto portName                         = QString::fromStdString(s_MIDI_Out->getPortName(i));
                s_MIDI_OutputDeviceIndexMap[portName] = i;
                s_MIDI_OutputDevices[i]               = {i, portName};
                LOG_TRACE(" - [{}] {}", i, portName);
            } catch (const RtMidiError& err) {
                LOG_ERROR("Failed to get MIDI output device #{} info: {}", i, err.what());
            }
        }
    } else {
        LOG_TRACE("No MIDI output devices found");
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
uint8_t s_HorizontalBarMap[] = {91, 92, 93, 94, 95, 96, 97, 98};
uint8_t s_VerticalBarMap[]   = {89, 79, 69, 59, 49, 39, 29, 19};
uint8_t s_GridMap[8][8]      = {
    {81, 82, 83, 84, 85, 86, 87, 88},
    {71, 72, 73, 74, 75, 76, 77, 78},
    {61, 62, 63, 64, 65, 66, 67, 68},
    {51, 52, 53, 54, 55, 56, 57, 58},
    {41, 42, 43, 44, 45, 46, 47, 48},
    {31, 32, 33, 34, 35, 36, 37, 38},
    {21, 22, 23, 24, 25, 26, 27, 28},
    {11, 12, 13, 14, 15, 16, 17, 18},
};
uint8_t s_FirstPad = 11;
uint8_t s_LogoMap  = 99;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
[[maybe_unused]] static const std::vector<uint8_t>& msg_SetMode(std::vector<uint8_t>& vec, bool programmer) {
    return vec = {0xF0, 0x00, 0x20, 0x29, 0x02, 0x0C, 0x0E, (uint8_t)(programmer ? 0x01 : 0x00), 0xF7};
}

[[maybe_unused]] static const std::vector<uint8_t>& msg_SetBrightness(std::vector<uint8_t>& vec, float brightness) {
    return vec = {0xF0, 0x00, 0x20, 0x29, 0x02, 0x0C, 0x08, (uint8_t)(127 * brightness), 0xF7};
}

[[maybe_unused]] static const std::vector<uint8_t>& msg_SetRGB(std::vector<uint8_t>& vec, uint8_t index, float r, float g, float b) {
    return vec = {0xF0, 0x00, 0x20, 0x29, 0x02, 0x0C, 0x03, 0x03, index, (uint8_t)(127 * r), (uint8_t)(127 * g), (uint8_t)(127 * b), 0xF7};
}

[[maybe_unused]] static const std::vector<uint8_t>& msg_SetFlash(std::vector<uint8_t>& vec, uint8_t index, uint8_t a, uint8_t b) {
    return vec = {0xF0, 0x00, 0x20, 0x29, 0x02, 0x0C, 0x03, 0x01, index, a, b, 0xF7};
}

[[maybe_unused]] static const std::vector<uint8_t>& msg_SetPulse(std::vector<uint8_t>& vec, uint8_t index, uint8_t a) {
    return vec = {0xF0, 0x00, 0x20, 0x29, 0x02, 0x0C, 0x03, 0x02, index, a, 0xF7};
}

[[maybe_unused]] static void msg_InitMultiRGB(std::vector<uint8_t>& vec) {
    vec = {0xF0, 0x00, 0x20, 0x29, 0x02, 0x0C, 0x03};
}
[[maybe_unused]] static void msg_AddMultiRGB(std::vector<uint8_t>& vec, uint8_t index, float r, float g, float b) {
    vec.push_back(0x03);
    vec.push_back(index);
    vec.push_back((uint8_t)(127 * r));
    vec.push_back((uint8_t)(127 * g));
    vec.push_back((uint8_t)(127 * b));
}
[[maybe_unused]] static void msg_EndMultiRGB(std::vector<uint8_t>& vec) {
    vec.push_back(0xF7);
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

static void UpdateIndicator() {
    if (!s_LaunchOut)
        return;
    std::vector<uint8_t> tmp;
    float r, g, b;

    if (s_MainOut && s_LaunchIn) {
        r = 0;
        g = 0.5;
        b = 0;
    } else if (s_MainOut) {
        r = 1;
        g = 1;
        b = 0;
    } else if (s_LaunchIn) {
        r = 1;
        g = 0.5;
        b = 0;
    } else {
        r = 1;
        g = 0;
        b = 0;
    }

    s_LaunchOut->sendMessage(&msg_SetRGB(tmp, s_LogoMap, r, g, b));
}

QString MIDI_Driver::SetLaunchIn(int portIndex) {
    if (s_LaunchIn) {
        s_LaunchIn->cancelCallback();
        try {
            s_LaunchIn->closePort();
        } catch (const std::exception&) {
        }
        delete s_LaunchIn;
        s_LaunchIn = nullptr;
    }

    try {
        s_LaunchIn = new RtMidiIn;
    } catch (const RtMidiError& err) {
        s_LaunchIn = nullptr;
        UpdateIndicator();
        return QString("Initialization failed: ") + QString(err.what());
    }

    s_LaunchIn->setBufferSize(MIDI_BUFFER_SIZE, MIDI_BUFFER_COUNT);
    s_LaunchIn->ignoreTypes(false, false, true);
    s_LaunchIn->openPort(portIndex);
    if (!s_LaunchIn->isPortOpen()) {
        return "Open port failed";
    }
    s_LaunchIn->setCallback(
        [](double timestamp, std::vector<uint8_t>* message, void* dis) {
            LaunchIn_ProcessMessage(timestamp, dis, *message);
        },
        s_LaunchIn);

    UpdateIndicator();
    return "";
}

void MIDI_Driver::SetBrightness(float b) {
    if (s_LaunchOut) {
        std::vector<uint8_t> tmp;
        s_LaunchOut->sendMessage(&msg_SetBrightness(tmp, b));
    }
}

void MIDI_Driver::SetToggleMode(int note, bool state) {
    s_PadConfig[note].toggleMode = state;
}

void MIDI_Driver::SetColorConfig(int midi_index,
                                 float r_a,
                                 float g_a,
                                 float b_a,
                                 float r_b,
                                 float g_b,
                                 float b_b,
                                 const QString& mode,
                                 bool off_solid,
                                 int palette_on,
                                 int palette_off) {
    s_PadConfig[midi_index].r_a         = r_a;
    s_PadConfig[midi_index].g_a         = g_a;
    s_PadConfig[midi_index].b_a         = b_a;
    s_PadConfig[midi_index].r_b         = r_b;
    s_PadConfig[midi_index].g_b         = g_b;
    s_PadConfig[midi_index].b_b         = b_b;
    s_PadConfig[midi_index].off_solid   = off_solid;
    s_PadConfig[midi_index].palette_on  = palette_on;
    s_PadConfig[midi_index].palette_off = palette_off;
    if (mode == "flash") {
        s_PadConfig[midi_index].led_mode = LED_FLASH;
    } else if (mode == "pulse") {
        s_PadConfig[midi_index].led_mode = LED_PULSE;
    } else {
        s_PadConfig[midi_index].led_mode = LED_SOLID;
    }

    if (!s_LaunchOut)
        return;

    auto& pcfg = s_PadConfig[midi_index];
    std::vector<uint8_t> tmp;
    if (pcfg.state) {
        switch (pcfg.led_mode) {
            case LED_SOLID: s_LaunchOut->sendMessage(&msg_SetRGB(tmp, midi_index, pcfg.r_a, pcfg.g_a, pcfg.b_a)); break;
            case LED_PULSE: s_LaunchOut->sendMessage(&msg_SetPulse(tmp, midi_index, pcfg.palette_on)); break;
            case LED_FLASH: s_LaunchOut->sendMessage(&msg_SetFlash(tmp, midi_index, pcfg.palette_on, pcfg.palette_off)); break;
        }
    } else {
        if (pcfg.off_solid) {
            s_LaunchOut->sendMessage(&msg_SetRGB(tmp, midi_index, pcfg.r_b, pcfg.g_b, pcfg.b_b));
        } else {
            switch (pcfg.led_mode) {
                case LED_SOLID: s_LaunchOut->sendMessage(&msg_SetRGB(tmp, midi_index, pcfg.r_b, pcfg.g_b, pcfg.b_b)); break;
                case LED_PULSE: s_LaunchOut->sendMessage(&msg_SetPulse(tmp, midi_index, pcfg.palette_off)); break;
                case LED_FLASH: s_LaunchOut->sendMessage(&msg_SetFlash(tmp, midi_index, pcfg.palette_on, pcfg.palette_off)); break;
            }
        }
    }
}

QString MIDI_Driver::SetLaunchOut(int portIndex) {
    if (s_MainOut && s_IndexMainOut == portIndex) {
        try {
            s_MainOut->closePort();
        } catch (const std::exception&) {
        }
        delete s_MainOut;
        s_MainOut = nullptr;
    }
    if (s_LaunchOut) {
        try {
            std::vector<uint8_t> tmp;
            s_LaunchOut->sendMessage(&msg_SetFlash(tmp, s_LogoMap, 0x05, 0x00)); // Red/Black palette
            s_LaunchOut->closePort();
        } catch (const std::exception&) {
        }
        delete s_LaunchOut;
        s_LaunchOut = nullptr;
    }

    try {
        s_LaunchOut = new RtMidiOut;
    } catch (const RtMidiError& err) {
        s_LaunchOut = nullptr;
        UpdateIndicator();
        return QString("Initialization failed: ") + QString(err.what());
    }

    s_LaunchOut->openPort(portIndex);
    if (!s_LaunchOut->isPortOpen()) {
        return "Open port failed";
    }

    try {
        std::vector<uint8_t> tmp;
        s_LaunchOut->sendMessage(&msg_SetMode(tmp, true));
        s_LaunchOut->sendMessage(&msg_SetBrightness(tmp, 1.0f));
        {
            msg_InitMultiRGB(tmp);
            for (int x = 0; x < 8; x++) {
                for (int y = 0; y < 8; y++) {
                    msg_AddMultiRGB(tmp, s_GridMap[x][y], 0, 0, 0);
                }
            }
            msg_EndMultiRGB(tmp);
            s_LaunchOut->sendMessage(&tmp);
        }
        {
            msg_InitMultiRGB(tmp);
            for (int i = 0; i < 8; i++) {
                msg_AddMultiRGB(tmp, s_VerticalBarMap[i], 0, 0, 0);
                msg_AddMultiRGB(tmp, s_HorizontalBarMap[i], 0, 0, 0);
            }
            msg_EndMultiRGB(tmp);
            s_LaunchOut->sendMessage(&tmp);
        }

        for (int midi_index = 11; midi_index < 11 + 64 + 16; midi_index++) {
            auto& pcfg = s_PadConfig[midi_index];
            if (pcfg.state) {
                switch (pcfg.led_mode) {
                    case LED_SOLID: s_LaunchOut->sendMessage(&msg_SetRGB(tmp, midi_index, pcfg.r_a, pcfg.g_a, pcfg.b_a)); break;
                }
            } else {
                if (pcfg.off_solid) {
                    s_LaunchOut->sendMessage(&msg_SetRGB(tmp, midi_index, pcfg.r_b, pcfg.g_b, pcfg.b_b));
                } else {
                    switch (pcfg.led_mode) {
                        case LED_SOLID: s_LaunchOut->sendMessage(&msg_SetRGB(tmp, midi_index, pcfg.r_b, pcfg.g_b, pcfg.b_b)); break;
                    }
                }
            }
        }
    } catch (const RtMidiError& err) {
        return QString("Failed to initialize Launchpad settings\n") + QString(err.what());
    }

    s_IndexLaunchOut = portIndex;
    UpdateIndicator();
    return "";
}

QString MIDI_Driver::SetMainOut(int portIndex) {
    if (s_MainOut) {
        try {
            s_MainOut->closePort();
        } catch (const std::exception&) {
        }
        delete s_MainOut;
        s_MainOut = nullptr;
    }
    if (s_LaunchOut && s_IndexLaunchOut == portIndex) {
        try {
            std::vector<uint8_t> tmp;
            s_LaunchOut->sendMessage(&msg_SetFlash(tmp, s_LogoMap, 0x05, 0x00)); // Red/Black palette
            s_LaunchOut->closePort();
        } catch (const std::exception&) {
        }
        delete s_LaunchOut;
        s_LaunchOut = nullptr;
    }

    try {
        s_MainOut = new RtMidiOut;
    } catch (const RtMidiError& err) {
        s_MainOut = nullptr;
        UpdateIndicator();
        return QString("Initialization failed: ") + QString(err.what());
    }

    s_MainOut->openPort(portIndex);
    if (!s_MainOut->isPortOpen()) {
        return "Open port failed";
    }

    s_IndexMainOut = portIndex;
    UpdateIndicator();
    return "";
}

[[maybe_unused]] static QString MessageToString(const std::vector<uint8_t>& msg) {
    QString res = "";
    for (auto b : msg) {
        char tmp[8];
        snprintf(tmp, 8, "%02X ", b);
        res += tmp;
    }
    if (res.length())
        res.chop(1);
    return res;
}

void MIDI_Driver::LaunchIn_ProcessMessage(double timestamp, void* port, const std::vector<uint8_t>& const_message) {
    if (!s_LaunchOut)
        return;

    static std::vector<uint8_t> tmp;

    if (const_message.size() == 3 && (const_message[0] == 0x90 || const_message[0] == 0xB0)) {
        auto message = const_message;
        if (message[0] == 0xB0)
            message[0] = 0x90;
        // LOG_TRACE("RX {} [{}]", message.size(), MessageToString(message));

        bool press    = message[2] != 0;
        uint8_t power = message[2];
        uint8_t pad   = message[1];

        auto& pcfg  = s_PadConfig[pad];
        auto SetLED = [&](bool state) {
            if (state) {
                switch (pcfg.led_mode) {
                    case LED_SOLID: s_LaunchOut->sendMessage(&msg_SetRGB(tmp, pad, pcfg.r_a, pcfg.g_a, pcfg.b_a)); break;
                    case LED_PULSE: s_LaunchOut->sendMessage(&msg_SetPulse(tmp, pad, pcfg.palette_on)); break;
                    case LED_FLASH: s_LaunchOut->sendMessage(&msg_SetFlash(tmp, pad, pcfg.palette_on, pcfg.palette_off)); break;
                }
            } else {
                if (pcfg.off_solid) {
                    s_LaunchOut->sendMessage(&msg_SetRGB(tmp, pad, pcfg.r_b, pcfg.g_b, pcfg.b_b));
                } else {
                    switch (pcfg.led_mode) {
                        case LED_SOLID: s_LaunchOut->sendMessage(&msg_SetRGB(tmp, pad, pcfg.r_b, pcfg.g_b, pcfg.b_b)); break;
                        case LED_PULSE: s_LaunchOut->sendMessage(&msg_SetPulse(tmp, pad, pcfg.palette_off)); break;
                        case LED_FLASH: s_LaunchOut->sendMessage(&msg_SetFlash(tmp, pad, pcfg.palette_on, pcfg.palette_off)); break;
                    }
                }
            }
        };
        if (pcfg.toggleMode) {
            if (press) {
                pcfg.state = !pcfg.state;
                if (pcfg.state) {
                    if (s_MainOut)
                        s_MainOut->sendMessage(&message);
                    SetLED(true);
                    if (s_NoteOnCallback)
                        s_NoteOnCallback(pad, 127);
                } else {
                    std::vector<uint8_t> msgCopy = message;
                    msgCopy[2]                   = 0;
                    if (s_MainOut)
                        s_MainOut->sendMessage(&msgCopy);
                    SetLED(false);
                    if (s_NoteOffCallback)
                        s_NoteOffCallback(pad, 0);
                }
            }
        } else {
            if (s_MainOut)
                s_MainOut->sendMessage(&message);
            if (press) {
                SetLED(true);
                if (s_NoteOnCallback)
                    s_NoteOnCallback(pad, power);
            } else {
                SetLED(false);
                if (s_NoteOffCallback)
                    s_NoteOffCallback(pad, 0);
            }
        }
    }
}
