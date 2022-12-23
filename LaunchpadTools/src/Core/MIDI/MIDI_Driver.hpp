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

    static void SetBrightness(float b);
    static void SetToggleMode(int note, bool state);
    static void
    SetColorConfig(int midi_index, float r_a, float g_a, float b_a, float r_b, float g_b, float b_b, const QString& mode, bool off_solid);

    static std::unordered_map<int, Device>& GetInputDevices() {
        return s_MIDI_InputDevices;
    }
    static std::unordered_map<int, Device>& GetOutputDevices() {
        return s_MIDI_OutputDevices;
    }

    static QString SetLaunchIn(int portIndex);
    static QString SetLaunchOut(int portIndex);
    static QString SetMainOut(int portIndex);

    static std::function<void(uint8_t pad, uint8_t power)> s_NoteOnCallback;
    static std::function<void(uint8_t pad, uint8_t power)> s_NoteOffCallback;

private:
    static void LaunchIn_ProcessMessage(double timestamp, void* port, const std::vector<uint8_t>& message);

private:
    static std::unordered_map<QString, int> s_MIDI_InputDeviceIndexMap;
    static std::unordered_map<QString, int> s_MIDI_OutputDeviceIndexMap;
    static std::unordered_map<int, Device> s_MIDI_InputDevices;
    static std::unordered_map<int, Device> s_MIDI_OutputDevices;
};