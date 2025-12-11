import {deleteAsync} from 'del';

(async () => {
    await deleteAsync(['chromeExtension/build/omex.bundle.js']);
})();
