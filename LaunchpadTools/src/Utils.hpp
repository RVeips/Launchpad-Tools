#pragma once
#include <QElapsedTimer>
#include <QDebug>

struct TimeExec {
    TimeExec(const char* n) {
        name = n;
        t.start();
    }
    ~TimeExec() {
        char str[128];
        snprintf(str, 128, "[%s] %.1f us", name, t.nsecsElapsed() / 1000.0f);
        qDebug() << str;
    }

    QElapsedTimer t;
    const char* name;
};