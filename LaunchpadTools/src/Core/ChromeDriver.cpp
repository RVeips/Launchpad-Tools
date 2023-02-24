#include "ChromeDriver.hpp"
#include <qabstractsocket.h>
#include <qjsonarray.h>
#include <qudpsocket.h>

#include <QWebEngineView>
#include <QWebEngineProfile>
#include <QWebEngineSettings>
#include <QWebEngineUrlSchemeHandler>
#include <QWebEngineUrlRequestJob>
#include <QWebEngineUrlScheme>
#include <QMessageBox>
#include <QCloseEvent>
#include <QElapsedTimer>
#include <QFile>
#include <QTimer>
#include <QObject>
#include <QJsonObject>
#include <QJsonArray>
#include <QWebChannel>
#include <QCoreApplication>
#include <QJsonDocument>
#include "Log/Log.hpp"
#include "MIDI_Bind.hpp"
#include <QUdpSocket>

#define SCHEMENAME "CFXS"
static const QByteArray SCHEME_NAME = SCHEMENAME;
static const QUrl INDEX             = {SCHEMENAME ":LaunchPad_X.html"};
class UI_Handler : public QWebEngineUrlSchemeHandler {
public:
    explicit UI_Handler(QObject* parent = nullptr) {
    }
    void requestStarted(QWebEngineUrlRequestJob* job) override {
        static const QByteArray GET(QByteArrayLiteral("GET"));

        QByteArray method = job->requestMethod();
        QUrl url          = job->requestUrl();
        QUrl initiator    = job->initiator();

        if (method == GET) {
            // auto rootPath = QSL("X:/CFXS/Launchpad-Tools/LaunchpadTools/interface/");
            auto rootPath = QCoreApplication::applicationDirPath() + QSL("/ui/");
            auto fpath    = rootPath + url.toString().split(QChar{':'})[1];
            QFile* file   = new QFile(fpath, job);
            if (file->open(QIODevice::ReadOnly)) {
                if (fpath.contains(".htm"))
                    job->reply(QByteArrayLiteral("text/html"), file);
                else if (fpath.contains(".css"))
                    job->reply(QByteArrayLiteral("text/css"), file);
                else if (fpath.contains(".js"))
                    job->reply(QByteArrayLiteral("text/javascript"), file);
                else
                    job->reply(QByteArrayLiteral("text/plain"), file);
            } else {
                LOG_ERROR("Failed to open file: {}", QSL("ui/") + url.toString().split(QChar{':'})[1]);
                job->fail(QWebEngineUrlRequestJob::UrlNotFound);
            }
        } else {
            LOG_ERROR("Failed to load URL: {}", url.toString());
            job->fail(QWebEngineUrlRequestJob::UrlNotFound);
        }
    }

    static void registerUrlScheme() {
        QWebEngineUrlScheme webUiScheme(SCHEME_NAME);
        webUiScheme.setFlags(QWebEngineUrlScheme::SecureScheme | QWebEngineUrlScheme::LocalScheme |
                             QWebEngineUrlScheme::LocalAccessAllowed);
        QWebEngineUrlScheme::registerScheme(webUiScheme);
    }
};

class UI_View : public QWebEngineView {
public:
    UI_View(QWidget* parent = nullptr) : QWebEngineView(parent) {
    }
    ~UI_View() = default;

protected:
    void closeEvent(QCloseEvent* event) {
        // QMessageBox::StandardButton resBtn =
        //     QMessageBox::question(this, CFXS_PROGRAM_NAME, tr("Close window?\n"), QMessageBox::Cancel | QMessageBox::Yes, QMessageBox::Yes);
        // if (resBtn != QMessageBox::Yes) {
        //     event->ignore();
        // } else {
        //     event->accept();
        // }
        event->accept();
    }
};

void ChromeDriver::Initialize() {
    LOG_TRACE("Initialize ChromeDriver");

    UI_Handler::registerUrlScheme();
}

