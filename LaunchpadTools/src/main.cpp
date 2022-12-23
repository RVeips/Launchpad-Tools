// ---------------------------------------------------------------------
// CFXS L0 ARM Debugger <https://github.com/CFXS/CFXS-L0-ARM-Debugger>
// Copyright (C) 2022 | CFXS
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>
// ---------------------------------------------------------------------
// [CFXS] //
// #include <Core/L0_Application.hpp>
#include <Log/Log.hpp>
#include <QApplication>
#include <Core/ChromeDriver.hpp>
#include <Core/MIDI/MIDI_Driver.hpp>
#include <Core/MIDI_Bind.hpp>
#include <QFile>
#include <QJsonDocument>

MIDI_Bind* MIDI_Bind::s_MIDI_Bind_Instance = nullptr;

class App : public QApplication {
public:
    App(int argc, char** argv) : QApplication(argc, argv) {
    }
    virtual ~App() {
        QFile f(QCoreApplication::applicationDirPath() + "/session.cfg");
        f.open(QIODevice::ReadWrite | QIODevice::Truncate);
        f.write(QJsonDocument{MIDI_Bind::GetConfig()}.toJson(QJsonDocument::Indented));
        f.close();
    }
};

int main(int argc, char** argv) {
    Logger::Initialize();

    qputenv("QTWEBENGINE_CHROMIUM_FLAGS", "--remote-debugging-port=10102");

    ChromeDriver::Initialize();
    MIDI_Driver::Initialize();

    App app(argc, argv);
    app.setApplicationVersion(CFXS_VERSION_STRING);
    app.setApplicationName(CFXS_PROGRAM_NAME);
    app.setApplicationDisplayName(CFXS_PROGRAM_NAME " - " CFXS_VERSION_STRING);

    ChromeDriver::OpenWindow();

    return app.exec();
}