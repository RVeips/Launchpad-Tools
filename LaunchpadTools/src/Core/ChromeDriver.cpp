#include "ChromeDriver.hpp"

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
#include "MIDI_Bind.hpp"

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
            auto rootPath = QSL("X:/CFXS/Launchpad-Tools/LaunchpadTools/interface/");
            // auto rootPath = QCoreApplication::applicationDirPath() + QSL("/ui/");
            auto fpath  = rootPath + url.toString().split(QChar{':'})[1];
            QFile* file = new QFile(fpath, job);
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

        if (!midiBind->GetConfig().contains("brightness")) {
            midiBind->GetConfig()["brightness"] = 0.5f;
        }

        if (!midiBind->GetConfig().contains("toggle_mode")) {
            midiBind->GetConfig()["toggle_mode"] = QJsonObject{};
        }

        if (!midiBind->GetConfig().contains("color")) {
            QJsonObject cobj;
            for (int i = 11; i < 100; i++) {
                cobj[QString::number(i)] = QJsonObject{
                    {"off", QJsonArray{0, 0, 0}},
                    {"on", QJsonArray{1, 1, 1}},
                    {"mode", "solid"},
                    {"off_solid", false},
                };
            }
            midiBind->GetConfig()["color"] = cobj;
        }

        midiBind->Notify();

        midiBind->UpdateDeviceList();

        view->setZoomFactor(1.5);
        page->setBackgroundColor(QColor{16, 16, 16});
        view->showMaximized();
    });

    page->load(INDEX);
}