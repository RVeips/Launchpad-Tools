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
#include <QApplication>

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

        if (method == GET && url == INDEX) {
            auto fpath  = QCoreApplication::applicationDirPath() + QSL("/ui/") + url.toString().split(QChar{':'})[1];
            QFile* file = new QFile(fpath, job);
            if (file->open(QIODevice::ReadOnly)) {
                job->reply(QByteArrayLiteral("text/html"), file);
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
    view->setPage(page);
    page->load(INDEX);
    view->setContextMenuPolicy(Qt::NoContextMenu);
    view->showMaximized();
    page->setBackgroundColor(QColor{16, 16, 16});
}