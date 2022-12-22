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

static RtMidiIn* s_TestDeviceIn   = nullptr;
static RtMidiOut* s_TestDeviceOut = nullptr;

static std::unordered_map<QString, int> s_MIDI_InputDeviceIndexMap;
static std::unordered_map<QString, int> s_MIDI_OutputDeviceIndexMap;
////////////////////////////////////////////////////////////////////////

void MIDI_Driver::Initialize() {
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
uint8_t s_LogoMap = 99;
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
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// void MIDI_Driver::TestFunction() {
//     // Input
//     auto inDevIt = s_MIDI_InputDeviceIndexMap.find("MIDIIN2 (LPX MIDI)");
//     if (inDevIt != s_MIDI_InputDeviceIndexMap.end()) {
//         auto portIndex = (*inDevIt).second;

//         try {
//             s_TestDeviceIn = new RtMidiIn;
//         } catch (const RtMidiError& err) {
//             LOG_ERROR("MIDI input test device initialization failed: {}", err.what());
//             return;
//         }

//         s_TestDeviceIn->setBufferSize(MIDI_BUFFER_SIZE, MIDI_BUFFER_COUNT);
//         s_TestDeviceIn->ignoreTypes(false, false, true);
//         s_TestDeviceIn->openPort(portIndex);
//         if (!s_TestDeviceIn->isPortOpen()) {
//             LOG_ERROR("Input device port open failed");
//             return;
//         }
//         s_TestDeviceIn->setCallback(
//             [](double timestamp, std::vector<uint8_t>* message, void* dis) {
//                 ProcessMessage(timestamp, dis, *message);
//             },
//             s_TestDeviceIn);

//         LOG_TRACE("Input test device input initialized");
//     } else {
//         LOG_ERROR("Input test device not found");
//     }

//     // Output
//     auto outDevIt = s_MIDI_OutputDeviceIndexMap.find("MIDIOUT2 (LPX MIDI)");
//     if (outDevIt != s_MIDI_OutputDeviceIndexMap.end()) {
//         auto portIndex = (*outDevIt).second;

//         try {
//             s_TestDeviceOut = new RtMidiOut;
//         } catch (const RtMidiError& err) {
//             LOG_ERROR("MIDI output test device initialization failed: {}", err.what());
//             return;
//         }

//         s_TestDeviceOut->openPort(portIndex);
//         if (!s_TestDeviceOut->isPortOpen()) {
//             LOG_ERROR("Output device port open failed");
//             return;
//         }
//         LOG_TRACE("Output test device input initialized");
//     } else {
//         LOG_ERROR("Output test device not found");
//     }

//     try {
//         std::vector<uint8_t> tmp;
//         s_TestDeviceOut->sendMessage(&msg_SetMode(tmp, true));
//         s_TestDeviceOut->sendMessage(&msg_SetBrightness(tmp, 1.0f));
//     } catch (const RtMidiError& err) {
//         LOG_ERROR(err.what());
//     }

//     static std::vector<uint8_t> tmp;
//     for (int y = 0; y < 8; y++) {
//         for (int x = 0; x < 8; x++) {
//             s_TestDeviceOut->sendMessage(&msg_SetRGB(tmp, s_GridMap[x][y], 0, 0, 0));
//         }
//     }

//     for (int i = 0; i < 8; i++) {
//         s_TestDeviceOut->sendMessage(&msg_SetRGB(tmp, s_HorizontalBarMap[i], 0, 0, 0));
//         s_TestDeviceOut->sendMessage(&msg_SetRGB(tmp, s_VerticalBarMap[i], 0, 0, 0));
//     }
//     s_TestDeviceOut->sendMessage(&msg_SetRGB(tmp, s_LogoMap, 0, 0, 0));

//     // auto timer = new QTimer;
//     // QObject::connect(timer, &QTimer::timeout, [=]() {
//     //     if (effect) {
//     //         std::vector<uint8_t> vec = {0xF0, 0x00, 0x20, 0x29, 0x02, 0x0C, 0x03};
//     //         for (int i = 0; i < 64; i++) {
//     //             uint8_t v  = (effect->GetOutputRef()[i] * 127);
//     //             uint8_t vx = (effect->GetOutputRef()[63 - i] * 127);
//     //             vec.push_back(0x03);
//     //             vec.push_back(s_GridMap[0][i]);
//     //             vec.push_back(v);
//     //             vec.push_back(0);
//     //             vec.push_back(vx);
//     //             if (i == 63) {
//     //                 std::vector<uint8_t> vecx;
//     //                 s_TestDeviceOut->sendMessage(&msg_SetRGB(vecx, s_LogoMap, v, 0, vx));
//     //             }
//     //         }
//     //         vec.push_back(0xF7);
//     //         //s_TestDeviceOut->sendMessage(&vec);
//     //     }
//     // });
//     // timer->start(1000 / 43);
// }

static QString MessageToString(const std::vector<uint8_t>& msg) {
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

void MIDI_Driver::ProcessMessage(double timestamp, void* port, const std::vector<uint8_t>& message) {
    static std::vector<uint8_t> tmp;
    LOG_TRACE("RX {} [{}]", message.size(), MessageToString(message));

    if (message.size() == 3 && (message[0] == 0x90 || message[0] == 0xB0)) {
        bool press    = message[2] != 0;
        uint8_t power = message[2];
        uint8_t pad   = message[1];

        if (press) {
            if (power > 64)
                s_TestDeviceOut->sendMessage(&msg_SetRGB(tmp, pad, 1, 1, 1));
            else
                s_TestDeviceOut->sendMessage(&msg_SetRGB(tmp, pad, 1, 0, 0));
        }
    }
}
