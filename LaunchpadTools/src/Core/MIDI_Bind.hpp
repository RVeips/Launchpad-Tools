#include <QObject>
#include <QJsonObject>
#include <QJsonArray>
#include <Core/MIDI/MIDI_Driver.hpp>

class MIDI_Bind : public QObject {
    Q_OBJECT
    Q_PROPERTY(QJsonArray deviceList MEMBER m_DeviceList NOTIFY deviceListUpdated)

public:
    MIDI_Bind(QObject* parent = nullptr) : QObject(parent) {
    }
    virtual ~MIDI_Bind() = default;

    void UpdateDeviceList() {
        m_DeviceList = QJsonArray{};

        for (auto& d : MIDI_Driver::GetInputDevices()) {
            QJsonObject obj;
            obj["name"]        = d.second.name;
            obj["index"]       = d.first;
            obj["type"]        = "in";
            obj["is_lpin"]     = d.second.is_lp_input;
            obj["is_lpout"]    = false;
            obj["is_mainout"]  = false;
            obj["lastError"]   = d.second.lastError;
            d.second.lastError = "";
            m_DeviceList.append(obj);
        }
        for (auto& d : MIDI_Driver::GetOutputDevices()) {
            QJsonObject obj;
            obj["name"]        = d.second.name;
            obj["index"]       = d.first;
            obj["type"]        = "out";
            obj["is_lpin"]     = false;
            obj["is_lpout"]    = d.second.is_lp_output;
            obj["is_mainout"]  = d.second.is_main_output;
            obj["lastError"]   = d.second.lastError;
            d.second.lastError = "";
            m_DeviceList.append(obj);
        }

        emit deviceListUpdated(m_DeviceList);
    }

public slots:
    void SelectEvent(const QString dir, int idx, const QString& type) {
        MIDI_Driver::Device* dev;
        if (dir == "in") {
            dev = &MIDI_Driver::GetInputDevices()[idx];
            if (type != "lpin")
                return;
        } else {
            dev = &MIDI_Driver::GetOutputDevices()[idx];
            if (type == "lpin")
                return;
        }

        if (type == "lpin") {
            for (auto& d : MIDI_Driver::GetInputDevices()) {
                d.second.is_lp_input = false;
            }
            dev->is_lp_input = true;
            dev->lastError   = MIDI_Driver::SetLaunchIn(dev->index);
        }
        if (type == "lpout") {
            for (auto& d : MIDI_Driver::GetOutputDevices()) {
                d.second.is_lp_output = false;
            }
            dev->is_main_output = false;
            dev->is_lp_output   = true;
            dev->lastError      = MIDI_Driver::SetLaunchOut(dev->index);
        }
        if (type == "mainout") {
            for (auto& d : MIDI_Driver::GetOutputDevices()) {
                d.second.is_main_output = false;
            }
            dev->is_lp_output   = false;
            dev->is_main_output = true;
            dev->lastError      = MIDI_Driver::SetMainOut(dev->index);
        }

        UpdateDeviceList();
    }

signals:
    void deviceListUpdated(QJsonArray& list);

private:
    QJsonArray m_DeviceList;
};