import { showNotification } from "./common";

(function () {
    const originalFetch = window.fetch;

    if (originalFetch) {
        window.fetch = async function (...args) {
            try {
                const response = await originalFetch.apply(this, args);
                if (!response.ok) {

                    showNotification({
                        title: 'مشکل ریکویست',
                        body: args[0],
                        tag: `request_issue`
                    });
                }
                return response;
            } catch (err) {
                showNotification({
                    title: 'مشکل ریکویست',
                    body: args[0],
                    tag: `request_issue`
                });
                throw err;
            }
        };
    }
})();

// ==== Hook XHR ====
(function () {
    const open = XMLHttpRequest.prototype.open;
    const send = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this._url = url;
        return open.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
        this.addEventListener("load", function () {
            if (this.status >= 400) {
                showNotification({
                    title: 'مشکل ریکویست',
                    body: this._url,
                    tag: `request_issue`
                });
            }
        });

        this.addEventListener("error", function () {
            showNotification({
                title: 'مشکل ریکویست',
                body: this._url,
                tag: `request_issue`
            });
        });

        return send.apply(this, arguments);
    };
})();


