#pragma once
#include <vector>

class MIDI_Driver {
public:
    static void Initialize();
    static bool IsInitialized();
    static void UpdateDeviceList();

private:
    static void ProcessMessage(double timestamp, void* port, const std::vector<uint8_t>& message);
};