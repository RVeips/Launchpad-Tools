#pragma once
#include <vector>
#include <unordered_map>
#include <QString>
#include <RtMidi/RtMidi.h>

class MIDI_Driver {
public:
    struct Device {
        int index;
        QString name;
        QString lastError   = "";
        bool is_lp_input    = false;
        bool is_lp_output   = false;
        bool is_main_output = false;
    };

public:
    static void Initialize();
    static bool IsInitialized();
    static void UpdateDeviceList();

    static std::unordered_map<int, Device>& GetInputDevices() {
        return s_MIDI_InputDevices;
    }
    static std::unordered_map<int, Device>& GetOutputDevices() {
        return s_MIDI_OutputDevices;
    }

    static QString SetLaunchIn(int portIndex);
    static QString SetLaunchOut(int portIndex);
    static QString SetMainOut(int portIndex);

private:
    static void LaunchIn_ProcessMessage(double timestamp, void* port, const std::vector<uint8_t>& message);

private:
    static std::unordered_map<QString, int> s_MIDI_InputDeviceIndexMap;
    static std::unordered_map<QString, int> s_MIDI_OutputDeviceIndexMap;
    static std::unordered_map<int, Device> s_MIDI_InputDevices;
    static std::unordered_map<int, Device> s_MIDI_OutputDevices;
};