void ChromeDriver::OpenWindow() {
    LOG_TRACE("Open Window");

    auto profile         = new QWebEngineProfile(QWebEngineProfile::defaultProfile());
    auto profileSettings = profile->settings();
    profileSettings->setAttribute(QWebEngineSettings::PluginsEnabled, false);
    profileSettings->setAttribute(QWebEngineSettings::DnsPrefetchEnabled, false);
    profileSettings->setAttribute(QWebEngineSettings::XSSAuditingEnabled, false);
    profileSettings->setAttribute(QWebEngineSettings::LocalContentCanAccessFileUrls, true);
    profile->installUrlSchemeHandler(SCHEME_NAME, new UI_Handler);

    auto view = new UI_View;
    auto page = new QWebEnginePage(profile);

    auto midiBind    = new MIDI_Bind;
    auto mainChannel = new QWebChannel(page);
    mainChannel->registerObject("midi", midiBind);
    page->setWebChannel(mainChannel);

    view->setPage(page);
    view->setContextMenuPolicy(Qt::NoContextMenu);

    QObject::connect(page, &QWebEnginePage::loadFinished, [=]() {
        QFile f(QCoreApplication::applicationDirPath() + "/session.cfg");
        if (f.open(QIODevice::ReadOnly)) {
            auto res               = f.readAll();
            MIDI_Bind::GetConfig() = QJsonDocument::fromJson(res).object();
            midiBind->Notify();
            f.close();
        }

        if (!MIDI_Bind::GetConfig().contains("brightness")) {
            MIDI_Bind::GetConfig()["brightness"] = 1.0f;
        }

        if (!MIDI_Bind::GetConfig().contains("toggle_mode")) {
            MIDI_Bind::GetConfig()["toggle_mode"] = QJsonObject{};
        }

        if (!MIDI_Bind::GetConfig().contains("color")) {
            QJsonObject cobj;
            for (int i = 11; i < 100; i++) {
                cobj[QString::number(i)] = QJsonObject{
                    {"off", QJsonArray{0, 0, 0}},
                    {"on", QJsonArray{1, 1, 1}},
                    {"mode", "solid"},
                    {"off_solid", true},
                    {"palette_on", 3},
                    {"palette_off", 0},
                };
            }
            MIDI_Bind::GetConfig()["color"] = cobj;
        }

        midiBind->Notify();

        midiBind->UpdateDeviceList();

        view->setZoomFactor(1.5);
        page->setBackgroundColor(QColor{16, 16, 16});
        view->showMaximized();

        auto socket = new QUdpSocket();
        bool result = socket->bind(QHostAddress{MIDI_Bind::GetConfig()["link_ip"].toString()}, 1234);
        LOG_CRITICAL("Res: {}", result);

        struct Color {
            float r, g, b;
        };
        static std::array<Color, 200> s_Colors;
        float color_div = MIDI_Bind::GetConfig()["color_div"].toDouble();

        QObject::connect(socket, &QUdpSocket::readyRead, [=]() {
            QHostAddress sender;
            uint16_t port;
            while (socket->hasPendingDatagrams()) {
                QByteArray datagram;
                datagram.resize(socket->pendingDatagramSize());
                socket->readDatagram(datagram.data(), datagram.size(), &sender, &port);
                auto str = QString(datagram);
                for (auto s : str.split(";")) {
                    if (s.size() == 0)
                        continue;
                    if (s.contains("s")) {
                        auto sp = s.split("s");
                        int idx = sp[0].toInt();
                        float r = sp[1] == "1" ? s_Colors[idx].r : s_Colors[idx].r / color_div;
                        float g = sp[1] == "1" ? s_Colors[idx].g : s_Colors[idx].g / color_div;
                        float b = sp[1] == "1" ? s_Colors[idx].b : s_Colors[idx].b / color_div;
                        midiBind->SetColorConfig(idx, 1, 1, 1, r, g, b, "solid", true, QJsonArray{0, 0});
                        midiBind->ColorUpdate();
                    } else {
                        auto sp         = s.split("c");
                        int idx         = sp[0].toInt();
                        float r         = sp[1].mid(0, 2).toInt(nullptr, 16) / 255.0f;
                        float g         = sp[1].mid(2, 2).toInt(nullptr, 16) / 255.0f;
                        float b         = sp[1].mid(4, 2).toInt(nullptr, 16) / 255.0f;
                        s_Colors[idx].r = r;
                        s_Colors[idx].g = g;
                        s_Colors[idx].b = b;
                        midiBind->SetColorConfig(idx, 1, 1, 1, r, g, b, "solid", true, QJsonArray{0, 0});
                        midiBind->ColorUpdate();
                    }
                }
            }
        });
    });

    page->load(INDEX);
}