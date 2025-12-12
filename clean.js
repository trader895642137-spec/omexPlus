(async () => {
    const { deleteAsync } = await import('del');

    await deleteAsync([
        'chromeExtension/build/omex.bundle.js'
    ]);
})();