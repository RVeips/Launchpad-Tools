#include <qdebug.h>
#include <QObject>
#include <QJsonObject>
#include <QJsonArray>
#include <Core/MIDI/MIDI_Driver.hpp>

class MIDI_Bind : public QObject {
    Q_OBJECT
    Q_PROPERTY(QJsonArray deviceList MEMBER m_DeviceList NOTIFY deviceListUpdated)
    Q_PROPERTY(QJsonObject config MEMBER m_Config NOTIFY configUpdated)

    static MIDI_Bind* s_MIDI_Bind_Instance;

public:
    MIDI_Bind(QObject* parent = nullptr) : QObject(parent) {
        s_MIDI_Bind_Instance = this;

        MIDI_Driver::s_NoteOnCallback = [&](uint8_t pad, uint8_t power) {
            emit noteOn(pad, power);
        };
        MIDI_Driver::s_NoteOffCallback = [&](uint8_t pad, uint8_t power) {
            emit noteOff(pad, power);
        };
    }
    virtual ~MIDI_Bind() = default;

    static QJsonObject& GetConfig() {
        return s_MIDI_Bind_Instance->m_Config;
    }

    void Notify() {
        emit configUpdated(m_Config);
    }

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
    void SetBrightness(float brightness) {
        m_Config["brightness"] = brightness;
        MIDI_Driver::SetBrightness(brightness);
    }

    void SetToggleMode(int midi_index, bool mode) {
        auto ob                         = m_Config["toggle_mode"].toObject();
        ob[QString::number(midi_index)] = mode;
        m_Config["toggle_mode"]         = ob;
        MIDI_Driver::SetToggleMode(midi_index, mode);
    }

    void SetColorConfig(int midi_index,
                        float r_a,
                        float g_a,
                        float b_a,
                        float r_b,
                        float g_b,
                        float b_b,
                        const QString& mode,
                        bool off_solid,
                        const QJsonArray& palette) {
        auto mainObj                         = m_Config["color"].toObject();
        auto specObj                         = mainObj[QString::number(midi_index)].toObject();
        specObj["off_solid"]                 = off_solid;
        specObj["mode"]                      = mode;
        specObj["on"]                        = QJsonArray{r_a, g_a, b_a};
        specObj["off"]                       = QJsonArray{r_b, g_b, b_b};
        specObj["palette_on"]                = palette[0].toInt();
        specObj["palette_off"]               = palette[1].toInt();
        mainObj[QString::number(midi_index)] = specObj;
        m_Config["color"]                    = mainObj;
        MIDI_Driver::SetColorConfig(midi_index, r_a, g_a, b_a, r_b, g_b, b_b, mode, off_solid, palette[0].toInt(), palette[1].toInt());
    }

    void ColorUpdate() {
        emit configUpdated(m_Config);
    }

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
    void deviceListUpdated(QJsonArray list);
    void configUpdated(QJsonObject cfg);
    void noteOn(int pad, int power);
    void noteOff(int pad, int power);

private:
    QJsonArray m_DeviceList;
    QJsonObject m_Config;
};